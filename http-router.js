const http = require('http');

const PORT = 3000;
const GROUP = 'ББМО-01-23';

let students = [
    {
        id: 1,
        name: 'Иван',
        group: GROUP
    },
    {
        id: 2,
        name: 'Мария',
        group: GROUP
    }
];

let nextId = 3;

function sendJson(res, statusCode, data) {
    res.statusCode = statusCode;

    res.setHeader(
        'Content-Type',
        'application/json; charset=utf-8'
    );

    res.end(JSON.stringify(data, null, 2));
}

function readBody(req, callback) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            callback(JSON.parse(body));
        } catch {
            callback(null);
        }
    });
}

function logRequest(req, statusCode) {
    console.log(
        `[${new Date().toLocaleString('ru-RU')}] ` +
        `[${GROUP}] ${req.method} ${req.url} ${statusCode}`
    );
}

const server = http.createServer((req, res) => {

    const parsedUrl = new URL(
        req.url,
        `http://${req.headers.host}`
    );

    const pathname = decodeURIComponent(
        parsedUrl.pathname
    );

    const query = parsedUrl.searchParams;

    // GET /api/students
    if (
        req.method === 'GET' &&
        pathname === '/api/students'
    ) {
        let result = [...students];

        const group = query.get('group');

        if (group) {
            result = result.filter(
                student => student.group === group
            );
        }

        sendJson(res, 200, result);
        logRequest(req, 200);
        return;
    }

    // GET /api/students/:id
    const getStudentMatch =
        pathname.match(/^\/api\/students\/(\d+)$/);

    if (
        req.method === 'GET' &&
        getStudentMatch
    ) {
        const id = Number(getStudentMatch[1]);

        const student = students.find(
            item => item.id === id
        );

        if (!student) {
            sendJson(res, 404, {
                error: 'Студент не найден'
            });

            logRequest(req, 404);
            return;
        }

        sendJson(res, 200, student);
        logRequest(req, 200);
        return;
    }

    // POST /api/students
    if (
        req.method === 'POST' &&
        pathname === '/api/students'
    ) {
        readBody(req, data => {

            if (!data || !data.name) {
                sendJson(res, 400, {
                    error: 'Необходимо указать name'
                });

                logRequest(req, 400);
                return;
            }

            const student = {
                id: nextId++,
                name: data.name,
                group: data.group || GROUP
            };

            students.push(student);

            sendJson(res, 201, student);
            logRequest(req, 201);
        });

        return;
    }

    // PUT /api/students/:id
    const putMatch =
        pathname.match(/^\/api\/students\/(\d+)$/);

    if (
        req.method === 'PUT' &&
        putMatch
    ) {
        const id = Number(putMatch[1]);

        readBody(req, data => {

            const student = students.find(
                item => item.id === id
            );

            if (!student) {
                sendJson(res, 404, {
                    error: 'Студент не найден'
                });

                logRequest(req, 404);
                return;
            }

            if (data && data.name) {
                student.name = data.name;
            }

            if (data && data.group) {
                student.group = data.group;
            }

            sendJson(res, 200, student);
            logRequest(req, 200);
        });

        return;
    }

    // DELETE /api/students/:id
    const deleteMatch =
        pathname.match(/^\/api\/students\/(\d+)$/);

    if (
        req.method === 'DELETE' &&
        deleteMatch
    ) {
        const id = Number(deleteMatch[1]);

        const index = students.findIndex(
            item => item.id === id
        );

        if (index === -1) {
            sendJson(res, 404, {
                error: 'Студент не найден'
            });

            logRequest(req, 404);
            return;
        }

        students.splice(index, 1);

        sendJson(res, 200, {
            deleted: true,
            id
        });

        logRequest(req, 200);
        return;
    }

    // Проверяем известный путь, но неподдерживаемый метод
    if (pathname.startsWith('/api/students')) {
        sendJson(res, 405, {
            error: 'Method Not Allowed'
        });

        logRequest(req, 405);
        return;
    }

    sendJson(res, 404, {
        error: 'Маршрут не найден'
    });

    logRequest(req, 404);
});

server.listen(PORT, () => {
    console.log(
        `REST API запущен на порту ${PORT}`
    );
});