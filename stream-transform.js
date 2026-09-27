const {
    Readable,
    Transform,
    Writable
} = require('stream');

console.log('=== Демонстрация Transform-потока ===');


// --------------------------------------------------
// UpperCaseTransform
// --------------------------------------------------

class UpperCaseTransform extends Transform {
    constructor() {
        super();
    }

    _transform(chunk, encoding, callback) {
        const text = chunk
            .toString()
            .toUpperCase();

        const result =
            `[BBMO-01-23] ${text}`;

        callback(null, result);
    }
}

const upper = new UpperCaseTransform();

upper.on('data', (chunk) => {
    console.log(
        `Выход: "${chunk.toString()}"`
    );
});

upper.write('группа ббмо-01-23');
upper.write('студент минчук');
upper.end();


// --------------------------------------------------
// JSON PARSER + FILTER
// --------------------------------------------------

class JsonParserTransform extends Transform {
    constructor() {
        super({
            readableObjectMode: true,
            writableObjectMode: false
        });

        this.buffer = '';
    }

    _transform(chunk, encoding, callback) {
        this.buffer += chunk.toString();

        const lines = this.buffer.split('\n');

        this.buffer = lines.pop();

        for (const line of lines) {
            if (!line.trim()) {
                continue;
            }

            try {
                const object = JSON.parse(line);

                this.push(object);
            } catch (error) {
                console.log(
                    `[JSON ERROR] ${error.message}`
                );
            }
        }

        callback();
    }

    _flush(callback) {
        if (this.buffer.trim()) {
            try {
                this.push(
                    JSON.parse(this.buffer)
                );
            } catch (error) {
                console.log(
                    `[JSON ERROR] ${error.message}`
                );
            }
        }

        callback();
    }
}

class FilterTransform extends Transform {
    constructor(group) {
        super({
            writableObjectMode: true,
            readableObjectMode: true
        });

        this.group = group;
    }

    _transform(object, encoding, callback) {
        if (object.group === this.group) {
            this.push(object);
        }

        callback();
    }
}

console.log('\n=== Демонстрация Object Mode ===');

const students = [
    {
        id: 1,
        name: 'Иван',
        group: 'ББМО-01-23'
    },
    {
        id: 2,
        name: 'Мария',
        group: 'ББМО-02-23'
    },
    {
        id: 3,
        name: 'Петр',
        group: 'ББМО-01-23'
    }
];

const jsonData =
    students
        .map(student => JSON.stringify(student))
        .join('\n');

const jsonReadable =
    Readable.from([jsonData]);

const parser =
    new JsonParserTransform();

const filter =
    new FilterTransform('ББМО-01-23');

const objectWritable =
    new Writable({
        objectMode: true,

        write(object, encoding, callback) {
            console.log(
                '[OBJECT]',
                object
            );

            callback();
        }
    });

jsonReadable
    .pipe(parser)
    .pipe(filter)
    .pipe(objectWritable);

objectWritable.on('finish', () => {

    console.log(
        'После фильтрации:'
    );

    demonstrateAsyncIterator();
});


// --------------------------------------------------
// ASYNC ITERATOR
// --------------------------------------------------

async function demonstrateAsyncIterator() {

    console.log(
        '\n=== Демонстрация async iterator ==='
    );

    const readable = Readable.from([
        'Данные 1',
        'Данные 2',
        'Данные 3'
    ]);

    let count = 0;

    for await (const chunk of readable) {
        count++;

        console.log(
            `[ASYNC] Получен чанк ${count}: "${chunk}"`
        );
    }

    console.log(
        '[ASYNC] Поток завершён'
    );

    demonstrateObjectMode();
}


// --------------------------------------------------
// OBJECT MODE С ЦЕПОЧКОЙ
// --------------------------------------------------

function demonstrateObjectMode() {

    console.log(
        '\n=== Цепочка Transform ==='
    );

    console.log(
        'Читаем → UpperCase → Filter → Записываем'
    );

    const objectReadable =
        Readable.from(students);

    const objectUpper =
        new Transform({
            objectMode: true,

            transform(object, encoding, callback) {

                const result = {
                    ...object,
                    name: object.name.toUpperCase()
                };

                callback(null, result);
            }
        });

    const objectFilter =
        new Transform({
            objectMode: true,

            transform(object, encoding, callback) {

                if (
                    object.group === 'ББМО-01-23'
                ) {
                    callback(null, object);
                } else {
                    callback();
                }
            }
        });

    let processed = 0;

    const objectOutput =
        new Writable({
            objectMode: true,

            write(object, encoding, callback) {
                processed++;

                console.log(
                    '[RESULT]',
                    object
                );

                callback();
            }
        });

    objectOutput.on('finish', () => {
        console.log(
            `✔ Обработано объектов: ${processed}`
        );
    });

    objectReadable
        .pipe(objectUpper)
        .pipe(objectFilter)
        .pipe(objectOutput);
}