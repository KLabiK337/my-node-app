const express = require('express');

const app = express();

const PORT = 3000;

app.use(express.json());


let books = [

    {
        id: 1,
        title: 'Война и мир',
        author: 'Толстой',
        year: 1869
    },

    {
        id: 2,
        title: 'Преступление и наказание',
        author: 'Достоевский',
        year: 1866
    },

    {
        id: 3,
        title: 'Анна Каренина',
        author: 'Толстой',
        year: 1877
    }

];


let nextId = 4;


// GET /api/books
app.get('/api/books', (req, res) => {

    res.json(books);

});


// GET /api/books/search
app.get('/api/books/search', (req, res) => {

    const author =
        String(req.query.author || '')
            .toLowerCase();

    const result =
        books.filter(book =>
            book.author.toLowerCase()
                .includes(author)
        );

    res.json(result);

});


// GET /api/books/:id
app.get('/api/books/:id', (req, res) => {

    const id =
        Number(req.params.id);

    const book =
        books.find(item => item.id === id);

    if (!book) {

        return res.status(404).json({

            error: 'Книга не найдена',

            status: 404

        });

    }

    res.json(book);

});


// POST /api/books
app.post('/api/books', (req, res) => {

    const {
        title,
        author,
        year
    } = req.body;


    if (
        !title ||
        !author ||
        !year
    ) {

        return res.status(400).json({

            error:
                'Поля title, author и year обязательны',

            status: 400

        });

    }


    if (
        typeof title !== 'string' ||
        typeof author !== 'string' ||
        !Number.isInteger(year)
    ) {

        return res.status(400).json({

            error: 'Некорректные данные',

            status: 400

        });

    }


    const book = {

        id: nextId++,

        title: title.trim(),

        author: author.trim(),

        year: year

    };


    books.push(book);


    res.status(201).json(book);

});


// PUT /api/books/:id
app.put('/api/books/:id', (req, res) => {

    const id =
        Number(req.params.id);


    const book =
        books.find(item => item.id === id);


    if (!book) {

        return res.status(404).json({

            error: 'Книга не найдена',

            status: 404

        });

    }


    const {
        title,
        author,
        year
    } = req.body;


    if (
        title !== undefined &&
        typeof title !== 'string'
    ) {

        return res.status(400).json({

            error: 'Некорректное название',

            status: 400

        });

    }


    if (
        author !== undefined &&
        typeof author !== 'string'
    ) {

        return res.status(400).json({

            error: 'Некорректный автор',

            status: 400

        });

    }


    if (
        year !== undefined &&
        !Number.isInteger(year)
    ) {

        return res.status(400).json({

            error: 'Некорректный год',

            status: 400

        });

    }


    if (title !== undefined) {
        book.title = title.trim();
    }

    if (author !== undefined) {
        book.author = author.trim();
    }

    if (year !== undefined) {
        book.year = year;
    }


    res.json(book);

});


// DELETE /api/books/:id
app.delete('/api/books/:id', (req, res) => {

    const id =
        Number(req.params.id);


    const index =
        books.findIndex(
            item => item.id === id
        );


    if (index === -1) {

        return res.status(404).json({

            error: 'Книга не найдена',

            status: 404

        });

    }


    books.splice(index, 1);


    res.json({

        message: 'Книга успешно удалена',

        id: id

    });

});


app.listen(PORT, () => {

    console.log(
        'Задание 2 запущено'
    );

    console.log(
        `http://localhost:${PORT}`
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
