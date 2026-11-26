const express = require('express');
const fs = require('fs');

const app = express();

const PORT = 3000;

app.use(express.json());


let books = [

    {
        id: 1,
        title: 'Война и мир',
        author: 'Толстой',
        year: 1869,
        genre: 'роман'
    },

    {
        id: 2,
        title: 'Преступление и наказание',
        author: 'Достоевский',
        year: 1866,
        genre: 'роман'
    },

    {
        id: 3,
        title: 'Анна Каренина',
        author: 'Толстой',
        year: 1877,
        genre: 'роман'
    },

    {
        id: 4,
        title: 'Мастер и Маргарита',
        author: 'Булгаков',
        year: 1967,
        genre: 'роман'
    },

    {
        id: 5,
        title: 'Капитанская дочка',
        author: 'Пушкин',
        year: 1836,
        genre: 'повесть'
    }

];


let nextId = 6;


// ========================================
// ЛОГИРОВАНИЕ В ФАЙЛ
// ========================================

function logOperation(message) {

    const line =
        `[${new Date().toLocaleString('ru-RU')}] ${message}\n`;

    fs.appendFileSync(
        'operations.log',
        line,
        'utf8'
    );

}


// ========================================
// ВАЛИДАЦИЯ
// ========================================

function validateBook(data) {

    if (
        !data.title ||
        typeof data.title !== 'string' ||
        !data.title.trim()
    ) {

        return 'Название книги обязательно';

    }


    if (
        !data.author ||
        typeof data.author !== 'string' ||
        !data.author.trim()
    ) {

        return 'Автор обязателен';

    }


    if (
        !Number.isInteger(data.year) ||
        data.year < 0 ||
        data.year > new Date().getFullYear()
    ) {

        return 'Некорректный год издания';

    }


    return null;

}


// ========================================
// GET BOOKS
// ========================================

app.get('/api/books', (req, res) => {

    let result =
        [...books];


    // Фильтр по автору
    if (req.query.author) {

        result =
            result.filter(
                book =>
                    book.author.toLowerCase()
                    === String(req.query.author).toLowerCase()
            );

    }


    // Фильтр по году
    if (req.query.year) {

        const year =
            Number(req.query.year);

        result =
            result.filter(
                book => book.year === year
            );

    }


    // Диапазон лет
    if (req.query.yearFrom) {

        const from =
            Number(req.query.yearFrom);

        result =
            result.filter(
                book => book.year >= from
            );

    }


    if (req.query.yearTo) {

        const to =
            Number(req.query.yearTo);

        result =
            result.filter(
                book => book.year <= to
            );

    }


    // Поиск
    if (req.query.search) {

        const search =
            String(
                req.query.search
            ).toLowerCase();


        result =
            result.filter(book =>

                book.title
                    .toLowerCase()
                    .includes(search)

                ||

                book.author
                    .toLowerCase()
                    .includes(search)

            );

    }


    // Сортировка
    if (req.query.sort) {

        const sort =
            String(req.query.sort);

        const descending =
            sort.startsWith('-');

        const field =
            descending
                ? sort.slice(1)
                : sort;


        if (
            field === 'title' ||
            field === 'year'
        ) {

            result.sort((a, b) => {

                if (
                    a[field] < b[field]
                ) {

                    return descending
                        ? 1
                        : -1;

                }


                if (
                    a[field] > b[field]
                ) {

                    return descending
                        ? -1
                        : 1;

                }


                return 0;

            });

        }

    }


    // Пагинация
    const limit =
        Math.max(
            1,
            Number(req.query.limit) || 10
        );


    const page =
        Math.max(
            1,
            Number(req.query.page) || 1
        );


    const total =
        result.length;


    const totalPages =
        Math.ceil(
            total / limit
        );


    const start =
        (page - 1) * limit;


    const data =
        result.slice(
            start,
            start + limit
        );


    res.json({

        data,

        pagination: {

            total,

            page,

            limit,

            totalPages

        }

    });

});


// ========================================
// GET ONE
// ========================================

app.get('/api/books/:id', (req, res) => {

    const id =
        Number(req.params.id);


    const book =
        books.find(
            item => item.id === id
        );


    if (!book) {

        return res.status(404).json({

            error: 'Книга не найдена',

            status: 404

        });

    }


    res.json(book);

});


// ========================================
// POST
// ========================================

app.post('/api/books', (req, res) => {

    const data =
        req.body;


    const error =
        validateBook(data);


    if (error) {

        return res.status(400).json({

            error,

            status: 400

        });

    }


    // Проверка дубля
    const duplicate =
        books.find(book =>

            book.title.toLowerCase()
            === data.title.trim().toLowerCase()

            &&

            book.author.toLowerCase()
            === data.author.trim().toLowerCase()

        );


    if (duplicate) {

        return res.status(400).json({

            error:
                'Такая книга уже существует',

            status: 400

        });

    }


    const book = {

        id:
            nextId++,

        title:
            data.title.trim(),

        author:
            data.author.trim(),

        year:
            data.year,

        genre:
            data.genre || 'не указан'

    };


    books.push(book);


    logOperation(
        `POST /api/books — создана книга ${book.id}`
    );


    res.status(201).json(book);

});


// ========================================
// PUT
// ========================================

