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
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const PORT = 3000;


// ========================================
// ДАННЫЕ ДЛЯ ГЕНЕРАЦИИ
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
    'Попова',
    'Васильев',
    'Морозова',
    'Новиков',
    'Фёдоров'

];


const groups = [

    'ББМО-01-23',
    'ББМО-02-23',
    'ББМО-03-23',
    'ББМО-04-23'

];


let students = [];

let nextId = 1;


// ========================================
// ГЕНЕРАЦИЯ 50 СТУДЕНТОВ
// ========================================

function generateStudents() {

    students = [];

    for (let i = 0; i < 50; i++) {

        const firstName =
            firstNames[
                i % firstNames.length
            ];


        const lastName =
            lastNames[
                i % lastNames.length
            ];


        students.push({

            id: nextId++,

            name:
                `${firstName} ${lastName}`,

            group:
                groups[
                    i % groups.length
                ],

            course:
                (i % 4) + 1

        });

    }

}


// ========================================
// ВАЛИДАЦИЯ
// ========================================

function validateStudent(
    data,
    partial = false
) {

    if (
        !partial &&
        (
            !data.name ||
            !data.group ||
            data.course === undefined
        )
    ) {

        return (
            'Поля name, group и course обязательны'
        );

    }


    if (
        data.name !== undefined &&
        (
            typeof data.name !== 'string' ||
            !data.name.trim()
        )
    ) {

        return (
            'Поле name должно быть непустой строкой'
        );

    }


    if (
        data.group !== undefined &&
        (
            typeof data.group !== 'string' ||
            !data.group.trim()
        )
    ) {

        return (
            'Поле group должно быть непустой строкой'
        );

    }


    if (
        data.course !== undefined &&
        (
            !Number.isInteger(data.course) ||
            data.course < 1 ||
            data.course > 4
        )
    ) {

        return (
            'Поле course должно быть целым числом от 1 до 4'
        );

    }


    return null;

}


// ========================================
// MIDDLEWARE ОШИБОК
// ========================================

app.use(async (ctx, next) => {

    try {

        await next();

    }

    catch (error) {

        console.error(
            'Ошибка:',
            error.message
        );


        ctx.status =
            error.status || 500;


        ctx.body = {

            error:
                error.status
                    ? error.message
                    : 'Внутренняя ошибка сервера',

            status:
                ctx.status

        };

    }

});


// ========================================
// MIDDLEWARE ЛОГИРОВАНИЯ
// ========================================

app.use(async (ctx, next) => {

    const start = Date.now();

    await next();

    const duration =
        Date.now() - start;


    console.log(

        `[${new Date().toLocaleString('ru-RU')}] ` +

        `${ctx.method} ` +

        `${ctx.path} ` +

        `- ${duration}ms`

    );

});


app.use(bodyParser());


// ========================================
// GET /students
// ========================================

router.get('/students', (ctx) => {

    let result =
        [...students];


    // ------------------------------------
    // ФИЛЬТРАЦИЯ ПО ГРУППЕ
    // ------------------------------------

    if (ctx.query.group) {

        result =
            result.filter(

                student =>
                    student.group ===
                    ctx.query.group

            );

    }


    // ------------------------------------
    // ПОИСК ПО ИМЕНИ
    // ------------------------------------

    if (ctx.query.search) {

        const search =
            String(
                ctx.query.search
            ).toLowerCase();


        result =
            result.filter(

                student =>
                    student.name
                        .toLowerCase()
                        .includes(search)

            );

    }


    // ------------------------------------
    // СОРТИРОВКА
    // ------------------------------------

    if (ctx.query.sort) {

        const sort =
            String(ctx.query.sort);


        const descending =
            sort.startsWith('-');


        const field =
            descending
                ? sort.slice(1)
                : sort;


        if (
            field === 'name' ||
            field === 'course'
        ) {

            result.sort((a, b) => {

                let valueA =
                    a[field];


                let valueB =
                    b[field];


                if (field === 'name') {

                    valueA =
                        valueA.toLowerCase();

                    valueB =
                        valueB.toLowerCase();

                }


                if (valueA < valueB) {

                    return descending
                        ? 1
                        : -1;

                }


                if (valueA > valueB) {

                    return descending
                        ? -1
                        : 1;

                }


                return 0;

            });

        }

    }


    // ------------------------------------
    // ОБЩЕЕ КОЛИЧЕСТВО
    // ------------------------------------

    const total =
        result.length;


    // ------------------------------------
    // PAGINATION
    // ------------------------------------

    const limitValue =
        Number(
            ctx.query.limit ?? 10
        );


    const offsetValue =
        Number(
            ctx.query.offset ?? 0
        );


    const limit =
        Number.isInteger(limitValue) &&
        limitValue > 0

            ? limitValue

            : 10;


    const offset =
        Number.isInteger(offsetValue) &&
        offsetValue >= 0

            ? offsetValue

            : 0;


    result =
        result.slice(
            offset,
            offset + limit
        );


    // ------------------------------------
    // ОТВЕТ
    // ------------------------------------

    ctx.body = {

        data: result,

        total: total,

        limit: limit,

        offset: offset

    };

});


