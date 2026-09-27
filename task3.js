const express = require('express');
const compression = require('compression');

const app = express();

const PORT = 3000;

app.use(express.json());


// ========================================
// ОБРАБОТКА ОШИБОК
// ========================================

app.use((req, res, next) => {

    next();

});


// ========================================
// LOGGER
// ========================================

app.use((req, res, next) => {

    const start =
        Date.now();

    const startTime =
        new Date().toLocaleString('ru-RU');


    res.on('finish', () => {

        const duration =
            Date.now() - start;

        const endTime =
            new Date().toLocaleString('ru-RU');


        console.log(

            `[${startTime}] ` +
            `${req.method} ` +
            `${req.path} ` +
            `${res.statusCode} ` +
            `- ${duration}ms ` +
            `(окончание: ${endTime})`

        );

    });


    next();

});


// ========================================
// COMPRESSION
// ========================================

app.use(compression());


// ========================================
// RATE LIMITER
// 100 запросов в минуту
// ========================================

const requests = new Map();

app.use((req, res, next) => {

    const ip =
        req.ip ||
        req.socket.remoteAddress ||
        'unknown';


    const now =
        Date.now();


    const minute =
        60 * 1000;


    if (!requests.has(ip)) {

        requests.set(ip, []);

    }


    let userRequests =
        requests.get(ip);


    userRequests =
        userRequests.filter(
            time =>
                now - time < minute
        );


    if (userRequests.length >= 100) {

        res.setHeader(
            'X-RateLimit-Limit',
            '100'
        );

        res.setHeader(
            'X-RateLimit-Remaining',
            '0'
        );

        return res.status(429).json({

            error:
                'Слишком много запросов',

            status: 429

        });

    }


    userRequests.push(now);

    requests.set(
        ip,
        userRequests
    );


    res.setHeader(
        'X-RateLimit-Limit',
        '100'
    );

    res.setHeader(
        'X-RateLimit-Remaining',
        100 - userRequests.length
    );


    next();

});


// ========================================
// ТЕСТОВЫЕ МАРШРУТЫ
// ========================================

app.get('/', (req, res) => {

    res.json({

        message:
            'Middleware Express работает',

        compression:
            true,

        rateLimit:
            '100 запросов в минуту'

    });

});


// Обычная ошибка
app.get('/error', (req, res) => {

    throw new Error(
        'Тестовая ошибка'
    );

});


// Асинхронная ошибка
app.get('/async-error', async (req, res, next) => {

    try {

        await new Promise(
            resolve =>
                setTimeout(resolve, 100)
        );


        throw new Error(
            'Тестовая асинхронная ошибка'
        );

    } catch (error) {

        next(error);

    }

});


// ========================================
// ERROR HANDLER
// ========================================

app.use((error, req, res, next) => {

    console.error(
        'Ошибка:',
        error.message
    );


    res.status(
        error.status || 500
    ).json({

        error:
            error.message ||
            'Внутренняя ошибка сервера',

        status:
            error.status || 500

    });

});


app.listen(PORT, () => {

    console.log(
        'Задание 3 запущено'
    );

    console.log(
        `http://localhost:${PORT}`
    );

});