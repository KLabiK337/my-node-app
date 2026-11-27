const http = require('http');

const PORT = 3000;
const GROUP = 'ББМО-01-23';

const server = http.createServer((req, res) => {
    const time = new Date().toLocaleString('ru-RU');

    console.log(
        `[${time}] ${req.method} ${req.url}`
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (req.method === 'GET' && req.url === '/') {
        res.statusCode = 200;

        res.end(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Лабораторная работа №20</title>
            </head>
            <body>
                <h1>Лабораторная работа №20</h1>
                <p>Группа: ${GROUP}</p>
                <p>Метод: ${req.method}</p>
                <p>URL: ${req.url}</p>
            </body>
            </html>
        `);

        return;
    }

    if (req.method === 'GET' && req.url === '/about') {
        res.statusCode = 200;

        res.end(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>О студенте</title>
            </head>
            <body>
                <h1>О студенте</h1>
                <p>Группа: ${GROUP}</p>
                <p>Студент: Минчук Станислав Игоревич</p>
            </body>
            </html>
        `);

        return;
    }

    res.statusCode = 404;

    res.end(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>404 Not Found</title>
        </head>
        <body>
            <h1>404 Not Found</h1>
            <p>Путь ${req.url} не найден</p>
        </body>
        </html>
    `);
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});