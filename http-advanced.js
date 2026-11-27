const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const HTTPS_PORT = 3443;
const GROUP = 'ББМО-01-23';
const GROUP_HEADER = 'BBMO-01-23';
const PUBLIC_DIR = path.join(__dirname, 'public');

const cache = new Map();

const metrics = {
    group: GROUP,
    total: 0,
    byMethod: {},
    byStatus: {},
    startTime: Date.now()
};

const middleware = [];

function addMiddleware(fn) {
    middleware.push(fn);
}

function runMiddleware(req, res, index = 0) {
    if (index >= middleware.length) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        let nextCalled = false;

        const next = (error) => {
            if (nextCalled) {
                return;
            }

            nextCalled = true;

            if (error) {
                reject(error);
                return;
            }

            runMiddleware(
                req,
                res,
                index + 1
            ).then(resolve).catch(reject);
        };

        try {
            fnWithNext(
                middleware[index],
                req,
                res,
                next
            );
        } catch (error) {
            reject(error);
        }
    });
}

function fnWithNext(fn, req, res, next) {
    fn(req, res, next);
}

function updateMetrics(req, statusCode) {
    metrics.total++;

    metrics.byMethod[req.method] =
        (metrics.byMethod[req.method] || 0) + 1;

    metrics.byStatus[statusCode] =
        (metrics.byStatus[statusCode] || 0) + 1;
}

function setGroupHeader(res) {
    res.setHeader('X-Group', GROUP_HEADER);
}

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif'
    };

    return types[ext] || 'application/octet-stream';
}

function serveStatic(req, res) {
    const relativePath =
        decodeURIComponent(
            req.url.replace('/static/', '')
        );

    if (
        relativePath.includes('..') ||
        path.isAbsolute(relativePath)
    ) {
        res.statusCode = 403;
        setGroupHeader(res);
        res.end('403 Forbidden');
        return true;
    }

    const filePath = path.join(
        PUBLIC_DIR,
        relativePath
    );

    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.statusCode = 403;
        setGroupHeader(res);
        res.end('403 Forbidden');
        return true;
    }

    if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        setGroupHeader(res);
        res.end('404 Not Found');
        return true;
    }

    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
        res.statusCode = 404;
        setGroupHeader(res);
        res.end('404 Not Found');
        return true;
    }

    const etag = `"${crypto
        .createHash('md5')
        .update(
            stat.size + ':' + stat.mtimeMs
        )
        .digest('hex')}"`;

    if (
        req.headers['if-none-match'] === etag
    ) {
        res.statusCode = 304;

        setGroupHeader(res);

        res.setHeader('ETag', etag);
        res.end();

        return true;
    }

    const modified =
        req.headers['if-modified-since'];

    if (
        modified &&
        new Date(modified) >= stat.mtime
    ) {
        res.statusCode = 304;

        setGroupHeader(res);

        res.setHeader(
            'Last-Modified',
            stat.mtime.toUTCString()
        );

        res.end();

        return true;
    }

    const cacheKey = filePath;
    const now = Date.now();

    if (
        cache.has(cacheKey) &&
        now - cache.get(cacheKey).time < 60000
    ) {
        const cached = cache.get(cacheKey);

        res.statusCode = 200;

        setGroupHeader(res);

        res.setHeader(
            'Content-Type',
            getMimeType(filePath)
        );

        res.setHeader(
            'Cache-Control',
            'max-age=60'
        );

        res.setHeader('ETag', cached.etag);

        res.end(cached.data);

        return true;
    }

    const data = fs.readFileSync(filePath);

    cache.set(cacheKey, {
        data,
        time: now,
        etag
    });

    res.statusCode = 200;

    setGroupHeader(res);

    res.setHeader(
        'Content-Type',
        getMimeType(filePath)
    );

    res.setHeader(
        'Cache-Control',
        'max-age=60'
    );

    res.setHeader(
        'ETag',
        etag
    );

    res.setHeader(
        'Last-Modified',
        stat.mtime.toUTCString()
    );

    res.end(data);

    return true;
}

addMiddleware((req, res, next) => {
    console.log(
        `[INFO] ${req.method} ${req.url}`
    );

    next();
});

