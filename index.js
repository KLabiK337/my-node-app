const http = require('http');

const PORT = 3000;

// Номер журнала.
// Если преподаватель требует другое количество знаков,
// поменяйте значение этой переменной.
const JOURNAL_NUMBER = 12;

// Вычисление числа Пи методом Лейбница.
// Сторонние библиотеки для вычисления Пи не используются.
function calculatePi(iterations) {
    let pi = 0;

    for (let i = 0; i < iterations; i++) {
        pi += (i % 2 === 0 ? 1 : -1) / (2 * i + 1);
    }

    return pi * 4;
}

const pi = calculatePi(10000000);

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });

    res.end(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Лабораторная работа №11</title>
        </head>
        <body>
            <h1>Лабораторная работа №11</h1>

            <p><strong>ФИО:</strong> Минчук Станислав Игоревич</p>
            <p><strong>Группа:</strong> 401</p>

            <p>
                <strong>Число Пи:</strong>
                ${pi.toFixed(JOURNAL_NUMBER)}
            </p>

            <p>
                Число Пи вычислено программно без использования
                сторонних библиотек.
            </p>
        </body>
        </html>
    `);
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});