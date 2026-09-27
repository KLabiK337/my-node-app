const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const PORT = 3000;


// ========================================
// MIDDLEWARE ОБРАБОТКИ ОШИБОК
// ========================================

app.use(async (ctx, next) => {

    try {

        await next();

    } catch (error) {

        console.error('Ошибка:', error.message);

        ctx.status = error.status || 500;

        ctx.body = {
            error: error.status
                ? error.message
                : 'Внутренняя ошибка сервера',

            status: ctx.status
        };
    }

});


// ========================================
// MIDDLEWARE ЛОГИРОВАНИЯ
// ========================================

app.use(async (ctx, next) => {

    const start = Date.now();

    const startTime =
        new Date().toLocaleString('ru-RU');

    await next();

    const endTime =
        new Date().toLocaleString('ru-RU');

    const duration =
        Date.now() - start;

    console.log(
        `[${startTime}] ${ctx.method} ${ctx.path} - ${duration}ms`
    );

    console.log(
        `Начало: ${startTime}, окончание: ${endTime}`
    );

});


// Парсинг JSON
app.use(bodyParser());


// ========================================
// MIDDLEWARE АВТОРИЗАЦИИ
// ========================================

async function authorization(ctx, next) {

    const authorization =
        ctx.get('Authorization');

    if (!authorization) {

        ctx.status = 401;

        ctx.body = {
            error: 'Требуется заголовок Authorization',
            status: 401
        };

        return;
    }

    await next();
}


// ========================================
// ЗАЩИЩЁННЫЙ МАРШРУТ
// ========================================

router.get(
    '/protected',
    authorization,
    (ctx) => {

        ctx.body = {
            message: 'Доступ разрешён',
            authorized: true
        };

    }
);


// ========================================
// ТЕСТ ОШИБКИ
// ========================================

router.get('/error', (ctx) => {

    ctx.throw(
        500,
        'Тестовая ошибка сервера'
    );

});


// ========================================
// ГЛАВНАЯ
// ========================================

router.get('/', (ctx) => {

    ctx.body = {
        message: 'Сервер задания 3 работает',

        endpoints: [
            '/protected',
            '/error'
        ]
    };

});


app.use(router.routes());

app.use(router.allowedMethods());


app.listen(PORT, () => {

    console.log(
        'Лабораторная работа №15 — Задание 3'
    );

    console.log(
        `Сервер запущен на http://localhost:${PORT}`
    );

});