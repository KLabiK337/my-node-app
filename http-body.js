const http = require('http');
const querystring = require('querystring');

const PORT = 3000;
const GROUP = 'ББМО-01-23';
const MAX_SIZE = 1024 * 1024;

function readBody(req, res, callback) {
    let body = '';
    let size = 0;

    req.on('data', chunk => {
        size += chunk.length;

        if (size > MAX_SIZE) {
            res.statusCode = 413;
            res.setHeader(
                'Content-Type',
                'text/plain; charset=utf-8'
            );

            res.end('413 Payload Too Large');

            req.destroy();
            return;
        }

        body += chunk.toString();
    });

    req.on('end', () => {
        callback(body, size);
    });

    req.on('error', error => {
        console.error('Ошибка чтения:', error.message);

        if (!res.headersSent) {
            res.statusCode = 500;
            res.end('Ошибка чтения запроса');
        }
    });
}

const server = http.createServer((req, res) => {

    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
    }

    if (req.url !== '/echo' && req.url !== '/form') {
        res.statusCode = 404;
        res.end('Not Found');
        return;
    }

    readBody(req, res, (body, size) => {

        console.log(
            `[${new Date().toLocaleString('ru-RU')}] ` +
            `${req.method} ${req.url} — размер тела: ${size} байт`
        );

        const contentType =
            req.headers['content-type'] || '';

        if (req.url === '/echo') {

            if (contentType.includes('application/json')) {

                try {
                    const data = JSON.parse(body);

                    data.group = GROUP;

                    res.setHeader(
                        'Content-Type',
                        'application/json; charset=utf-8'
                    );

                    res.end(
                        JSON.stringify(data, null, 2)
                    );

                } catch (error) {
                    res.statusCode = 400;

                    res.setHeader(
                        'Content-Type',
                        'text/plain; charset=utf-8'
                    );

                    res.end('Некорректный JSON');
                }

                return;
            }

            res.setHeader(
                'Content-Type',
                contentType ||
                'text/plain; charset=utf-8'
            );

            res.end(body);

            return;
        }

        if (req.url === '/form') {

            const data = querystring.parse(body);

            res.setHeader(
                'Content-Type',
                'application/json; charset=utf-8'
            );

            res.end(
                JSON.stringify(data, null, 2)
            );
        }
    });
});

server.listen(PORT, () => {
    console.log(`POST-сервер запущен на порту ${PORT}`);
});