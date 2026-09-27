const Koa = require('koa');

const app = new Koa();

const PORT = 3000;

app.use(async (ctx) => {
    if (ctx.path === '/' && ctx.method === 'GET') {

        const currentDate = new Date().toLocaleString('ru-RU');

        ctx.type = 'html';

        ctx.body = `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Лабораторная работа №15</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #f2f2f2;
                        margin: 0;
                        padding: 50px;
                    }

                    .container {
                        max-width: 800px;
                        margin: auto;
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 0 10px #aaa;
                    }

                    h1 {
                        color: #333;
                    }

                    p {
                        font-size: 18px;
                    }
                </style>
            </head>

            <body>
                <div class="container">
                    <h1>Лабораторная работа №15</h1>

                    <p>
                        <b>Студент:</b>
                        Минчук Станислав Игоревич
                    </p>

                    <p>
                        <b>Группа:</b>
                        ББМО-01-23
                    </p>

                    <p>
                        <b>Текущая дата и время:</b>
                        ${currentDate}
                    </p>

                    <p>
                        Добро пожаловать на сервер Koa.js!
                    </p>
                </div>
            </body>
            </html>
        `;
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});