// ========================================
// GET /students/:id
// ========================================

router.get('/students/:id', (ctx) => {

    const id =
        Number(
            ctx.params.id
        );


    const student =
        students.find(

            item =>
                item.id === id

        );


    if (!student) {

        ctx.status = 404;

        ctx.body = {

            error:
                'Студент не найден',

            status: 404

        };

        return;

    }


    ctx.body = student;

});


// ========================================
// POST /students
// ========================================

router.post('/students', (ctx) => {

    const data =
        ctx.request.body || {};


    const error =
        validateStudent(data);


    if (error) {

        ctx.status = 400;

        ctx.body = {

            error: error,

            status: 400

        };

        return;

    }


    const student = {

        id:
            nextId++,

        name:
            data.name.trim(),

        group:
            data.group.trim(),

        course:
            data.course

    };


    students.push(student);


    ctx.status = 201;

    ctx.body = student;

});


// ========================================
// PUT /students/:id
// ========================================

router.put('/students/:id', (ctx) => {

    const id =
        Number(
            ctx.params.id
        );


    const student =
        students.find(

            item =>
                item.id === id

        );


    if (!student) {

        ctx.status = 404;

        ctx.body = {

            error:
                'Студент не найден',

            status: 404

        };

        return;

    }


    const data =
        ctx.request.body || {};


    const error =
        validateStudent(
            data,
            true
        );


    if (error) {

        ctx.status = 400;

        ctx.body = {

            error: error,

            status: 400

        };

        return;

    }


    if (data.name !== undefined) {

        student.name =
            data.name.trim();

    }


    if (data.group !== undefined) {

        student.group =
            data.group.trim();

    }


    if (data.course !== undefined) {

        student.course =
            data.course;

    }


    ctx.body = student;

});


// ========================================
// DELETE /students/:id
// ========================================

router.delete('/students/:id', (ctx) => {

    const id =
        Number(
            ctx.params.id
        );


    const index =
        students.findIndex(

            item =>
                item.id === id

        );


    if (index === -1) {

        ctx.status = 404;

        ctx.body = {

            error:
                'Студент не найден',

            status: 404

        };

        return;

    }


    students.splice(
        index,
        1
    );


    ctx.body = {

        message:
            'Студент удалён',

        id:
            id

    };

});


// ========================================
// ЗАПУСК
// ========================================

generateStudents();


app.use(
    router.routes()
);


app.use(
    router.allowedMethods()
);


app.listen(
    PORT,
    () => {

        console.log(
            '======================================'
        );

        console.log(
            'Лабораторная работа №16'
            '================================'
        );

        console.log(
            'Лабораторная работа №15'
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
            `Создано студентов: ${students.length}`
        );

        console.log(
            '================================'
        );

    }
);
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const VARIANT = 12;
const SOURCE = path.join('.', `source_${VARIANT}`);
const BACKUP = path.join('.', `backup_${VARIANT}`);
const REPORT = path.join('.', `sync_report_${VARIANT}.txt`);

const fileDefinitions = [
    ['file01.txt', 'Текстовый файл 01\n', 1000],
    ['file02.js', 'console.log("file02");\n', 1200],
    ['file03.json', '{"id":3,"name":"file03"}\n', 1400],
    ['file04.jpg', null, 5000],
    ['file05.png', null, 7000],
    ['file06.gif', null, 9000],
    ['file07.html', '<html><body>file07</body></html>\n', 1100],
    ['file08.css', 'body { margin: 0; }\n', 1300],
    ['file09.csv', 'id,name\n9,file09\n', 1500],
    ['file10.xml', '<file id="10">file10</file>\n', 1700],
    ['file11.log', 'Log entry file11\n', 1900],
    ['file12.dat', 'DATA12\n', 2100],
    ['file13.md', '# File 13\n', 2300],
    ['file14.ini', '[section]\nvalue=14\n', 2500],
    ['file15.cfg', 'enabled=true\n', 2700],
    ['file16.bin', null, 3000],
    ['file17.svg', '<svg></svg>\n', 3200],
    ['file18.conf', 'mode=18\n', 3400],
    ['file19.tmp', 'temporary file 19\n', 3600],
    ['file20.doc', 'Document file 20\n', 3800]
];

