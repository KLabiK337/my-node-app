const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function testConnectionError() {
    console.log('\n=== 1. Проверка ошибки подключения ===');

    let connection;

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 9999,
            user: config.user,
            password: config.password,
            database: config.database,
            connectTimeout: 3000
        });

    } catch (error) {
        console.log(`Код ошибки: ${error.code}`);
        console.log(`Сообщение: ${error.message}`);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function testAccessError() {
    console.log('\n=== 2. Проверка ошибки доступа ===');

    try {
        const connection = await mysql.createConnection({
            ...config,
            password: 'wrong_password'
        });

        await connection.end();

    } catch (error) {
        console.log(`Код ошибки: ${error.code}`);
        console.log(`Сообщение: ${error.message}`);
    }
}

async function testSqlError() {
    console.log('\n=== 3. Проверка SQL-ошибки ===');

    const connection = await mysql.createConnection(config);

    try {
        await connection.execute(`
            SELECT * FROM table_that_does_not_exist
        `);

    } catch (error) {
        console.log(`Код ошибки: ${error.code}`);
        console.log(`Сообщение: ${error.message}`);
    } finally {
        await connection.end();
    }
}

async function generateLargeData(connection) {
    console.log('\n=== 4. Генерация 100 000 записей ===');

    await connection.execute(`
        CREATE TABLE IF NOT EXISTS big_data (
            id INT PRIMARY KEY AUTO_INCREMENT,
            value INT NOT NULL,
            text_value VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
    `);

    await connection.execute('TRUNCATE TABLE big_data');

    const start = Date.now();

    const batchSize = 1000;

    for (let i = 0; i < 100000; i += batchSize) {

        const values = [];

        for (let j = 0; j < batchSize && i + j < 100000; j++) {
            values.push([
                Math.floor(Math.random() * 1000) + 1,
                `Запись №${i + j + 1}`
            ]);
        }

        await connection.query(
            `INSERT INTO big_data (value, text_value)
             VALUES ?`,
            [values]
        );

        if ((i + batchSize) % 10000 === 0) {
            console.log(`Добавлено: ${Math.min(i + batchSize, 100000)}`);
        }
    }

    console.log(`✔ 100 000 записей созданы за ${Date.now() - start} мс`);
}

async function streamData(connection) {
    console.log('\n=== 5. Потоковое чтение данных ===');

    const start = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    let count = 0;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;

    const stream = connection.connection.query(
        'SELECT id, value, text_value FROM big_data'
    ).stream();

    for await (const row of stream) {

        count++;
        sum += row.value;

        if (row.value < min) {
            min = row.value;
        }

        if (row.value > max) {
            max = row.value;
        }

        if (count % 20000 === 0) {
            console.log(`Обработано: ${count}`);
        }
    }

    const endMemory = process.memoryUsage().heapUsed;

    console.log(`✔ Обработано записей: ${count}`);
    console.log(`Сумма: ${sum}`);
    console.log(`Среднее: ${(sum / count).toFixed(2)}`);
    console.log(`Минимум: ${min}`);
    console.log(`Максимум: ${max}`);
    console.log(
        `Память: ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`Время: ${Date.now() - start} мс`);
}

async function transactionDemo(connection) {
    console.log('\n=== 6. Транзакция ===');

    try {

        await connection.beginTransaction();

        console.log('✔ Транзакция начата');

        await connection.execute(
            `INSERT INTO students
             (name, group_name, course, grade)
             VALUES (?, ?, ?, ?)`,
            ['Тестовый студент 1', 'ББМО-01-23', 3, 8.00]
        );

        await connection.execute(
            `INSERT INTO students
             (name, group_name, course, grade)
             VALUES (?, ?, ?, ?)`,
            ['Тестовый студент 2', 'ББМО-01-23', 3, 9.00]
        );

        console.log('✔ Две записи добавлены');

        await connection.rollback();

        console.log('✔ Выполнен ROLLBACK');
        console.log('Добавленные записи отменены');

    } catch (error) {

        await connection.rollback();

        console.log(`❌ Ошибка транзакции: ${error.message}`);
    }
}

async function transactionCommit(connection) {
    console.log('\n=== 7. Транзакция COMMIT ===');

    try {

        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO students
             (name, group_name, course, grade)
             VALUES (?, ?, ?, ?)`,
            ['Транзакционный студент', 'ББМО-01-23', 3, 8.80]
        );

        await connection.commit();

        console.log('✔ Транзакция успешно завершена COMMIT');

    } catch (error) {

        await connection.rollback();

        console.log(`❌ Ошибка: ${error.message}`);
    }
}

async function main() {

    console.log('========================================');
    console.log('ЛР №22 — ЗАДАНИЕ 3');
    console.log('Обработка ошибок, потоки и транзакции');
    console.log('========================================');

    await testConnectionError();

    await testAccessError();

    await testSqlError();

    const connection = await mysql.createConnection(config);

    try {

        console.log('\n✔ Основное соединение установлено');

        await generateLargeData(connection);

        await streamData(connection);

        await transactionDemo(connection);

        await transactionCommit(connection);

    } catch (error) {

        console.error('\n❌ Критическая ошибка:');
        console.error(`Код: ${error.code}`);
        console.error(`Сообщение: ${error.message}`);

    } finally {

        await connection.end();

        console.log('\n✔ Соединение закрыто');
        console.log('=== Задание 3 завершено ===');
    }
}

main();