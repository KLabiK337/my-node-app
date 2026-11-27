const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = new Koa();
const router = new Router();

const PORT = 3000;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

const cache = new Map();
const CACHE_TIME = 5 * 60 * 1000;

// ==============================
// Middleware обработки ошибок
// ==============================

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        console.error(error);

        ctx.status = error.status || 500;

        ctx.body = {
            error: error.message || 'Внутренняя ошибка сервера'
        };
    }
});

// ==============================
// Body parser
// ==============================

app.use(bodyParser());

// ==============================
// Логирование
// ==============================

app.use(async (ctx, next) => {
    const start = Date.now();

    await next();

    const time = Date.now() - start;

    console.log(
        `${ctx.method} ${ctx.path} - ${ctx.status} - ${time} ms`
    );
});

// ==============================
// Создание таблицы
// ==============================

async function initDatabase() {

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS students (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            group_name VARCHAR(20) NOT NULL,
            course INT NOT NULL,
            grade DECIMAL(3,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
    `);

    console.log('✔ Таблица students готова');
}

// ==============================
// Главная страница
// ==============================

router.get('/', ctx => {

    ctx.body = {
        message: 'ЛР №22 — MySQL REST API',
        student: 'Минчук Станислав Игоревич',
        group: 'ББМО-01-23',
        database: 'bbmo_01_23',
        endpoints: [
            'GET /api/students',
            'GET /api/students/:id',
            'POST /api/students',
            'PUT /api/students/:id',
            'DELETE /api/students/:id',
            'GET /api/students/stats'
        ]
    };
});

// ==============================
// GET ALL
// ==============================

router.get('/api/students', async ctx => {

    const {
        group,
        course,
        search,
        page = 1,
        limit = 10,
        sort = 'id'
    } = ctx.query;

    const cacheKey = JSON.stringify({
        group,
        course,
        search,
        page,
        limit,
        sort
    });

    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.time < CACHE_TIME) {

        ctx.set('X-Cache', 'HIT');

        ctx.body = cached.data;

        return;
    }

    const conditions = [];
    const params = [];

    if (group) {
        conditions.push('group_name = ?');
        params.push(group);
    }

    if (course) {
        conditions.push('course = ?');
        params.push(Number(course));
    }

    if (search) {
        conditions.push('name LIKE ?');
        params.push(`%${search}%`);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const allowedSort = {
        id: 'id',
        name: 'name',
        course: 'course',
        grade: 'grade',
        group: 'group_name'
    };

    const sortField = allowedSort[sort] || 'id';

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const offset = (pageNumber - 1) * limitNumber;

    const [rows] = await pool.execute(
        `SELECT *
         FROM students
         ${where}
         ORDER BY ${sortField}
         LIMIT ? OFFSET ?`,
        [...params, limitNumber, offset]
    );

    const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total
         FROM students
         ${where}`,
        params
    );

    const result = {
        data: rows,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            total: countRows[0].total,
            pages: Math.ceil(
                countRows[0].total / limitNumber
            )
        }
    };

    cache.set(cacheKey, {
        time: Date.now(),
        data: result
    });

    ctx.set('X-Cache', 'MISS');

    ctx.body = result;
});

// ==============================
// GET ONE
// ==============================

router.get('/api/students/:id', async ctx => {

    const id = Number(ctx.params.id);

    if (!Number.isInteger(id)) {
        ctx.status = 400;

        ctx.body = {
            error: 'Некорректный ID'
        };

        return;
    }

    const [rows] = await pool.execute(
        `SELECT *
         FROM students
         WHERE id = ?`,
        [id]
    );

    if (rows.length === 0) {

        ctx.status = 404;

        ctx.body = {
            error: 'Студент не найден'
        };

        return;
    }

    ctx.body = rows[0];
});

// ==============================
// POST
// ==============================

router.post('/api/students', async ctx => {

    const {
        name,
        group_name,
        course,
        grade
    } = ctx.request.body;

    if (!name || !group_name || !course) {

        ctx.status = 400;

        ctx.body = {
            error: 'name, group_name и course обязательны'
        };

        return;
    }

    if (
        !Number.isInteger(Number(course)) ||
        Number(course) < 1 ||
        Number(course) > 6
    ) {

        ctx.status = 400;

        ctx.body = {
            error: 'Курс должен быть от 1 до 6'
        };

        return;
    }

    if (
        grade !== undefined &&
        grade !== null &&
        (Number(grade) < 0 || Number(grade) > 10)
    ) {

        ctx.status = 400;

        ctx.body = {
            error: 'Оценка должна быть от 0 до 10'
        };

        return;
    }

    const [result] = await pool.execute(
        `INSERT INTO students
        (name, group_name, course, grade)
        VALUES (?, ?, ?, ?)`,
        [
            name,
            group_name,
            course,
            grade ?? null
        ]
    );

    cache.clear();

    ctx.status = 201;

    ctx.body = {
        message: 'Студент создан',
        id: result.insertId
    };
});

