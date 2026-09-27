const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

async function main() {
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const db = client.db(dbName);
        const students = db.collection('students');

        console.log('=== Коллекция students ===');

        // Индекс по группе
const indexes = await students
    .listIndexes()
    .toArray();

const groupIndex = indexes.find(index =>
    index.key &&
    index.key.group_name === 1 &&
    Object.keys(index.key).length === 1
);

if (groupIndex) {
    console.log(
        `✔ Индекс по group_name уже существует: ${groupIndex.name}`
    );
} else {
    const createdIndex = await students.createIndex({
        group_name: 1
    });

    console.log(
        `✔ Создан индекс: ${createdIndex}`
    );
}

        // Очищаем старые тестовые данные,
        // чтобы результат был одинаковым при повторном запуске
        await students.deleteMany({
            lab23_test: true
        });

        // ========================================
        // INSERT ONE
        // ========================================

        console.log('\n--- INSERT ONE ---');

        const oneStudent = {
            name: 'Минчук Станислав Игоревич',
            group_name: 'ББМО-01-23',
            course: 3,
            grade: 4.8,
            created_at: new Date(),
            lab23_test: true
        };

        const insertOneResult = await students.insertOne(
            oneStudent
        );

        console.log(
            `✔ Вставлен: insertedId=${insertOneResult.insertedId}`
        );

        // ========================================
        // INSERT MANY
        // ========================================

        console.log('\n--- INSERT MANY ---');

        const manyStudents = [
            {
                name: 'Иван Иванов',
                group_name: 'ББМО-01-23',
                course: 2,
                grade: 4.5,
                created_at: new Date(),
                lab23_test: true
            },
            {
                name: 'Мария Петрова',
                group_name: 'ББМО-01-23',
                course: 2,
                grade: 3.8,
                created_at: new Date(),
                lab23_test: true
            },
            {
                name: 'Алексей Сидоров',
                group_name: 'ББМО-01-23',
                course: 3,
                grade: 4.2,
                created_at: new Date(),
                lab23_test: true
            },
            {
                name: 'Ольга Смирнова',
                group_name: 'ББМО-02-23',
                course: 3,
                grade: 4.9,
                created_at: new Date(),
                lab23_test: true
            },
            {
                name: 'Дмитрий Козлов',
                group_name: 'ББМО-02-23',
                course: 4,
                grade: 2.9,
                created_at: new Date(),
                lab23_test: true
            }
        ];

        const insertManyResult = await students.insertMany(
            manyStudents
        );

        console.log(
            `✔ Вставлено документов: ${insertManyResult.insertedCount}`
        );

        console.log(
            'insertedIds:',
            insertManyResult.insertedIds
        );

        // ========================================
        // SELECT — ВСЕ ДОКУМЕНТЫ
        // ========================================

        console.log('\n--- SELECT: ВСЕ ДОКУМЕНТЫ ---');

        const allStudents = await students
            .find({ lab23_test: true })
            .toArray();

        console.log(
            `Количество документов: ${allStudents.length}`
        );

        console.table(
            allStudents.map(student => ({
                _id: student._id.toString(),
                name: student.name,
                group_name: student.group_name,
                course: student.course,
                grade: student.grade
            }))
        );

        // ========================================
        // FIND — ФИЛЬТР ПО ГРУППЕ
        // ========================================

        console.log(
            '\n--- FIND: group_name = ББМО-01-23 ---'
        );

        const groupStudents = await students
            .find({
                group_name: 'ББМО-01-23',
                lab23_test: true
            })
            .toArray();

        console.log(
            `Найдено: ${groupStudents.length}`
        );

        console.table(
            groupStudents.map(student => ({
                name: student.name,
                group_name: student.group_name,
                course: student.course,
                grade: student.grade
            }))
        );

        // ========================================
        // SORT
        // ========================================

        console.log(
            '\n--- SORT: по оценке по убыванию ---'
        );

        const sortedStudents = await students
            .find({
                lab23_test: true
            })
            .sort({
                grade: -1
            })
            .toArray();

        console.table(
            sortedStudents.map(student => ({
                name: student.name,
                grade: student.grade
            }))
        );

        // ========================================
        // PAGINATION
        // ========================================

        console.log(
            '\n--- PAGINATION: limit(3), skip(1) ---'
        );

        const paginatedStudents = await students
            .find({
                lab23_test: true
            })
            .sort({
                name: 1
            })
            .limit(3)
            .skip(1)
            .toArray();

        console.table(
            paginatedStudents.map(student => ({
                name: student.name,
                group_name: student.group_name,
                grade: student.grade
            }))
        );

        // ========================================
        // FIND ONE
        // ========================================

        console.log('\n--- FIND ONE ---');

        const foundStudent = await students.findOne({
            _id: insertOneResult.insertedId
        });

        if (foundStudent) {
            console.log(
                `✔ Найден: ${foundStudent.name}`
            );
            console.log(
                `ID: ${foundStudent._id}`
            );
        }

        // ========================================
        // PROJECTION
        // ========================================

        console.log(
            '\n--- PROJECTION: только name и grade ---'
        );

        const projectionStudents = await students
            .find(
                {
                    lab23_test: true
                },
                {
                    projection: {
                        _id: 0,
                        name: 1,
                        grade: 1
                    }
                }
            )
            .toArray();

        console.table(projectionStudents);

        // ========================================
        // UPDATE ONE
        // ========================================

        console.log('\n--- UPDATE ONE ---');

        const updateOneResult = await students.updateOne(
            {
                _id: insertOneResult.insertedId
            },
            {
                $set: {
                    grade: 5.0
                },
                $inc: {
                    course: 1
                }
            }
        );

        console.log(
            `matchedCount=${updateOneResult.matchedCount}`
        );

        console.log(
            `modifiedCount=${updateOneResult.modifiedCount}`
        );

        // ========================================
        // UPDATE MANY
        // ========================================

        console.log('\n--- UPDATE MANY ---');

        const updateManyResult = await students.updateMany(
            {
                group_name: 'ББМО-01-23',
                lab23_test: true
            },
            {
                $inc: {
                    course: 1
                }
            }
        );

        console.log(
            `matchedCount=${updateManyResult.matchedCount}`
        );

        console.log(
            `modifiedCount=${updateManyResult.modifiedCount}`
        );

        // ========================================
        // DELETE ONE
        // ========================================

        console.log('\n--- DELETE ONE ---');

        const deleteOneResult = await students.deleteOne({
            _id: insertOneResult.insertedId
        });

        console.log(
            `deletedCount=${deleteOneResult.deletedCount}`
        );

        // ========================================
        // DELETE MANY
        // ========================================

        console.log('\n--- DELETE MANY ---');

        const deleteManyResult = await students.deleteMany({
            grade: {
                $lt: 3
            },
            lab23_test: true
        });

        console.log(
            `deletedCount=${deleteManyResult.deletedCount}`
        );

        // ========================================
        // ФИНАЛЬНАЯ ПРОВЕРКА
        // ========================================

        console.log('\n--- ФИНАЛЬНЫЕ ДАННЫЕ ---');

        const finalStudents = await students
            .find({
                lab23_test: true
            })
            .toArray();

        console.table(
            finalStudents.map(student => ({
                name: student.name,
                group_name: student.group_name,
                course: student.course,
                grade: student.grade
            }))
        );

        console.log('\n✔ CRUD-задание завершено');

    } catch (error) {

        console.error('\n✖ Ошибка MongoDB:');
        console.error(error.message);

    } finally {

        await client.close();

        console.log('\n✔ Соединение закрыто');
    }
}

main();