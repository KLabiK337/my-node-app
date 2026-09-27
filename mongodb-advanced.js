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

        console.log('======================================');
        console.log('ЛР №23 — ЗАДАНИЕ 3');
        console.log('Курсоры, агрегации и большие данные');
        console.log('======================================');

        // ==========================================
        // 1. КУРСОР
        // ==========================================

        console.log('\n=== Курсоры ===');

        const cursor = students.find({
            group_name: 'ББМО-01-23'
        }).batchSize(100);

        let count = 0;

        for await (const doc of cursor) {
            count++;

            if (count <= 10) {
                console.log(
                    `${count}. ${doc.name} — grade=${doc.grade}`
                );
            }
        }

        console.log(
            `✔ Обработано через for await: ${count}`
        );

        await cursor.close();

        // ==========================================
        // 2. NEXT()
        // ==========================================

        console.log('\n=== cursor.next() ===');

        const nextCursor = students.find({}).batchSize(10);

        const first = await nextCursor.next();

        if (first) {
            console.log(
                `Первый документ: ${first.name}`
            );
        }

        await nextCursor.close();

        // ==========================================
        // 3. АГРЕГАЦИЯ — СРЕДНИЙ БАЛЛ
        // ==========================================

        console.log('\n=== Агрегация: средний балл по группам ===');

        const averageByGroup = await students.aggregate([
            {
                $match: {
                    grade: {
                        $exists: true
                    }
                }
            },
            {
                $group: {
                    _id: '$group_name',
                    averageGrade: {
                        $avg: '$grade'
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    averageGrade: -1
                }
            },
            {
                $project: {
                    _id: 0,
                    group_name: '$_id',
                    averageGrade: {
                        $round: ['$averageGrade', 2]
                    },
                    count: 1
                }
            }
        ]).toArray();

        console.table(averageByGroup);

        // ==========================================
        // 4. КОЛИЧЕСТВО ПО КУРСАМ
        // ==========================================

        console.log('\n=== Количество студентов по курсам ===');

        const byCourse = await students.aggregate([
            {
                $group: {
                    _id: '$course',
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            },
            {
                $project: {
                    _id: 0,
                    course: '$_id',
                    count: 1
                }
            }
        ]).toArray();

        console.table(byCourse);

        // ==========================================
        // 5. ТОП-10
        // ==========================================

        console.log('\n=== Топ-10 студентов по оценке ===');

        const topStudents = await students.aggregate([
            {
                $match: {
                    grade: {
                        $exists: true
                    }
                }
            },
            {
                $sort: {
                    grade: -1
                }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    group_name: 1,
                    grade: 1
                }
            }
        ]).toArray();

        console.table(topStudents);

        // ==========================================
        // 6. COLLECTION GROUPS
        // ==========================================

        console.log('\n=== $lookup ===');

        const groups = db.collection('groups');

        await groups.deleteMany({
            lab23_test: true
        });

        await groups.insertMany([
            {
                group_name: 'ББМО-01-23',
                curator: 'Иванов И.И.',
                lab23_test: true
            },
            {
                group_name: 'ББМО-02-23',
                curator: 'Петров П.П.',
                lab23_test: true
            },
            {
                group_name: 'ББМО-03-23',
                curator: 'Сидоров С.С.',
                lab23_test: true
            }
        ]);

        const lookupResult = await students.aggregate([
            {
                $lookup: {
                    from: 'groups',
                    localField: 'group_name',
                    foreignField: 'group_name',
                    as: 'groupInfo'
                }
            },
            {
                $unwind: {
                    path: '$groupInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    group_name: 1,
                    grade: 1,
                    curator: '$groupInfo.curator'
                }
            },
            {
                $limit: 10
            }
        ]).toArray();

        console.table(lookupResult);

        // ==========================================
        // 7. ГЕНЕРАЦИЯ 1 000 000 ДОКУМЕНТОВ
        // ==========================================

        console.log('\n=== Большие данные ===');

        const bigData = db.collection('big_students');

        await bigData.deleteMany({
            lab23_test: true
        });

        const total = 1000000;
        const batchSize = 5000;

        console.log(
            `Генерация ${total.toLocaleString()} документов...`
        );

        let generated = 0;

        while (generated < total) {

            const batch = [];

            const currentBatch = Math.min(
                batchSize,
                total - generated
            );

            for (let i = 0; i < currentBatch; i++) {

                const number = generated + i + 1;

                batch.push({
                    name: `Студент ${number}`,
                    group_name:
                        `ББМО-${String((number % 3) + 1).padStart(2, '0')}-23`,
                    course: (number % 4) + 1,
                    grade: Number(
                        (3 + Math.random() * 2).toFixed(2)
                    ),
                    email: `student${number}@example.com`,
                    lab23_test: true
                });
            }

            await bigData.insertMany(
                batch,
                {
                    ordered: false
                }
            );

            generated += currentBatch;

            if (
                generated % 100000 === 0 ||
                generated === total
            ) {
                console.log(
                    `Создано: ${generated.toLocaleString()}`
                );
            }
        }

        console.log('✔ 1 000 000 документов создано');

        // ==========================================
        // 8. ЧТЕНИЕ ЧЕРЕЗ CURSOR
        // ==========================================

        console.log('\n=== Потоковое чтение курсором ===');

        const startMemory =
            process.memoryUsage().heapUsed;

        const startTime = Date.now();

        const bigCursor = bigData
            .find({
                lab23_test: true
            })
            .batchSize(1000);

        let processed = 0;
        let gradeSum = 0;

        for await (const doc of bigCursor) {

            processed++;
            gradeSum += doc.grade;

            if (processed % 200000 === 0) {
                console.log(
                    `Обработано: ${processed.toLocaleString()}`
                );
            }
        }

        await bigCursor.close();

        const cursorTime =
            Date.now() - startTime;

        const cursorMemory =
            process.memoryUsage().heapUsed -
            startMemory;

        console.log(
            `✔ Обработано: ${processed.toLocaleString()}`
        );

        console.log(
            `Средний балл: ${(gradeSum / processed).toFixed(2)}`
        );

        console.log(
            `Время: ${cursorTime} мс`
        );

        console.log(
            `Изменение памяти: ${
                (cursorMemory / 1024 / 1024).toFixed(2)
            } MB`
        );

        // ==========================================
        // 9. TOARRAY — СРАВНЕНИЕ
        // ==========================================

        console.log('\n=== Сравнение с toArray() ===');

        try {

            const arrayStart =
                process.memoryUsage().heapUsed;

            const arrayStartTime = Date.now();

            const arrayData = await bigData
                .find({
                    lab23_test: true
                })
                .limit(100000)
                .toArray();

            const arrayTime =
                Date.now() - arrayStartTime;

            const arrayMemory =
                process.memoryUsage().heapUsed -
                arrayStart;

            console.log(
                `Получено через toArray(): ${arrayData.length}`
            );

            console.log(
                `Время: ${arrayTime} мс`
            );

            console.log(
                `Память: ${
                    (arrayMemory / 1024 / 1024).toFixed(2)
                } MB`
            );

        } catch (error) {

            console.log(
                `✖ Ошибка toArray(): ${error.message}`
            );
        }

        // ==========================================
        // 10. ИНДЕКСЫ
        // ==========================================

        console.log('\n=== Индексы ===');

        const index1 = await bigData.createIndex({
            group_name: 1
        });

        console.log(
            `✔ Создан индекс: ${index1}`
        );

        const index2 = await bigData.createIndex({
            group_name: 1,
            grade: -1
        });

        console.log(
            `✔ Составной индекс: ${index2}`
        );

        const index3 = await bigData.createIndex(
            {
                email: 1
            },
            {
                unique: true
            }
        );

        console.log(
            `✔ Уникальный индекс: ${index3}`
        );

        // ==========================================
        // 11. EXPLAIN
        // ==========================================

        console.log('\n=== EXPLAIN ===');

        const explainResult = await bigData
            .find({
                group_name: 'ББМО-01-23'
            })
            .explain('executionStats');

        console.log(
            `Время выполнения: ${
                explainResult.executionStats.executionTimeMillis
            } ms`
        );

        console.log(
            `Документов проверено: ${
                explainResult.executionStats.totalDocsExamined
            }`
        );

        console.log(
            `Документов возвращено: ${
                explainResult.executionStats.nReturned
            }`
        );

        // ==========================================
        // 12. TEXT INDEX
        // ==========================================

        console.log('\n=== Текстовый поиск ===');

        try {
            await bigData.createIndex({
                name: 'text'
            });

            console.log(
                '✔ Текстовый индекс name_text создан'
            );
        } catch (error) {

            console.log(
                `Индекс уже существует: ${error.message}`
            );
        }

        const textResults = await bigData
            .find({
                $text: {
                    $search: 'Студент 100'
                }
            })
            .project({
                _id: 0,
                name: 1,
                grade: 1,
                score: {
                    $meta: 'textScore'
                }
            })
            .sort({
                score: {
                    $meta: 'textScore'
                }
            })
            .limit(10)
            .toArray();

        console.table(textResults);

        console.log('\n✔ Задание 3 завершено');

    } catch (error) {

        console.error('\n✖ Ошибка MongoDB:');
        console.error(error);

    } finally {

        await client.close();

        console.log('✔ Соединение закрыто');
    }
}

main();