async function createTestFile(filePath, text, size) {
    if (text !== null) {
        const repetitions = Math.ceil(size / Buffer.byteLength(text, 'utf8'));
        let content = text.repeat(repetitions);
        content = content.slice(0, size);
        await fs.writeFile(filePath, content, 'utf8');
        return;
    }

    const buffer = Buffer.alloc(size, 65);
    await fs.writeFile(filePath, buffer);
}

async function createSourceStructure() {
    await fs.rm(SOURCE, { recursive: true, force: true });
    await fs.rm(BACKUP, { recursive: true, force: true });

    await fs.mkdir(SOURCE, { recursive: true });

    for (const [name, text, size] of fileDefinitions) {
        await createTestFile(
            path.join(SOURCE, name),
            text,
            size
        );
    }

    const subfolders = ['folder1', 'folder2', 'folder3'];

    for (const folder of subfolders) {
        const dir = path.join(SOURCE, folder);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(
            path.join(dir, `${folder}.txt`),
            `Файл из ${folder}\n`,
            'utf8'
        );

        await fs.writeFile(
            path.join(dir, `${folder}.js`),
            `console.log("${folder}");\n`,
            'utf8'
        );
    }

    const manifest = {
        variant: VARIANT,
        student: 'Минчук Станислав Игоревич',
        group: '401',
        created: new Date().toISOString(),
        files: fileDefinitions.map(([name, , size]) => ({
            name,
            size
        })),
        folders: subfolders
    };

    await fs.writeFile(
        path.join(SOURCE, 'manifest.json'),
        JSON.stringify(manifest, null, 4),
        'utf8'
    );
}

async function getAllFiles(dir) {
    const result = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            result.push(...await getAllFiles(fullPath));
        } else {
            result.push(fullPath);
        }
    }

    return result;
}

async function isDifferent(source, destination) {
    try {
        const sourceStats = await fs.stat(source);
        const destinationStats = await fs.stat(destination);

        return (
            sourceStats.size !== destinationStats.size ||
            Math.abs(sourceStats.mtimeMs - destinationStats.mtimeMs) > 1
        );
    } catch {
        return true;
    }
}

async function copyByStream(source, destination) {
    await fs.mkdir(path.dirname(destination), { recursive: true });

    return new Promise((resolve, reject) => {
        const input = fsSync.createReadStream(source);
        const output = fsSync.createWriteStream(destination);

        input.on('error', reject);
        output.on('error', reject);
        output.on('finish', resolve);

        input.pipe(output);
    });
}

async function copyByChunks(source, destination) {
    await fs.mkdir(path.dirname(destination), { recursive: true });

    const CHUNK_SIZE = 512 * 1024;

    const sourceHandle = await fs.open(source, 'r');
    const destinationHandle = await fs.open(destination, 'w');

    try {
        const buffer = Buffer.alloc(CHUNK_SIZE);
        let position = 0;

        while (true) {
            const { bytesRead } = await sourceHandle.read(
                buffer,
                0,
                CHUNK_SIZE,
                position
            );

            if (bytesRead === 0) break;

            await destinationHandle.write(
                buffer,
                0,
                bytesRead
            );

            position += bytesRead;
        }
    } finally {
        await sourceHandle.close();
        await destinationHandle.close();
    }
}

async function copyFile(source, destination) {
    const stats = await fs.stat(source);
    const extension = path.extname(source).toLowerCase();

    // >1 МБ: чанки по 512 КБ.
    if (stats.size > 1024 * 1024) {
        await copyByChunks(source, destination);
        return 'chunks';
    }

    // .txt, .js, .json: потоки.
    if (['.txt', '.js', '.json'].includes(extension)) {
        await copyByStream(source, destination);
        return 'stream';
    }

    // .jpg, .png, .gif: обычное копирование.
    if (['.jpg', '.png', '.gif'].includes(extension)) {
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.copyFile(source, destination);
        return 'normal';
    }

    // Остальные расширения: обычное копирование.
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    return 'normal';
}

