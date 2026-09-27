const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function main() {
    const connection = await mysql.createConnection(config);

    try {
        console.log('=== ЛР №22. Задание 2 — CRUD ===\n');

        // Создание таблицы
        await connection.execute(`
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

        console.log('✔ Таблица students создана');

        // Очищаем таблицу для повторного запуска
        await connection.execute('DELETE FROM students');

        // =========================
        // CREATE
        // =========================

        console.log('\n=== CREATE ===');

        const [one] = await connection.execute(
            `INSERT INTO students
            (name, group_name, course, grade)
            VALUES (?, ?, ?, ?)`,
            ['Минчук Станислав Игоревич', 'ББМО-01-23', 3, 8.75]
        );

        console.log(`Добавлен студент с ID: ${one.insertId}`);

        const students = [
            ['Иванов Иван Иванович', 'ББМО-01-23', 3, 8.50],
            ['Петров Петр Петрович', 'ББМО-02-23', 3, 7.90],
            ['Сидорова Анна Сергеевна', 'ББМО-01-23', 2, 9.20],
            ['Кузнецов Алексей Николаевич', 'ББМО-02-23', 4, 8.10]
        ];

        for (const student of students) {
            await connection.execute(
                `INSERT INTO students
                (name, group_name, course, grade)
                VALUES (?, ?, ?, ?)`,
                student
            );
        }

        console.log(`Добавлено ещё студентов: ${students.length}`);

        // =========================
        // READ
        // =========================

        console.log('\n=== READ ===');

        const [allStudents] = await connection.execute(`
            SELECT *
            FROM students
            ORDER BY id
        `);

        console.table(allStudents);

        // Поиск по группе
        console.log('\nСтуденты группы ББМО-01-23:');

        const [groupStudents] = await connection.execute(
            `SELECT *
             FROM students
             WHERE group_name = ?
             ORDER BY name`,
            ['ББМО-01-23']
        );

        console.table(groupStudents);

        // Сортировка по оценке
        console.log('\nСтуденты по успеваемости:');

        const [sortedStudents] = await connection.execute(`
            SELECT name, group_name, course, grade
            FROM students
            ORDER BY grade DESC
        `);

        console.table(sortedStudents);

        // Пагинация
        console.log('\nПагинация: LIMIT 2 OFFSET 0');

        const [page] = await connection.execute(`
            SELECT *
            FROM students
            ORDER BY id
            LIMIT ? OFFSET ?
        `, [2, 0]);

        console.table(page);

        // =========================
        // UPDATE
        // =========================

        console.log('\n=== UPDATE ===');

        const [updateResult] = await connection.execute(
            `UPDATE students
             SET grade = ?
             WHERE name = ?`,
            [9.50, 'Минчук Станислав Игоревич']
        );

        console.log(`Изменено строк: ${updateResult.affectedRows}`);
        console.log(`Фактически изменено: ${updateResult.changedRows}`);

        const [updatedStudent] = await connection.execute(
            `SELECT *
             FROM students
             WHERE name = ?`,
            ['Минчук Станислав Игоревич']
        );

        console.table(updatedStudent);

        // =========================
        // DELETE
        // =========================

        console.log('\n=== DELETE ===');

        const [deleteResult] = await connection.execute(
            `DELETE FROM students
             WHERE name = ?`,
            ['Кузнецов Алексей Николаевич']
        );

        console.log(`Удалено строк: ${deleteResult.affectedRows}`);

        // =========================
        // SQL INJECTION PROTECTION
        // =========================

        console.log('\n=== Защита от SQL-инъекций ===');

        const dangerousInput = "' OR '1'='1";

        const [safeResult] = await connection.execute(
            `SELECT *
             FROM students
             WHERE name = ?`,
            [dangerousInput]
        );

        console.log(
            `Результат безопасного параметризованного запроса: ${safeResult.length} строк`
        );

        // =========================
        // ФИНАЛЬНЫЙ СПИСОК
        // =========================

        console.log('\n=== Итоговый список ===');

        const [finalStudents] = await connection.execute(`
            SELECT *
            FROM students
            ORDER BY id
        `);

        console.table(finalStudents);

        console.log('\n✔ CRUD-задание выполнено успешно');

    } catch (error) {

        console.error('\n❌ Ошибка MySQL:');
        console.error(`Код: ${error.code}`);
        console.error(`Сообщение: ${error.message}`);

    } finally {

        await connection.end();
        console.log('\n✔ Соединение закрыто');
    }
}

main();