addMiddleware((req, res, next) => {
    setGroupHeader(res);
    next();
});

async function requestHandler(req, res) {
    try {
        await runMiddleware(req, res);

        if (
            req.method === 'GET' &&
            req.url.startsWith('/static/')
        ) {
            serveStatic(req, res);

            updateMetrics(req, res.statusCode);

            return;
        }

        if (
            req.method === 'GET' &&
            req.url === '/metrics'
        ) {
            const result = {
                group: GROUP,
                total: metrics.total,
                byMethod: metrics.byMethod,
                byStatus: metrics.byStatus,
                uptime: Math.floor(
                    (Date.now() - metrics.startTime) / 1000
                )
            };

            res.statusCode = 200;

            res.setHeader(
                'Content-Type',
                'application/json; charset=utf-8'
            );

            res.end(
                JSON.stringify(result, null, 2)
            );

            updateMetrics(req, 200);

            return;
        }

        if (
            req.method === 'GET' &&
            req.url === '/stream'
        ) {
            const filePath = path.join(
                __dirname,
                'large-file.bin'
            );

            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(
                    filePath,
                    Buffer.alloc(10 * 1024 * 1024)
                );
            }

            res.statusCode = 200;

            setGroupHeader(res);

            res.setHeader(
                'Content-Type',
                'application/octet-stream'
            );

            const stream =
                fs.createReadStream(filePath);

            stream.on('data', chunk => {
                console.log(
                    `[STREAM] Передано: ${chunk.length} байт`
                );
            });

            stream.on('error', error => {
                console.error(
                    '[STREAM ERROR]',
                    error.message
                );

                if (!res.headersSent) {
                    res.statusCode = 500;
                    res.end('Stream error');
                }
            });

            stream.pipe(res);

            return;
        }

        if (
            req.method === 'GET' &&
            req.url === '/'
        ) {
            res.statusCode = 200;

            res.setHeader(
                'Content-Type',
                'text/html; charset=utf-8'
            );

            res.end(`
                <h1>HTTP Advanced Server</h1>
                <p>Группа: ${GROUP}</p>
                <p>Используйте /static/index.html</p>
                <p>Используйте /metrics</p>
            `);

            updateMetrics(req, 200);

            return;
        }

        res.statusCode = 404;

        setGroupHeader(res);

        res.end('404 Not Found');

        updateMetrics(req, 404);

    } catch (error) {
        console.error(
            '[ERROR]',
            error.message
        );

        if (!res.headersSent) {
            res.statusCode = 500;
            setGroupHeader(res);
            res.end('500 Internal Server Error');

            updateMetrics(req, 500);
        }
    }
}

const server = http.createServer(
    requestHandler
);

server.on('error', error => {
    console.error(
        '[SERVER ERROR]',
        error.message
    );
});

server.on('clientError', (error, socket) => {
    console.error(
        '[CLIENT ERROR]',
        error.message
    );

    socket.end(
        'HTTP/1.1 400 Bad Request\r\n\r\n'
    );
});

server.listen(PORT, () => {
    console.log(
        `[INFO] HTTP-сервер запущен на порту ${PORT}`
    );
});

if (
    fs.existsSync('cert/key.pem') &&
    fs.existsSync('cert/cert.pem')
) {
    const options = {
        key: fs.readFileSync('cert/key.pem'),
        cert: fs.readFileSync('cert/cert.pem')
    };

    const httpsServer = https.createServer(
        options,
        requestHandler
    );

    httpsServer.listen(
        HTTPS_PORT,
        () => {
            console.log(
                `[INFO] HTTPS-сервер запущен на порту ${HTTPS_PORT}`
            );

            console.log(
                `[INFO] Группа: ${GROUP}`
            );
        }
    );

    httpsServer.on('error', error => {
        console.error(
            '[HTTPS ERROR]',
            error.message
        );
    });
} else {
    console.log(
        '[INFO] HTTPS не запущен: сертификаты не найдены'
    );
}

process.on('SIGINT', () => {
    console.log('\n[INFO] Завершение серверов...');

    server.close(() => {
        console.log('[INFO] HTTP-сервер остановлен');
        process.exit(0);
    });
});