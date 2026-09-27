const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const PORT = 3000;


// ========================================
// ДАННЫЕ ДЛЯ ГЕНЕРАЦИИ
// ========================================

const firstNames = [

    'Алексей',
    'Анна',
    'Иван',
    'Мария',
    'Дмитрий',
    'Елена',
    'Максим',
    'Ольга',
    'Сергей',
    'Наталья'

];


const lastNames = [

    'Иванов',
    'Петров',
    'Сидоров',
    'Кузнецов',
    'Смирнов',
    'Попова',
    'Васильев',
    'Морозова',
    'Новиков',
    'Фёдоров'

];


const groups = [

    'ББМО-01-23',
    'ББМО-02-23',
    'ББМО-03-23',
    'ББМО-04-23'

];


let students = [];

let nextId = 1;


// ========================================
// ГЕНЕРАЦИЯ 50 СТУДЕНТОВ
// ========================================

function generateStudents() {

    students = [];

    for (let i = 0; i < 50; i++) {

        const firstName =
            firstNames[
                i % firstNames.length
            ];


        const lastName =
            lastNames[
                i % lastNames.length
            ];


        students.push({

            id: nextId++,

            name:
                `${firstName} ${lastName}`,

            group:
                groups[
                    i % groups.length
                ],

            course:
                (i % 4) + 1

        });

    }

}


// ========================================
// ВАЛИДАЦИЯ
// ========================================

function validateStudent(
    data,
    partial = false
) {

    if (
        !partial &&
        (
            !data.name ||
            !data.group ||
            data.course === undefined
        )
    ) {

        return (
            'Поля name, group и course обязательны'
        );

    }


    if (
        data.name !== undefined &&
        (
            typeof data.name !== 'string' ||
            !data.name.trim()
        )
    ) {

        return (
            'Поле name должно быть непустой строкой'
        );

    }


    if (
        data.group !== undefined &&
        (
            typeof data.group !== 'string' ||
            !data.group.trim()
        )
    ) {

        return (
            'Поле group должно быть непустой строкой'
        );

    }


    if (
        data.course !== undefined &&
        (
            !Number.isInteger(data.course) ||
            data.course < 1 ||
            data.course > 4
        )
    ) {

        return (
            'Поле course должно быть целым числом от 1 до 4'
        );

    }


    return null;

}


// ========================================
// MIDDLEWARE ОШИБОК
// ========================================

app.use(async (ctx, next) => {

    try {

        await next();

    }

    catch (error) {

        console.error(
            'Ошибка:',
            error.message
        );


        ctx.status =
            error.status || 500;


        ctx.body = {

            error:
                error.status
                    ? error.message
                    : 'Внутренняя ошибка сервера',

            status:
                ctx.status

        };

    }

});


// ========================================
// MIDDLEWARE ЛОГИРОВАНИЯ
// ========================================

app.use(async (ctx, next) => {

    const start = Date.now();

    await next();

    const duration =
        Date.now() - start;


    console.log(

        `[${new Date().toLocaleString('ru-RU')}] ` +

        `${ctx.method} ` +

        `${ctx.path} ` +

        `- ${duration}ms`

    );

});


app.use(bodyParser());


// ========================================
// GET /students
// ========================================

