const http = require('http');

const PORT = 3000;

const GROUP = 'ББМО-01-23';

// В HTTP-заголовках используем только ASCII
const GROUP_HEADER = 'BBMO-01-23';

const server = http.createServer((req, res) => {

    console.log(
        `[${new Date().toLocaleString('ru-RU')}] ` +
        `${req.method} ${req.url}`
    );

    // GET /headers
    if (req.method === 'GET' && req.url === '/headers') {

        res.statusCode = 200;

        res.setHeader(
            'Content-Type',
            'application/json; charset=utf-8'
        );

        res.setHeader(
            'X-Powered-By',
            'Node.js'
        );

        res.setHeader(
            'X-Group',
            GROUP_HEADER
        );

        res.setHeader(
            'Cache-Control',
            'no-cache'
        );

        const result = {
            headers: req.headers,
            method: req.method,
            url: req.url,
            httpVersion: req.httpVersion,
            group: GROUP
        };

        res.end(
            JSON.stringify(result, null, 2)
        );

        return;
    }

    // GET /headers/set
    if (
        req.method === 'GET' &&
        req.url === '/headers/set'
    ) {

        res.statusCode = 200;

        res.setHeader(
            'Content-Type',
            'text/html; charset=utf-8'
        );

        res.setHeader(
            'X-Powered-By',
            'Node.js'
        );

        res.setHeader(
            'X-Group',
            GROUP_HEADER
        );

        res.setHeader(
            'Cache-Control',
            'no-cache'
        );

        res.end(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>HTTP Headers</title>
            </head>
            <body>
                <h1>Заголовки установлены</h1>

                <p>X-Powered-By:
                    ${res.getHeader('X-Powered-By')}
                </p>

                <p>X-Group:
                    ${res.getHeader('X-Group')}
                </p>

                <p>Группа:
                    ${GROUP}
                </p>

                <p>Cache-Control:
                    ${res.getHeader('Cache-Control')}
                </p>
            </body>
            </html>
        `);

        return;
    }

    // GET /headers/check
    if (
        req.method === 'GET' &&
        req.url === '/headers/check'
    ) {

        res.statusCode = 200;

        res.setHeader(
            'Content-Type',
            'application/json; charset=utf-8'
        );

        res.setHeader(
            'X-Group',
            GROUP_HEADER
        );

        const result = {
            hasContentType:
                res.hasHeader('Content-Type'),

            hasXGroup:
                res.hasHeader('X-Group'),

            hasUnknown:
                res.hasHeader('X-Unknown')
        };

        res.end(
            JSON.stringify(result, null, 2)
        );

        return;
    }

    // Неизвестный маршрут
    res.statusCode = 404;

    res.setHeader(
        'Content-Type',
        'application/json; charset=utf-8'
    );

    res.end(
        JSON.stringify({
            error: 'Not Found',
            path: req.url
        }, null, 2)
    );
});

server.listen(PORT, () => {
    console.log(
        `HTTP-заголовки: сервер на порту ${PORT}`
    );

    console.log(
        `Группа: ${GROUP}`
    );
});