const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

class StudentDAO {
    constructor(pool) {
        this.pool = pool;
    }

    validate(data) {
        if (!data.name || !data.name.trim()) {
            throw new Error('Имя студента обязательно');
        }

        if (!data.group_name || !data.group_name.trim()) {
            throw new Error('Группа обязательна');
        }

        if (!Number.isInteger(Number(data.course)) ||
            Number(data.course) < 1 ||
            Number(data.course) > 6) {
            throw new Error('Курс должен быть от 1 до 6');
        }

        if (data.grade !== null &&
            data.grade !== undefined &&
            (Number(data.grade) < 0 || Number(data.grade) > 10)) {
            throw new Error('Оценка должна быть от 0 до 10');
        }
    }

    async create(student) {
        this.validate(student);

        const [result] = await this.pool.execute(
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

        return this.findById(result.insertId);
    }

    async findById(id) {
        const [rows] = await this.pool.execute(
            `SELECT *
             FROM students
             WHERE id = ?`,
            [id]
        );

        return rows[0] || null;
    }

    async findAll(options = {}) {
        const {
            group,
            course,
            gradeMin,
            gradeMax,
            search,
            page = 1,
            limit = 10,
            sort = 'id'
        } = options;

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

        if (gradeMin !== undefined) {
            conditions.push('grade >= ?');
            params.push(Number(gradeMin));
        }

        if (gradeMax !== undefined) {
            conditions.push('grade <= ?');
            params.push(Number(gradeMax));
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
            group: 'group_name',
            course: 'course',
            grade: 'grade',
            created_at: 'created_at'
        };

        const sortField = allowedSort[sort] || 'id';

        const offset = (Number(page) - 1) * Number(limit);

        const [rows] = await this.pool.execute(
            `SELECT *
             FROM students
             ${where}
             ORDER BY ${sortField}
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        return rows;
    }

    async update(id, student) {
        this.validate(student);

        const [result] = await this.pool.execute(
            `UPDATE students
             SET name = ?,
                 group_name = ?,
                 course = ?,
                 grade = ?
             WHERE id = ?`,
            [
                student.name,
                student.group_name,
                student.course,
                student.grade ?? null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return null;
        }

        return this.findById(id);
    }

    async delete(id) {
        const [result] = await this.pool.execute(
            `DELETE FROM students
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    async search(text) {
        const [rows] = await this.pool.execute(
            `SELECT *
             FROM students
             WHERE name LIKE ?
                OR group_name LIKE ?
             ORDER BY name`,
            [`%${text}%`, `%${text}%`]
        );

        return rows;
    }

    async getStats() {
        const [general] = await this.pool.execute(`
            SELECT
                COUNT(*) AS total_students,
                ROUND(AVG(grade), 2) AS average_grade,
                MIN(grade) AS min_grade,
                MAX(grade) AS max_grade
            FROM students
        `);

        const [byGroup] = await this.pool.execute(`
            SELECT
                group_name,
                COUNT(*) AS students_count,
                ROUND(AVG(grade), 2) AS average_grade
            FROM students
            GROUP BY group_name
            ORDER BY group_name
        `);

        const [byCourse] = await this.pool.execute(`
            SELECT
                course,
                COUNT(*) AS students_count,
                ROUND(AVG(grade), 2) AS average_grade
            FROM students
            GROUP BY course
            ORDER BY course
        `);

        return {
            general: general[0],
            byGroup,
            byCourse
        };
    }
}

async function main() {
    const pool = mysql.createPool({
        ...config,
        connectionLimit: 10,
        waitForConnections: true
    });

    const dao = new StudentDAO(pool);

    try {
        console.log('======================================');
        console.log('ЛР №22 — ЗАДАНИЕ 4');
        console.log('StudentDAO');
        console.log('======================================');

        // Создание
        console.log('\n=== CREATE ===');

        const student = await dao.create({
            name: 'DAO Студент',
            group_name: 'ББМО-01-23',
            course: 3,
            grade: 8.90
        });

        console.log('Создан студент:');
        console.table([student]);

        // Поиск по ID
        console.log('\n=== FIND BY ID ===');

        const found = await dao.findById(student.id);

        console.table([found]);

        // Получение списка
        console.log('\n=== FIND ALL ===');

        const students = await dao.findAll({
            group: 'ББМО-01-23',
            page: 1,
            limit: 10,
            sort: 'name'
        });

        console.table(students);

        // Поиск
        console.log('\n=== SEARCH ===');

        const searchResult = await dao.search('DAO');

        console.table(searchResult);

        // Фильтрация
        console.log('\n=== ФИЛЬТРАЦИЯ ===');

        const filtered = await dao.findAll({
            course: 3,
            gradeMin: 8,
            gradeMax: 10,
            page: 1,
            limit: 10,
            sort: 'grade'
        });

        console.table(filtered);

        // UPDATE
        console.log('\n=== UPDATE ===');

        const updated = await dao.update(student.id, {
            name: 'DAO Студент Обновлённый',
            group_name: 'ББМО-01-23',
            course: 4,
            grade: 9.50
        });

        console.table([updated]);

        // Статистика
        console.log('\n=== STATISTICS ===');

        const stats = await dao.getStats();

        console.log('Общая статистика:');
        console.table([stats.general]);

        console.log('По группам:');
        console.table(stats.byGroup);

        console.log('По курсам:');
        console.table(stats.byCourse);

        // DELETE
        console.log('\n=== DELETE ===');

        const deleted = await dao.delete(student.id);

        console.log(
            deleted
                ? '✔ Студент удалён'
                : 'Студент не найден'
        );

        console.log('\n✔ StudentDAO работает успешно');

    } catch (error) {
        console.error('\n❌ Ошибка:');
        console.error(error.message);

    } finally {
        await pool.end();
        console.log('\n✔ Пул соединений закрыт');
    }
}

main();