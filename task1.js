const express = require('express');

const app = express();

const PORT = 3000;


// Главная страница
app.get('/', (req, res) => {

    const currentDate =
        new Date().toLocaleString('ru-RU');

    res.send(`
        <!DOCTYPE html>

        <html lang="ru">

        <head>
            <meta charset="UTF-8">

            <title>
                Лабораторная работа №16
            </title>

            <style>

                body {
                    font-family: Arial;
                    background: #f2f2f2;
                    padding: 40px;
                }

                .container {
                    max-width: 800px;
                    margin: auto;
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 0 10px #aaa;
                }

                h1 {
                    color: #333;
                }

                a {
                    display: block;
                    margin: 10px 0;
                    color: #0066cc;
                }

            </style>

        </head>

        <body>

            <div class="container">

                <h1>
                    Лабораторная работа №16
                </h1>

                <p>
                    <b>Студент:</b>
                    Минчук Станислав Игоревич
                </p>

                <p>
                    <b>Группа:</b>
                    ББМО-01-23
                </p>

                <p>
                    <b>Дата и время:</b>
                    ${currentDate}
                </p>

                <p>
                    Добро пожаловать на сервер Express.js!
                </p>

                <h2>
                    Доступные маршруты
                </h2>

                <a href="/">
                    Главная
                </a>

                <a href="/about">
                    О разработчике
                </a>

                <a href="/contacts">
                    Контакты
                </a>

            </div>

        </body>

        </html>
    `);

});


// Страница About
app.get('/about', (req, res) => {

    res.send(`
        <html lang="ru">

        <head>
            <meta charset="UTF-8">

            <title>
                О разработчике
            </title>
        </head>

        <body>

            <h1>
                Информация о разработчике
            </h1>

            <p>
                Студент: Минчук Станислав Игоревич
            </p>

            <p>
                Группа: ББМО-01-23
            </p>

            <p>
                Лабораторная работа №16
            </p>

            <a href="/">
                Вернуться на главную
            </a>

        </body>

        </html>
    `);

});


// Контакты
app.get('/contacts', (req, res) => {

    res.send(`
        <html lang="ru">

        <head>
            <meta charset="UTF-8">

            <title>
                Контакты
            </title>
        </head>

        <body>

            <h1>
                Контактная информация
            </h1>

            <p>
                Студент:
                Минчук Станислав Игоревич
            </p>

            <p>
                Группа:
                ББМО-01-23
            </p>

            <p>
                Email:
                student@example.com
            </p>

            <a href="/">
                Вернуться на главную
            </a>

        </body>

        </html>
    `);

});


app.listen(PORT, () => {

    console.log(
        'Лабораторная работа №16'
    );

    console.log(
        `Express-сервер запущен на http://localhost:${PORT}`
    );

});