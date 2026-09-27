const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const PORT = 3000;

let users = [
    {
        id: 1,
        name: 'Иванов Иван',
        group: 'ББМО-01-23'
    },
    {
        id: 2,
        name: 'Петров Петр',
        group: 'ББМО-01-23'
    },
    {
        id: 3,
        name: 'Сидорова Анна',
        group: 'ББМО-02-23'
    }
];

let nextId = 4;

app.use(bodyParser());


// GET /api/users
router.get('/api/users', (ctx) => {

    ctx.body = users;

});


// POST /api/users
router.post('/api/users', (ctx) => {

    const { name, group } = ctx.request.body || {};

    if (
        !name ||
        !group ||
        typeof name !== 'string' ||
        typeof group !== 'string'
    ) {

        ctx.status = 400;

        ctx.body = {
            error: 'Поля name и group обязательны',
            status: 400
        };

        return;
    }

    const user = {
        id: nextId++,
        name: name.trim(),
        group: group.trim()
    };

    users.push(user);

    ctx.status = 201;

    ctx.body = user;

});


// PUT /api/users/:id
router.put('/api/users/:id', (ctx) => {

    const id = Number(ctx.params.id);

    const user = users.find(
        item => item.id === id
    );

    if (!user) {

        ctx.status = 404;

        ctx.body = {
            error: 'Пользователь не найден',
            status: 404
        };

        return;
    }

    const { name, group } = ctx.request.body || {};

    if (
        !name ||
        !group ||
        typeof name !== 'string' ||
        typeof group !== 'string'
    ) {

        ctx.status = 400;

        ctx.body = {
            error: 'Поля name и group обязательны',
            status: 400
        };

        return;
    }

    user.name = name.trim();
    user.group = group.trim();

    ctx.body = user;

});


// DELETE /api/users/:id
router.delete('/api/users/:id', (ctx) => {

    const id = Number(ctx.params.id);

    const index = users.findIndex(
        item => item.id === id
    );

    if (index === -1) {

        ctx.status = 404;

        ctx.body = {
            error: 'Пользователь не найден',
            status: 404
        };

        return;
    }

    users.splice(index, 1);

    ctx.body = {
        message: 'Пользователь успешно удалён',
        id: id
    };

});


app.use(router.routes());

app.use(router.allowedMethods());


app.listen(PORT, () => {

    console.log('Лабораторная работа №15 — Задание 2');

    console.log(
        `REST API запущен на http://localhost:${PORT}`
    );

});