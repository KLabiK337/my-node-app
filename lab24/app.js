require('dotenv').config();

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const { connectDB } = require('./db');

const usersRouter = require('./routes/users');

const errorMiddleware =
    require('./middleware/error');

const dbMiddleware =
    require('./middleware/db');

const loggerMiddleware =
    require('./middleware/logger');

const validationMiddleware =
    require('./middleware/validation');

const app = new Koa();

const PORT = 3000;

app.use(errorMiddleware);

app.use(bodyParser());

app.use(loggerMiddleware);

app.use(async (ctx, next) => {
    ctx.set('X-Group', 'BBMO-01-23');

    await next();
});

app.use(dbMiddleware);

app.use(validationMiddleware);

app.use(usersRouter.routes());

app.use(usersRouter.allowedMethods());

app.use(async ctx => {
    ctx.status = 404;

    ctx.body = {
        error: 'Not found',
        status: 404
    };
});

async function start() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(
                `[INFO] Koa-сервер на порту ${PORT}`
            );

            console.log(
                '[INFO] Группа: ББМО-01-23'
            );
        });

    } catch (error) {
        console.error(
            '[ERROR] Не удалось запустить сервер'
        );

        console.error(error);

        process.exit(1);
    }
}

start();