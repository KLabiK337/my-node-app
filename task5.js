const express = require('express');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const {
    body,
    validationResult
} = require('express-validator');

const app = express();

const PORT = 3000;

const JWT_SECRET =
    'lab16_secret_key_2026';

app.use(express.json());


// ========================================
// ДАННЫЕ
// ========================================

const firstNames = [

    'Алексей',
    'Анна',
    'Иван',
    'Мария',
    'Дмитрий',
    'Елена',
    'Максим',
    'Ольга',
    'Сергей',
    'Наталья'

];


const lastNames = [

    'Иванов',
    'Петров',
    'Сидоров',
    'Кузнецов',
    'Смирнов',
    'Васильев',
    'Попов',
    'Морозов',
    'Новиков',
    'Фёдоров'

];


const bookTitles = [

    'Война и мир',
    'Преступление и наказание',
    'Анна Каренина',
    'Мастер и Маргарита',
    'Евгений Онегин',
    'Отцы и дети',
    'Герой нашего времени',
    'Идиот',
    'Дубровский',
    'Капитанская дочка'

];


const authors = [

    'Толстой',
    'Достоевский',
    'Булгаков',
    'Пушкин',
    'Тургенев',
    'Лермонтов',
    'Гоголь',
    'Чехов',
    'Твардовский',
    'Набоков'

];


const genres = [

    'роман',
    'повесть',
    'рассказ',
    'поэзия',
    'фантастика'

];


let books = [];

let users = [];

let nextBookId = 1;

let nextUserId = 1;


// ========================================
// КЭШ
// ========================================

const cache = new Map();

const CACHE_TIME =
    5 * 60 * 1000;


// ========================================
// ГЕНЕРАЦИЯ ISBN
// ========================================

function generateISBN(index) {

    return `978-5-0000-${String(index).padStart(5, '0')}`;

}


// ========================================
// ГЕНЕРАЦИЯ 100 КНИГ
// ========================================

function generateBooks() {

    books = [];

    for (let i = 0; i < 100; i++) {

        books.push({

            id:
                nextBookId++,

            title:
                `${bookTitles[i % bookTitles.length]} ${i + 1}`,

            author:
                authors[i % authors.length],

            year:
                1850 + (i % 170),

            genre:
                genres[i % genres.length],

            isbn:
                generateISBN(i + 1),

            available:
                i % 3 !== 0,

            reviews: []

        });

    }

}


// ========================================
// ВАЛИДАЦИЯ
// ========================================

const bookValidation = [

    body('title')
        .trim()
        .notEmpty()
        .withMessage(
            'Название книги обязательно'
        ),

    body('author')
        .trim()
        .notEmpty()
        .withMessage(
            'Автор обязателен'
        ),

    body('year')
        .isInt({
            min: 0,
            max: new Date().getFullYear()
        })
        .withMessage(
            'Некорректный год'
        ),

    body('genre')
        .trim()
        .notEmpty()
        .withMessage(
            'Жанр обязателен'
        )

];


function checkValidation(
    req,
    res,
    next
) {

    const errors =
        validationResult(req);


    if (!errors.isEmpty()) {

        return res.status(400).json({

            error:
                'Ошибка валидации',

            details:
                errors.array()

        });

    }


    next();

}


// ========================================
// РЕГИСТРАЦИЯ
// ========================================

app.post(
    '/auth/register',
    [
        body('email')
            .isEmail()
            .withMessage(
                'Некорректный email'
            ),

        body('password')
            .isLength({
                min: 4
            })
            .withMessage(
                'Пароль должен содержать минимум 4 символа'
            ),

        body('name')
            .trim()
            .notEmpty()
            .withMessage(
                'Имя обязательно'
            )
    ],
    checkValidation,
    (req, res) => {

        const {
            email,
            password,
            name
        } = req.body;


        const exists =
            users.find(
                user =>
                    user.email === email
            );


        if (exists) {

            return res.status(400).json({

                error:
                    'Пользователь уже существует'

            });

        }


        const user = {

            id:
                nextUserId++,

            email,

            password,

            name,

            role:
                email === 'admin@example.com'
                    ? 'admin'
                    : 'user'

        };


        users.push(user);


        res.status(201).json({

            message:
                'Регистрация успешна',

            user: {

                id: user.id,

                email: user.email,

                name: user.name,

                role: user.role

            }

        });

    }
);


// ========================================
// LOGIN
// ========================================

app.post(
    '/auth/login',
    (req, res) => {

        const {
            email,
            password
        } = req.body;


        const user =
            users.find(
                item =>
                    item.email === email &&
                    item.password === password
            );


        if (!user) {

            return res.status(401).json({

                error:
                    'Неверный email или пароль',

                status: 401

            });

        }


        const token =
            jwt.sign(

                {
                    id:
                        user.id,

                    email:
                        user.email,

                    role:
                        user.role

                },

                JWT_SECRET,

                {
                    expiresIn:
                        '2h'
                }

            );


        res.json({

            message:
                'Вход выполнен',

            token

        });

    }
);


// ========================================
// JWT MIDDLEWARE
// ========================================