async function compareDirectories() {
    const sourceFiles = await getAllFiles(SOURCE);
    const backupFiles = await getAllFiles(BACKUP);

    const sourceMap = new Map(
        sourceFiles.map(file => [
            path.relative(SOURCE, file),
            file
        ])
    );

    const backupMap = new Map(
        backupFiles.map(file => [
            path.relative(BACKUP, file),
            file
        ])
    );

    const added = [];
    const deleted = [];
    const changed = [];
    const same = [];

    for (const [relative, source] of sourceMap) {
        if (!backupMap.has(relative)) {
            added.push(relative);
            continue;
        }

        const different = await isDifferent(
            source,
            backupMap.get(relative)
        );

        if (different) {
            changed.push(relative);
        } else {
            same.push(relative);
        }
    }

    for (const relative of backupMap.keys()) {
        if (!sourceMap.has(relative)) {
            deleted.push(relative);
        }
    }

    return {
        same,
        changed,
        added,
        deleted
    };
}

async function main() {
    try {
        await createSourceStructure();

        await fs.mkdir(BACKUP, { recursive: true });

        const files = await getAllFiles(SOURCE);

        console.log(`📂 Исходная директория: source_${VARIANT}`);
        console.log(`📂 Директория назначения: backup_${VARIANT}`);
        console.log(`📋 Обнаружено файлов: ${files.length}`);

        let copied = 0;
        let skipped = 0;
        let streamed = 0;
        let normal = 0;
        let chunks = 0;
        let totalSize = 0;

        for (let i = 0; i < files.length; i++) {
            const source = files[i];
            const relative = path.relative(SOURCE, source);
            const destination = path.join(BACKUP, relative);

            // Варианты 11-15: инкрементальное копирование.
            // Если файл не изменился, повторно его не копируем.
            if (!(await isDifferent(source, destination))) {
                skipped++;
                console.log(
                    `⏭ ${i + 1}/${files.length}: без изменений — ${relative}`
                );
                continue;
            }

            const stats = await fs.stat(source);
            totalSize += stats.size;

            const method = await copyFile(
                source,
                destination
            );

            copied++;

            if (method === 'stream') streamed++;
            if (method === 'normal') normal++;
            if (method === 'chunks') chunks++;

            console.log(
                `⏳ Прогресс копирования: ${i + 1}/${files.length} файлов — ${relative}`
            );
        }

        console.log('\n✅ Копирование завершено!');
        console.log(`- Скопировано файлов: ${copied}`);
        console.log(`- Пропущено без изменений: ${skipped}`);
        console.log(`- Потоковое копирование: ${streamed}`);
        console.log(`- Обычное копирование: ${normal}`);
        console.log(`- Копирование чанками: ${chunks}`);
        console.log(`- Общий размер новых копий: ${totalSize} байт`);

        const comparison = await compareDirectories();

        console.log('\n🔄 Сравнение директорий:');
        console.log(`- Совпадают: ${comparison.same.length} файлов`);
        console.log(`- Изменены: ${comparison.changed.length} файлов`);
        console.log(`- Добавлены: ${comparison.added.length} файлов`);
        console.log(`- Удалены: ${comparison.deleted.length} файлов`);

        const report = [
            'ОТЧЁТ СИНХРОНИЗАЦИИ',
            `Студент: Минчук Станислав Игоревич`,
            `Группа: 401`,
            `Вариант: ${VARIANT}`,
            `Дата: ${new Date().toLocaleString('ru-RU')}`,
            '',
            `Совпадают: ${comparison.same.length}`,
            `Изменены: ${comparison.changed.length}`,
            `Добавлены: ${comparison.added.length}`,
            `Удалены: ${comparison.deleted.length}`,
            '',
            'Изменённые файлы:',
            ...comparison.changed.map(file => `- ${file}`),
            '',
            'Добавленные файлы:',
            ...comparison.added.map(file => `- ${file}`),
            '',
            'Удалённые файлы:',
            ...comparison.deleted.map(file => `- ${file}`)
        ].join('\n');

        await fs.writeFile(
            REPORT,
            report,
            'utf8'
        );

        console.log(`📄 Отчёт сохранён: sync_report_${VARIANT}.txt`);
    } catch (error) {
        console.error('Ошибка задания 5:', error.message);
    }
}

main();