// ==============================
// PUT
// ==============================

router.put('/api/students/:id', async ctx => {

    const id = Number(ctx.params.id);

    if (!Number.isInteger(id)) {

        ctx.status = 400;

        ctx.body = {
            error: 'Некорректный ID'
        };

        return;
    }

    const {
        name,
        group_name,
        course,
        grade
    } = ctx.request.body;

    if (!name || !group_name || !course) {

        ctx.status = 400;

        ctx.body = {
            error: 'name, group_name и course обязательны'
        };

        return;
    }

    const [result] = await pool.execute(
        `UPDATE students
         SET name = ?,
             group_name = ?,
             course = ?,
             grade = ?
         WHERE id = ?`,
        [
            name,
            group_name,
            course,
            grade ?? null,
            id
        ]
    );

    if (result.affectedRows === 0) {

        ctx.status = 404;

        ctx.body = {
            error: 'Студент не найден'
        };

        return;
    }

    cache.clear();

    ctx.body = {
        message: 'Студент обновлён'
    };
});

// ==============================
// DELETE
// ==============================

router.delete('/api/students/:id', async ctx => {

    const id = Number(ctx.params.id);

    const [result] = await pool.execute(
        `DELETE FROM students
         WHERE id = ?`,
        [id]
    );

    if (result.affectedRows === 0) {

        ctx.status = 404;

        ctx.body = {
            error: 'Студент не найден'
        };

        return;
    }

    cache.clear();

    ctx.body = {
        message: 'Студент удалён'
    };
});

// ==============================
// Статистика
// ==============================

router.get('/api/students/stats', async ctx => {

    const [general] = await pool.execute(`
        SELECT
            COUNT(*) AS total_students,
            ROUND(AVG(grade), 2) AS average_grade,
            MIN(grade) AS min_grade,
            MAX(grade) AS max_grade
        FROM students
    `);

    const [groups] = await pool.execute(`
        SELECT
            group_name,
            COUNT(*) AS students_count,
            ROUND(AVG(grade), 2) AS average_grade
        FROM students
        GROUP BY group_name
        ORDER BY group_name
    `);

    const [courses] = await pool.execute(`
        SELECT
            course,
            COUNT(*) AS students_count,
            ROUND(AVG(grade), 2) AS average_grade
        FROM students
        GROUP BY course
        ORDER BY course
    `);

    ctx.body = {
        general: general[0],
        groups,
        courses
    };
});

// ==============================
// Транзакция
// ==============================

router.post('/api/students/transaction', async ctx => {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();

        const students = ctx.request.body.students;

        if (!Array.isArray(students) || students.length === 0) {

            ctx.status = 400;

            throw new Error(
                'Необходимо передать массив students'
            );
        }

        const ids = [];

        for (const student of students) {

            const [result] = await connection.execute(
                `INSERT INTO students
                (name, group_name, course, grade)
                VALUES (?, ?, ?, ?)`,
                [
                    student.name,
                    student.group_name,
                    student.course,
                    student.grade ?? null
                ]
            );

            ids.push(result.insertId);
        }

        await connection.commit();

        cache.clear();

        ctx.status = 201;

        ctx.body = {
            message: 'Транзакция успешно выполнена',
            ids
        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
});

// ==============================
// 404
// ==============================

app.use(router.routes());

app.use(router.allowedMethods());

app.use(async ctx => {

    if (ctx.status === 404) {

        ctx.body = {
            error: 'Маршрут не найден'
        };
    }
});

// ==============================
// Запуск
// ==============================

async function start() {

    try {

        await initDatabase();

        app.listen(PORT, () => {

            console.log('======================================');
            console.log('MySQL REST API запущен');
            console.log(`http://localhost:${PORT}`);
            console.log('======================================');

        });

    } catch (error) {

        console.error('Ошибка запуска:', error.message);

        process.exit(1);
    }
}

start();