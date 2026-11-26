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
const fs = require('fs').promises;
const path = require('path');

const VARIANT = 12;
const ALLOWED = new Set(['.js', '.json', '.txt', '.md']);

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
}

async function scan(directory, result) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            result.folders++;
            await scan(fullPath, result);
            continue;
        }

        if (!entry.isFile()) continue;

        const ext = path.extname(entry.name).toLowerCase();

        // Вариант 12: анализируем только .js, .json, .txt, .md.
        if (!ALLOWED.has(ext)) continue;

        const stats = await fs.stat(fullPath);

        const item = {
            name: entry.name,
            path: fullPath,
            relativePath: path.relative('.', fullPath),
            extension: ext,
            size: stats.size
        };

        result.files.push(item);
        result.totalSize += stats.size;

        if (!result.byExtension[ext]) {
            result.byExtension[ext] = [];
        }

        result.byExtension[ext].push(item);
    }
}

async function main() {
    const target = process.argv[2] || '.';

    try {
        const result = {
            directory: target,
            folders: 0,
            files: [],
            totalSize: 0,
            byExtension: {}
        };

        await scan(target, result);

        const largest = [...result.files]
            .sort((a, b) => b.size - a.size)
            .slice(0, 5);

        const smallest = [...result.files]
            .sort((a, b) => a.size - b.size)
            .slice(0, 5);

        console.log(`📊 Анализ директории: ${target}`);
        console.log(`📁 Общее количество папок: ${result.folders}`);
        console.log(`📄 Общее количество файлов: ${result.files.length}`);
        console.log(
            `💾 Общий размер: ${formatSize(result.totalSize)} (${result.totalSize} байт)`
        );

        console.log('\n📂 Расширения файлов:');
        for (const [ext, items] of Object.entries(result.byExtension)) {
            const size = items.reduce((sum, item) => sum + item.size, 0);
            console.log(`${ext}: ${items.length} файлов (${formatSize(size)})`);
        }

        console.log('\n🏆 Топ-5 самых больших файлов:');
        largest.forEach((item, index) => {
            console.log(
                `${index + 1}. ${item.name} (${formatSize(item.size)}) - ${item.relativePath}`
            );
        });

        console.log('\n📉 Топ-5 самых маленьких файлов:');
        smallest.forEach((item, index) => {
            console.log(
                `${index + 1}. ${item.name} (${formatSize(item.size)}) - ${item.relativePath}`
            );
        });

        const report = {
            variant: VARIANT,
            student: 'Минчук Станислав Игоревич',
            group: '401',
            date: new Date().toLocaleString('ru-RU'),
            directory: target,
            filter: ['.js', '.json', '.txt', '.md'],
            totalFolders: result.folders,
            totalFiles: result.files.length,
            totalSizeBytes: result.totalSize,
            totalSizeKB: +(result.totalSize / 1024).toFixed(2),
            totalSizeMB: +(result.totalSize / 1024 / 1024).toFixed(2),
            filesByExtension: Object.fromEntries(
                Object.entries(result.byExtension).map(([ext, items]) => [
                    ext,
                    {
                        count: items.length,
                        sizeBytes: items.reduce((sum, item) => sum + item.size, 0)
                    }
                ])
            ),
            largestFiles: largest,
            smallestFiles: smallest
        };

        await fs.writeFile(
            path.join('.', `report_${VARIANT}.json`),
            JSON.stringify(report, null, 4),
            'utf8'
        );

        console.log(`\n📄 Отчёт сохранён: report_${VARIANT}.json`);
    } catch (error) {
        console.error('Ошибка задания 3:', error.message);
    }
}

main();