app.put('/api/books/:id', (req, res) => {

    const id =
        Number(req.params.id);


    const book =
        books.find(
            item => item.id === id
        );


    if (!book) {

        return res.status(404).json({

            error: 'Книга не найдена',

            status: 404

        });

    }


    if (req.body.title !== undefined) {

        book.title =
            req.body.title;

    }


    if (req.body.author !== undefined) {

        book.author =
            req.body.author;

    }


    if (req.body.year !== undefined) {

        if (
            !Number.isInteger(
                req.body.year
            )
        ) {

            return res.status(400).json({

                error:
                    'Некорректный год',

                status: 400

            });

        }


        book.year =
            req.body.year;

    }


    if (req.body.genre !== undefined) {

        book.genre =
            req.body.genre;

    }


    logOperation(
        `PUT /api/books/${id} — книга обновлена`
    );


    res.json(book);

});


// ========================================
// DELETE
// ========================================

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


    books.splice(
        index,
        1
    );


    logOperation(
        `DELETE /api/books/${id} — книга удалена`
    );


    res.json({

        message:
            'Книга удалена',

        id

    });

});


// ========================================
// СТАТИСТИКА
// ========================================

app.get('/api/books/stats', (req, res) => {

    const authors = {};

    const genres = {};


    books.forEach(book => {

        authors[book.author] =
            (authors[book.author] || 0) + 1;


        genres[book.genre] =
            (genres[book.genre] || 0) + 1;

    });


    const years =
        books.map(book => book.year);


    res.json({

        total:
            books.length,

        byAuthors:
            authors,

        oldestYear:
            years.length
                ? Math.min(...years)
                : null,

        newestYear:
            years.length
                ? Math.max(...years)
                : null,

        byGenres:
            genres

    });

});


app.listen(PORT, () => {

    console.log(
        'Задание 4 запущено'
    );

    console.log(
        `http://localhost:${PORT}`
    );

});
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const readline = require('readline');

const VARIANT = 12;
const TOTAL_LINES = 100000;
const INPUT = path.join('.', `data_${VARIANT}.txt`);
const OUTPUT = path.join('.', `processed_${VARIANT}.txt`);
const FILTERED = path.join('.', `filtered_${VARIANT}.txt`);

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function generateFile() {
    if (await fileExists(INPUT)) return;

    const handle = await fs.open(INPUT, 'w');

    try {
        for (let i = 1; i <= TOTAL_LINES; i++) {
            const number = Math.floor(Math.random() * 1000) + 1;
            await handle.write(`${i}, ${number}, Вариант ${VARIANT}\n`);
        }
    } finally {
        await handle.close();
    }

    console.log(`✓ Создан файл ${INPUT}`);
}

async function main() {
    try {
        await generateFile();

        const stats = await fs.stat(INPUT);

        console.log(`📊 Обработка файла: data_${VARIANT}.txt`);
        console.log(
            `Размер файла: ${(stats.size / 1024 / 1024).toFixed(2)} МБ`
        );

        const inputStream = fsSync.createReadStream(INPUT, {
            encoding: 'utf8',
            highWaterMark: 64 * 1024
        });

        const outputStream = fsSync.createWriteStream(OUTPUT, {
            encoding: 'utf8'
        });

        const filteredStream = fsSync.createWriteStream(FILTERED, {
            encoding: 'utf8'
        });

        const rl = readline.createInterface({
            input: inputStream,
            crlfDelay: Infinity
        });

        let count = 0;
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;
        let lastPercent = 0;

        for await (const line of rl) {
            if (!line.trim()) continue;

            const parts = line.split(',');
            const number = Number(parts[1]?.trim());

            if (Number.isNaN(number)) continue;

            count++;
            sum += number;
            min = Math.min(min, number);
            max = Math.max(max, number);

            // Вариант 12 относится к вариантам 11-15:
            // записываем только строки с числами > 500.
            if (number > 500) {
                filteredStream.write(line + '\n');
            }

            const percent = Math.floor((count / TOTAL_LINES) * 100);

            if (percent >= lastPercent + 10) {
                lastPercent = percent - (percent % 10);
                console.log(
                    `⏳ Прогресс: ${lastPercent}% (${count.toLocaleString()} строк обработано)`
                );
            }
        }

        const average = sum / count;

        outputStream.write(
            [
                `Вариант: ${VARIANT}`,
                'Студент: Минчук Станислав Игоревич',
                'Группа: 401',
                '',
                `Всего строк: ${count}`,
                `Сумма чисел: ${sum}`,
                `Среднее значение: ${average.toFixed(2)}`,
                `Максимальное число: ${max}`,
                `Минимальное число: ${min}`,
                `Дополнительно: строки с числами больше 500 записаны в ${path.basename(FILTERED)}`
            ].join('\n')
        );

        outputStream.end();
        filteredStream.end();

        await Promise.all([
            new Promise((resolve, reject) => {
                outputStream.once('finish', resolve);
                outputStream.once('error', reject);
            }),
            new Promise((resolve, reject) => {
                filteredStream.once('finish', resolve);
                filteredStream.once('error', reject);
            })
        ]);

        console.log('✅ Обработка завершена!');
        console.log(`- Всего строк: ${count.toLocaleString()}`);
        console.log(`- Сумма чисел: ${sum}`);
        console.log(`- Среднее значение: ${average.toFixed(2)}`);
        console.log(`- Максимальное число: ${max}`);
        console.log(`- Минимальное число: ${min}`);
        console.log(`📄 Результаты сохранены в: processed_${VARIANT}.txt`);
        console.log(`📄 Строки > 500 сохранены в: filtered_${VARIANT}.txt`);
    } catch (error) {
        console.error('Ошибка задания 4:', error.message);
    }
}

main();