function authenticate(
    req,
    res,
    next
) {

    const header =
        req.headers.authorization;


    if (!header) {

        return res.status(401).json({

            error:
                'Требуется JWT токен',

            status: 401

        });

    }


    const parts =
        header.split(' ');


    if (
        parts.length !== 2 ||
        parts[0] !== 'Bearer'
    ) {

        return res.status(401).json({

            error:
                'Формат Authorization: Bearer TOKEN',

            status: 401

        });

    }


    try {

        const decoded =
            jwt.verify(
                parts[1],
                JWT_SECRET
            );


        req.user =
            decoded;


        next();

    }

    catch (error) {

        return res.status(401).json({

            error:
                'Недействительный JWT токен',

            status: 401

        });

    }

}


// ========================================
// ADMIN MIDDLEWARE
// ========================================

function adminOnly(
    req,
    res,
    next
) {

    if (
        !req.user ||
        req.user.role !== 'admin'
    ) {

        return res.status(403).json({

            error:
                'Доступ только для администратора',

            status: 403

        });

    }


    next();

}


// ========================================
// GET BOOKS
// ========================================

app.get(
    '/api/books',
    authenticate,
    (req, res) => {

        const cacheKey =
            JSON.stringify(
                req.query
            );


        const cached =
            cache.get(cacheKey);


        if (
            cached &&
            Date.now() - cached.time
                < CACHE_TIME
        ) {

            return res.json({

                ...cached.data,

                cached: true

            });

        }


        let result =
            [...books];


        // Фильтр автора
        if (req.query.author) {

            result =
                result.filter(
                    book =>
                        book.author.toLowerCase()
                        === String(
                            req.query.author
                        ).toLowerCase()
                );

        }


        // Фильтр года
        if (req.query.year) {

            const year =
                Number(req.query.year);

            result =
                result.filter(
                    book =>
                        book.year === year
                );

        }


        // Диапазон
        if (req.query.yearFrom) {

            const from =
                Number(
                    req.query.yearFrom
                );

            result =
                result.filter(
                    book =>
                        book.year >= from
                );

        }


        if (req.query.yearTo) {

            const to =
                Number(
                    req.query.yearTo
                );

            result =
                result.filter(
                    book =>
                        book.year <= to
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
                String(
                    req.query.sort
                );


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
                Number(
                    req.query.limit
                ) || 10
            );


        const page =
            Math.max(
                1,
                Number(
                    req.query.page
                ) || 1
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


        const response = {

            data,

            total,

            page,

            limit,

            totalPages

        };


        cache.set(
            cacheKey,
            {
                time:
                    Date.now(),

                data:
                    response
            }
        );


        res.json(response);

    }
);


// ========================================
// GET ONE
// ========================================

app.get(
    '/api/books/:id',
    authenticate,
    (req, res) => {

        const id =
            Number(
                req.params.id
            );


        const book =
            books.find(
                item =>
                    item.id === id
            );


        if (!book) {

            return res.status(404).json({

                error:
                    'Книга не найдена',

                status: 404

            });

        }


        res.json(book);

    }
);


// ========================================
// POST BOOK
// ТОЛЬКО ADMIN
// ========================================

app.post(
    '/api/books',
    authenticate,
    adminOnly,
    bookValidation,
    checkValidation,
    (req, res) => {

        const {
            title,
            author,
            year,
            genre
        } = req.body;


        const duplicate =
            books.find(book =>

                book.title.toLowerCase()
                === title.toLowerCase()

                &&

                book.author.toLowerCase()
                === author.toLowerCase()

            );


        if (duplicate) {

            return res.status(400).json({

                error:
                    'Книга с таким названием и автором уже существует',

                status: 400

            });

        }


        const book = {

            id:
                nextBookId++,

            title,

            author,

            year,

            genre,

            isbn:
                generateISBN(
                    nextBookId
                ),

            available:
                true,

            reviews: []

        };


        books.push(book);

        cache.clear();


        res.status(201).json(book);

    }
);


// ========================================
// PUT BOOK
// ========================================

app.put(
    '/api/books/:id',
    authenticate,
    (req, res) => {

        const id =
            Number(
                req.params.id
            );


        const book =
            books.find(
                item =>
                    item.id === id
            );


        if (!book) {

            return res.status(404).json({

                error:
                    'Книга не найдена',

                status: 404

            });

        }


        const {
            title,
            author,
            year,
            genre,
            available
        } = req.body;


        if (title !== undefined) {
            book.title = title;
        }

        if (author !== undefined) {
            book.author = author;
        }

        if (year !== undefined) {
            book.year = year;
        }

        if (genre !== undefined) {
            book.genre = genre;
        }

        if (available !== undefined) {
            book.available = available;
        }


        cache.clear();


        res.json(book);

    }
);


// ========================================
// DELETE BOOK
// ADMIN
// ========================================

app.delete(
    '/api/books/:id',
    authenticate,
    adminOnly,
    (req, res) => {

        const id =
            Number(
                req.params.id
            );


        const index =
            books.findIndex(
                item =>
                    item.id === id
            );


        if (index === -1) {

            return res.status(404).json({

                error:
                    'Книга не найдена',

                status: 404

            });

        }


        books.splice(
            index,
            1
        );


        cache.clear();


        res.json({

            message:
                'Книга удалена',

            id

        });

    }
);


// ========================================
// ОТЗЫВ
// ========================================

app.post(
    '/api/books/:id/reviews',
    authenticate,
    (req, res) => {

        const id =
            Number(
                req.params.id
            );


        const book =
            books.find(
                item =>
                    item.id === id
            );


        if (!book) {

            return res.status(404).json({

                error:
                    'Книга не найдена',

                status: 404

            });

        }


        const {
            text,
            rating
        } = req.body;


        if (
            !text ||
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {

            return res.status(400).json({

                error:
                    'Нужны text и rating от 1 до 5',

                status: 400

            });

        }


        const review = {

            user:
                req.user.email,

            text,

            rating,

            date:
                new Date().toISOString()

        };


        book.reviews.push(review);


        res.status(201).json(review);

    }
);


// ========================================
// ADMIN
// ========================================

app.get(
    '/api/admin',
    authenticate,
    adminOnly,
    (req, res) => {

        res.json({

            message:
                'Доступ администратора разрешён',

            totalBooks:
                books.length,

            totalUsers:
                users.length

        });

    }
);


// ========================================
// EXPORT JSON
// ========================================

app.get(
    '/api/books/export',
    authenticate,
    (req, res) => {

        res.json(books);

    }
);


// ========================================
// IMPORT JSON
// ========================================

app.post(
    '/api/books/import',
    authenticate,
    adminOnly,
    (req, res) => {

        if (
            !Array.isArray(
                req.body
            )
        ) {

            return res.status(400).json({

                error:
                    'Ожидается массив книг',

                status: 400

            });

        }


        books =
            req.body.map(
                (book, index) => ({

                    id:
                        index + 1,

                    title:
                        book.title,

                    author:
                        book.author,

                    year:
                        book.year,

                    genre:
                        book.genre || 'не указан',

                    isbn:
                        book.isbn ||
                        generateISBN(index + 1),

                    available:
                        book.available !== false,

                    reviews:
                        book.reviews || []

                })
            );


        nextBookId =
            books.length + 1;


        cache.clear();


        res.json({

            message:
                'Книги импортированы',

            total:
                books.length

        });

    }
);


// ========================================
// RECOMMENDATIONS
// ========================================

app.get(
    '/api/books/recommendations',
    authenticate,
    (req, res) => {

        const genre =
            String(
                req.query.genre || ''
            ).toLowerCase();


        if (!genre) {

            return res.status(400).json({

                error:
                    'Укажите genre',

                status: 400

            });

        }


        const result =
            books.filter(
                book =>
                    book.genre.toLowerCase()
                    === genre
            );


        res.json(result);

    }
);


// ========================================
// AVAILABLE
// ========================================

app.get(
    '/api/books/available',
    authenticate,
    (req, res) => {

        const result =
            books.filter(
                book =>
                    book.available
            );


        res.json(result);

    }
);


// ========================================
// SWAGGER
// ========================================

const swaggerDocument = {

    openapi:
        '3.0.0',

    info: {

        title:
            'Library API — ЛР №16',

        version:
            '1.0.0',

        description:
            'REST API библиотеки'

    },

    servers: [

        {
            url:
                'http://localhost:3000'
        }

    ],

    paths: {

        '/api/books': {

            get: {

                summary:
                    'Получить книги',

                responses: {

                    200: {

                        description:
                            'Список книг'

                    }

                }

            }

        },

        '/api/books/{id}': {

            get: {

                summary:
                    'Получить книгу',

                parameters: [

                    {

                        name:
                            'id',

                        in:
                            'path',

                        required:
                            true,

                        schema: {

                            type:
                                'integer'

                        }

                    }

                ],

                responses: {

                    200: {

                        description:
                            'Книга'

                    },

                    404: {

                        description:
                            'Книга не найдена'

                    }

                }

            }

        },

        '/auth/register': {

            post: {

                summary:
                    'Регистрация'

            }

        },

        '/auth/login': {

            post: {

                summary:
                    'Авторизация'

            }

        }

    }

};


app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(
        swaggerDocument
    )
);


// ========================================
// НАЧАЛЬНЫЕ ДАННЫЕ
// ========================================

generateBooks();


// Администратор для тестирования
users.push({

    id:
        nextUserId++,

    email:
        'admin@example.com',

    password:
        'admin123',

    name:
        'Администратор',

    role:
        'admin'

});


app.listen(
    PORT,
    () => {

        console.log(
            '======================================'
        );

        console.log(
            'Лабораторная работа №16'
        );

        console.log(
            'Задание 5'
        );

        console.log(
            `Сервер: http://localhost:${PORT}`
        );

        console.log(
            `Swagger: http://localhost:${PORT}/api-docs`
        );

        console.log(
            `Создано книг: ${books.length}`
        );

        console.log(
            'Тестовый администратор:'
        );

        console.log(
            'admin@example.com / admin123'
        );

        console.log(
            '======================================'
        );

    }
);