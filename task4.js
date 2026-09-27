const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const PORT = 3000;


let students = [

    {
        id: 1,
        name: 'Анна Иванова',
        group: 'ББМО-01-23',
        course: 2
    },

    {
        id: 2,
        name: 'Алексей Петров',
        group: 'ББМО-01-23',
        course: 3
    },

    {
        id: 3,
        name: 'Мария Сидорова',
        group: 'ББМО-02-23',
        course: 1
    },

    {
        id: 4,
        name: 'Иван Кузнецов',
        group: 'ББМО-02-23',
        course: 4
    }

];


let nextId = 5;


// ========================================
// ВАЛИДАЦИЯ
// ========================================

function validateStudent(data, partial = false) {

    if (
        !partial &&
        (
            !data.name ||
            !data.group ||
            data.course === undefined
        )
    ) {

        return 'Поля name, group и course обязательны';

    }


    if (
        data.name !== undefined &&
        (
            typeof data.name !== 'string' ||
            !data.name.trim()
        )
    ) {

        return 'Поле name должно быть непустой строкой';

    }


    if (
        data.group !== undefined &&
        (
            typeof data.group !== 'string' ||
            !data.group.trim()
        )
    ) {

        return 'Поле group должно быть непустой строкой';

    }


    if (
        data.course !== undefined &&
        (
            !Number.isInteger(data.course) ||
            data.course < 1 ||
            data.course > 4
        )
    ) {

        return 'Поле course должно быть целым числом от 1 до 4';

    }


    return null;
}


// ========================================
// GET /students
// ========================================

router.get('/students', (ctx) => {

    let result = [...students];


    if (ctx.query.group) {

        result =
            result.filter(
                student =>
                    student.group === ctx.query.group
            );

    }


    ctx.body = result;

});


// ========================================
// GET /students/:id
// ========================================

router.get('/students/:id', (ctx) => {

    const id =
        Number(ctx.params.id);


    const student =
        students.find(
            item => item.id === id
        );


    if (!student) {

        ctx.status = 404;

        ctx.body = {
            error: 'Студент не найден',
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

        id: nextId++,

        name: data.name.trim(),

        group: data.group.trim(),

        course: data.course

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
        Number(ctx.params.id);


    const student =
        students.find(
            item => item.id === id
        );


    if (!student) {

        ctx.status = 404;

        ctx.body = {
            error: 'Студент не найден',
            status: 404
        };

        return;
    }


    const data =
        ctx.request.body || {};


    const error =
        validateStudent(data, true);


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
        Number(ctx.params.id);


    const index =
        students.findIndex(
            item => item.id === id
        );


    if (index === -1) {

        ctx.status = 404;

        ctx.body = {
            error: 'Студент не найден',
            status: 404
        };

        return;
    }


    students.splice(index, 1);


    ctx.body = {

        message: 'Студент удалён',

        id: id

    };

});


app.use(bodyParser());

app.use(router.routes());

app.use(router.allowedMethods());


app.listen(PORT, () => {

    console.log(
        'Лабораторная работа №15 — Задание 4'
    );

    console.log(
        `API студентов запущен на http://localhost:${PORT}`
    );

});