router.get('/students', (ctx) => {

    let result =
        [...students];


    // ------------------------------------
    // ФИЛЬТРАЦИЯ ПО ГРУППЕ
    // ------------------------------------

    if (ctx.query.group) {

        result =
            result.filter(

                student =>
                    student.group ===
                    ctx.query.group

            );

    }


    // ------------------------------------
    // ПОИСК ПО ИМЕНИ
    // ------------------------------------

    if (ctx.query.search) {

        const search =
            String(
                ctx.query.search
            ).toLowerCase();


        result =
            result.filter(

                student =>
                    student.name
                        .toLowerCase()
                        .includes(search)

            );

    }


    // ------------------------------------
    // СОРТИРОВКА
    // ------------------------------------

    if (ctx.query.sort) {

        const sort =
            String(ctx.query.sort);


        const descending =
            sort.startsWith('-');


        const field =
            descending
                ? sort.slice(1)
                : sort;


        if (
            field === 'name' ||
            field === 'course'
        ) {

            result.sort((a, b) => {

                let valueA =
                    a[field];


                let valueB =
                    b[field];


                if (field === 'name') {

                    valueA =
                        valueA.toLowerCase();

                    valueB =
                        valueB.toLowerCase();

                }


                if (valueA < valueB) {

                    return descending
                        ? 1
                        : -1;

                }


                if (valueA > valueB) {

                    return descending
                        ? -1
                        : 1;

                }


                return 0;

            });

        }

    }


    // ------------------------------------
    // ОБЩЕЕ КОЛИЧЕСТВО
    // ------------------------------------

    const total =
        result.length;


    // ------------------------------------
    // PAGINATION
    // ------------------------------------

    const limitValue =
        Number(
            ctx.query.limit ?? 10
        );


    const offsetValue =
        Number(
            ctx.query.offset ?? 0
        );


    const limit =
        Number.isInteger(limitValue) &&
        limitValue > 0

            ? limitValue

            : 10;


    const offset =
        Number.isInteger(offsetValue) &&
        offsetValue >= 0

            ? offsetValue

            : 0;


    result =
        result.slice(
            offset,
            offset + limit
        );


    // ------------------------------------
    // ОТВЕТ
    // ------------------------------------

    ctx.body = {

        data: result,

        total: total,

        limit: limit,

        offset: offset

    };

});


// ========================================
// GET /students/:id
// ========================================

router.get('/students/:id', (ctx) => {

    const id =
        Number(
            ctx.params.id
        );


    const student =
        students.find(

            item =>
                item.id === id

        );


    if (!student) {

        ctx.status = 404;

        ctx.body = {

            error:
                'Студент не найден',

            status: 404

        };

        return;

    }


    ctx.body = student;

});


// ========================================
// POST /students
// ========================================

router.post('/students', (ctx) => {

    const data =
        ctx.request.body || {};


    const error =
        validateStudent(data);


    if (error) {

        ctx.status = 400;

        ctx.body = {

            error: error,

            status: 400

        };

        return;

    }


    const student = {

        id:
            nextId++,

        name:
            data.name.trim(),

        group:
            data.group.trim(),

        course:
            data.course

    };


    students.push(student);


    ctx.status = 201;

    ctx.body = student;

});


// ========================================
// PUT /students/:id
// ========================================

router.put('/students/:id', (ctx) => {

    const id =
        Number(
            ctx.params.id
        );


    const student =
        students.find(

            item =>
                item.id === id

        );


    if (!student) {

        ctx.status = 404;

        ctx.body = {

            error:
                'Студент не найден',

            status: 404

        };

        return;

    }


    const data =
        ctx.request.body || {};


    const error =
        validateStudent(
            data,
            true
        );


    if (error) {

        ctx.status = 400;

        ctx.body = {

            error: error,

            status: 400

        };

        return;

    }


    if (data.name !== undefined) {

        student.name =
            data.name.trim();

    }


    if (data.group !== undefined) {

        student.group =
            data.group.trim();

    }


    if (data.course !== undefined) {

        student.course =
            data.course;

    }


    ctx.body = student;

});


// ========================================
// DELETE /students/:id
// ========================================

router.delete('/students/:id', (ctx) => {

    const id =
        Number(
            ctx.params.id
        );


    const index =
        students.findIndex(

            item =>
                item.id === id

        );


    if (index === -1) {

        ctx.status = 404;

        ctx.body = {

            error:
                'Студент не найден',

            status: 404

        };

        return;

    }


    students.splice(
        index,
        1
    );


    ctx.body = {

        message:
            'Студент удалён',

        id:
            id

    };

});


// ========================================
// ЗАПУСК
// ========================================

generateStudents();


app.use(
    router.routes()
);


app.use(
    router.allowedMethods()
);


app.listen(
    PORT,
    () => {

        console.log(
            '================================'
        );

        console.log(
            'Лабораторная работа №15'
        );

        console.log(
            'Задание 5'
        );

        console.log(
            `Сервер: http://localhost:${PORT}`
        );

        console.log(
            `Создано студентов: ${students.length}`
        );

        console.log(
            '================================'
        );

    }
);