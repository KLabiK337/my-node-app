require('dotenv').config();

const {
    MongoClient,
    ObjectId,
    ReadPreference
} = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'bbmo_01_23';

const client = new MongoClient(uri);

async function successfulTransaction(db) {
    console.log('\n=== 1. УСПЕШНАЯ ТРАНЗАКЦИЯ ===');

    const session = client.startSession();

    try {
        const students = db.collection('students');

        await session.withTransaction(async () => {
            await students.insertMany([
                {
                    name: 'Тест Транзакции 1',
                    group_name: 'ББМО-01-23',
                    course: 3,
                    grade: 8,
                    created_at: new Date()
                },
                {
                    name: 'Тест Транзакции 2',
                    group_name: 'ББМО-01-23',
                    course: 3,
                    grade: 9,
                    created_at: new Date()
                }
            ], { session });

            await students.updateOne(
                { name: 'Тест Транзакции 1' },
                { $inc: { grade: 1 } },
                { session }
            );

            console.log('✔ Данные добавлены и изменены внутри транзакции');
        });

        console.log('✔ Транзакция успешно подтверждена (COMMIT)');
    } catch (error) {
        console.error('✖ Ошибка транзакции:', error.message);
    } finally {
        await session.endSession();
    }
}


async function rollbackTransaction(db) {
    console.log('\n=== 2. ОТКАТ ТРАНЗАКЦИИ ===');

    const session = client.startSession();
    const students = db.collection('students');

    const testId = new ObjectId();

    try {
        await session.withTransaction(async () => {

            await students.insertOne(
                {
                    _id: testId,
                    name: 'Тест Откат',
                    group_name: 'ROLLBACK',
                    course: 3,
                    grade: 5,
                    created_at: new Date()
                },
                { session }
            );

            console.log('✔ Первый документ добавлен');

            // Специально создаём ошибку
            await students.insertOne(
                {
                    _id: testId,
                    name: 'Ошибка',
                    group_name: 'ROLLBACK',
                    course: 3,
                    grade: 5,
                    created_at: new Date()
                },
                { session }
            );
        });

    } catch (error) {
        console.log('✔ Ошибка вызвана специально');
        console.log('✔ Транзакция должна быть отменена (ROLLBACK)');
    } finally {
        await session.endSession();
    }

    const check = await students.findOne({ _id: testId });

    if (!check) {
        console.log('✔ Проверка: данные после ROLLBACK отсутствуют');
    } else {
        console.log('✖ Ошибка: данные остались');
    }
}


async function changeStreamDemo(db) {
    console.log('\n=== 3. CHANGE STREAM ===');

    const students = db.collection('students');

    const changeStream = students.watch();

    const events = [];

    const streamPromise = (async () => {
        for await (const change of changeStream) {
            console.log(
                `✔ Change Stream: ${change.operationType}`
            );

            events.push(change);

            if (events.length >= 3) {
                break;
            }
        }
    })();

    // INSERT
    const result = await students.insertOne({
        name: 'Change Stream Test',
        group_name: 'ББМО-01-23',
        course: 3,
        grade: 7,
        created_at: new Date()
    });

    const id = result.insertedId;

    // UPDATE
    await students.updateOne(
        { _id: id },
        { $inc: { grade: 1 } }
    );

    // DELETE
    await students.deleteOne({
        _id: id
    });

    await streamPromise;

    await changeStream.close();

    console.log('✔ Получено событий:', events.length);
}


async function readPreferenceDemo(dbName) {
    console.log('\n=== 4. READ PREFERENCE ===');

    const primaryDb = client.db(dbName, {
        readPreference: ReadPreference.PRIMARY
    });

    const secondaryDb = client.db(dbName, {
        readPreference: ReadPreference.SECONDARY_PREFERRED
    });

    const studentsPrimary = primaryDb.collection('students');
    const studentsSecondary = secondaryDb.collection('students');

    const startPrimary = Date.now();

    await studentsPrimary
        .find({})
        .limit(10)
        .toArray();

    const primaryTime = Date.now() - startPrimary;

    const startSecondary = Date.now();

    await studentsSecondary
        .find({})
        .limit(10)
        .toArray();

    const secondaryTime = Date.now() - startSecondary;

    console.log(`PRIMARY: ${primaryTime} мс`);
    console.log(`SECONDARY_PREFERRED: ${secondaryTime} мс`);

    console.log('✔ Проверка read preference завершена');
}


async function showReplicaSetInfo() {
    console.log('\n=== 5. СОСТОЯНИЕ REPLICA SET ===');

    const admin = client.db('admin');

    try {
        const hello = await admin.command({
            hello: 1
        });

        console.log('Replica Set:', hello.setName);
        console.log(
            'Writable Primary:',
            hello.isWritablePrimary
        );
        console.log(
            'Primary:',
            hello.primary
        );

        if (hello.setName === 'rs0') {
            console.log('✔ Replica Set rs0 работает');
        }
    } catch (error) {
        console.error(
            '✖ Не удалось получить информацию:',
            error.message
        );
    }
}


async function main() {
    try {
        console.log('========================================');
        console.log(' ЛАБОРАТОРНАЯ РАБОТА №23');
        console.log(' MongoDB — Replica Set и транзакции');
        console.log('========================================');

        await client.connect();

        console.log('✔ Подключение к MongoDB установлено');

        const db = client.db(dbName);

        await db.command({
            ping: 1
        });

        console.log(`✔ База данных: ${dbName}`);

        await showReplicaSetInfo();

        await successfulTransaction(db);

        await rollbackTransaction(db);

        await changeStreamDemo(db);

        await readPreferenceDemo(dbName);

        console.log('\n========================================');
        console.log('✔ ЗАДАНИЕ 4 ВЫПОЛНЕНО');
        console.log('========================================');

    } catch (error) {
        console.error('\n✖ Общая ошибка:');
        console.error(error);

    } finally {
        await client.close();
        console.log('\n✔ Соединение с MongoDB закрыто');
    }
}

main();