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