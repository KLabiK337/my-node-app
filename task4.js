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