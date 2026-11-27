const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const PORT = 3000;

let users = [
    {
        id: 1,
        name: 'Иванов Иван',
        group: 'ББМО-01-23'
    },
    {
        id: 2,
        name: 'Петров Петр',
        group: 'ББМО-01-23'
    },
    {
        id: 3,
        name: 'Сидорова Анна',
        group: 'ББМО-02-23'
    }
];

let nextId = 4;

app.use(bodyParser());


// GET /api/users
router.get('/api/users', (ctx) => {

    ctx.body = users;

});


// POST /api/users
router.post('/api/users', (ctx) => {

    const { name, group } = ctx.request.body || {};

    if (
        !name ||
        !group ||
        typeof name !== 'string' ||
        typeof group !== 'string'
    ) {

        ctx.status = 400;

        ctx.body = {
            error: 'Поля name и group обязательны',
            status: 400
        };

        return;
    }

    const user = {
        id: nextId++,
        name: name.trim(),
        group: group.trim()
    };

    users.push(user);

    ctx.status = 201;

    ctx.body = user;

});


// PUT /api/users/:id
router.put('/api/users/:id', (ctx) => {

    const id = Number(ctx.params.id);

    const user = users.find(
        item => item.id === id
    );

    if (!user) {

        ctx.status = 404;

        ctx.body = {
            error: 'Пользователь не найден',
            status: 404
        };

        return;
    }

    const { name, group } = ctx.request.body || {};

    if (
        !name ||
        !group ||
        typeof name !== 'string' ||
        typeof group !== 'string'
    ) {

        ctx.status = 400;

        ctx.body = {
            error: 'Поля name и group обязательны',
            status: 400
        };

        return;
    }

    user.name = name.trim();
    user.group = group.trim();

    ctx.body = user;

});


// DELETE /api/users/:id
router.delete('/api/users/:id', (ctx) => {

    const id = Number(ctx.params.id);

    const index = users.findIndex(
        item => item.id === id
    );

    if (index === -1) {

        ctx.status = 404;

        ctx.body = {
            error: 'Пользователь не найден',
            status: 404
        };

        return;
    }

    users.splice(index, 1);

    ctx.body = {
        message: 'Пользователь успешно удалён',
        id: id
    };

});


app.use(router.routes());

app.use(router.allowedMethods());


app.listen(PORT, () => {

    console.log('Лабораторная работа №15 — Задание 2');

    console.log(
        `REST API запущен на http://localhost:${PORT}`
    );

});
const fs = require('fs').promises;
const path = require('path');

const VARIANT = 12;
const ROOT = path.join('.', `project_${VARIANT}`);

const descriptions = {
    src: 'Каталог исходного кода проекта.',
    modules: 'Каталог модулей программы.',
    components: 'Каталог компонентов приложения.',
    utils: 'Каталог вспомогательных функций.',
    data: 'Каталог данных проекта.',
    input: 'Каталог входных данных.',
    output: 'Каталог результатов работы программы.',
    temp: 'Каталог временных файлов.'
};

async function createFolderFiles(dir) {
    const name = path.basename(dir);

    await fs.writeFile(
        path.join(dir, 'info.txt'),
        `Назначение папки: ${descriptions[name] || 'Рабочая папка проекта.'}\n`,
        'utf8'
    );

    // Вариант 12 чётный: README.md создаётся в каждой папке.
    await fs.writeFile(
        path.join(dir, 'README.md'),
        `# ${name}\n\nДата создания: ${new Date().toLocaleString('ru-RU')}\n`,
        'utf8'
    );
}

async function printTree(dir, prefix = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const last = i === entries.length - 1;
        const branch = last ? '└── ' : '├── ';
        console.log(prefix + branch + entry.name);

        if (entry.isDirectory()) {
            await printTree(
                path.join(dir, entry.name),
                prefix + (last ? '    ' : '│   ')
            );
        }
    }
}

async function main() {
    try {
        await fs.rm(ROOT, { recursive: true, force: true });

        const folders = [
            path.join(ROOT, 'src'),
            path.join(ROOT, 'src', 'modules'),
            path.join(ROOT, 'src', 'components'),
            path.join(ROOT, 'src', 'utils'),
            path.join(ROOT, 'data'),
            path.join(ROOT, 'data', 'input'),
            path.join(ROOT, 'data', 'output'),
            path.join(ROOT, 'temp')
        ];

        for (const dir of folders) {
            await fs.mkdir(dir, { recursive: true });
            await createFolderFiles(dir);
        }

        console.log(`Создана структура ${ROOT}:`);
        console.log(`project_${VARIANT}/`);
        await printTree(ROOT);

        const temp = path.join(ROOT, 'temp');
        const movedTemp = path.join(ROOT, 'data', 'temp');

        await fs.rename(temp, movedTemp);
        console.log('\n✓ temp перемещена в data');

        const output = path.join(ROOT, 'data', 'output');
        const results = path.join(ROOT, 'data', 'results');

        await fs.rename(output, results);
        console.log('✓ data/output переименована в data/results');

        await fs.rm(movedTemp, { recursive: true, force: true });
        console.log('✓ data/temp удалена');

        console.log('\nОбновлённое дерево:');
        console.log(`project_${VARIANT}/`);
        await printTree(ROOT);
    } catch (error) {
        console.error('Ошибка задания 2:', error.message);
    }
}

main();
