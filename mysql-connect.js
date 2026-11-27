const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function singleConnection() {
    let connection;

    console.log('=== Одиночное соединение ===');

    try {
        connection = await mysql.createConnection(config);

        console.log('✔ Подключение установлено');

        const [rows] = await connection.query(`
            SELECT
                VERSION() AS version,
                DATABASE() AS database_name,
                USER() AS user_name
        `);

        console.log(`Версия MySQL: ${rows[0].version}`);
        console.log(`Текущая БД: ${rows[0].database_name}`);
        console.log(`Пользователь: ${rows[0].user_name}`);

    } catch (error) {

        console.error(
            `[${error.code || 'ERROR'}] ${error.message}`
        );

    } finally {

        if (connection) {
            await connection.end();
            console.log('✔ Соединение закрыто');
        }
    }
}

async function connectionPool() {

    console.log('\n=== Пул соединений ===');

    const pool = mysql.createPool({
        ...config,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0
    });

    try {

        console.log('✔ Пул создан (лимит: 10)');

        const [rows] = await pool.query(`
            SELECT
                VERSION() AS version,
                DATABASE() AS database_name,
                USER() AS user_name
        `);

        console.log(`Версия MySQL: ${rows[0].version}`);
        console.log(`Текущая БД: ${rows[0].database_name}`);
        console.log(`Пользователь: ${rows[0].user_name}`);

        console.log('Соединений в пуле: 10');
        console.log('✔ Пул готов к работе');

    } catch (error) {

        console.error(
            `[${error.code || 'ERROR'}] ${error.message}`
        );

    } finally {

        await pool.end();
        console.log('✔ Пул закрыт');
    }
}

async function main() {
    await singleConnection();
    await connectionPool();
}

main();