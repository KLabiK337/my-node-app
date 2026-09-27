const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

async function main() {
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 5000
    });

    // Обработка heartbeat
    client.on('serverHeartbeatSucceeded', event => {
        console.log(
            `[HEARTBEAT] Успешно: ${new Date().toISOString()}`
        );
    });

    client.on('serverHeartbeatFailed', event => {
        console.log(
            `[HEARTBEAT] Ошибка: ${event.failure?.message || 'неизвестная ошибка'}`
        );
    });

    try {
        console.log('=== Подключение к MongoDB ===');

        await client.connect();

        console.log('✔ Подключение установлено');

        const db = client.db(dbName);

        // Проверка соединения
        await db.command({ ping: 1 });

        console.log(`База данных: ${dbName}`);

        // Информация о пользователе
        const connectionInfo = await db.command({
            connectionStatus: 1
        });

        const users =
            connectionInfo.authInfo?.authenticatedUsers || [];

        console.log(
            `Пользователь: ${
                users.length > 0
                    ? users[0].user
                    : 'не определён'
            }`
        );

        // Информация о сервере
        console.log('\n=== Информация о сервере ===');

        const buildInfo = await db.command({
            buildInfo: 1
        });

        console.log(
            `Версия MongoDB: ${buildInfo.version}`
        );

        // Список баз данных
        const admin = client.db('admin');

        const databases = await admin.command({
            listDatabases: 1
        });

        console.log('\nСписок БД:');

        for (const database of databases.databases) {
            console.log(`- ${database.name}`);
        }

        // Список коллекций
        console.log(`\nКоллекции в ${dbName}:`);

        const collections = await db
            .listCollections()
            .toArray();

        if (collections.length === 0) {
            console.log('(пусто — коллекции ещё не созданы)');
        } else {
            for (const collection of collections) {
                console.log(`- ${collection.name}`);
            }
        }

        // Heartbeat
        console.log('\n=== Heartbeat ===');

        await new Promise(resolve => {
            setTimeout(resolve, 12000);
        });

        console.log('✔ Соединение стабильно');

    } catch (error) {

        console.error('\n✖ Ошибка подключения:');
        console.error(`Код: ${error.code || 'N/A'}`);
        console.error(`Сообщение: ${error.message}`);

    } finally {

        await client.close();

        console.log('✖ Соединение закрыто');
    }
}

main();