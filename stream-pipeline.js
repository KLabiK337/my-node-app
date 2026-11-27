const fs = require('fs');
const {
    Readable,
    Transform,
    Writable,
    pipeline
} = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

const GROUP = 'ББМО-01-23';
const TOTAL = 10000;

const stats = {
    generated: 0,
    validated: 0,
    enriched: 0,
    filtered: 0,
    written: 0,
    errors: 0
};

let backpressureCount = 0;


// ==================================================
// READABLE — генератор студентов
// ==================================================

class StudentGenerator extends Readable {

    constructor() {
        super({
            objectMode: true,
            highWaterMark: 100
        });

        this.current = 1;
    }

    _read() {

        let generated = 0;

        while (
            generated < 100 &&
            this.current <= TOTAL
        ) {

            const id = this.current;

            const student = {
                id,
                name: `Студент ${id}`,
                group: GROUP,
                course: (id % 4) + 1,
                grade: Number(
                    (2 + Math.random() * 3)
                        .toFixed(1)
                )
            };

            this.current++;

            stats.generated++;

            generated++;

            if (
                !this.push(student)
            ) {
                break;
            }
        }

        if (this.current > TOTAL) {
            this.push(null);
        }
    }
}


// ==================================================
// VALIDATE
// ==================================================

class ValidateTransform extends Transform {

    constructor() {
        super({
            objectMode: true,
            highWaterMark: 50
        });
    }

    _transform(student, encoding, callback) {

        const valid =
            student &&
            Number.isInteger(student.id) &&
            typeof student.name === 'string' &&
            student.group === GROUP &&
            student.course >= 1 &&
            student.course <= 4 &&
            student.grade >= 2 &&
            student.grade <= 5;

        if (!valid) {

            stats.errors++;

            const message =
                `[${new Date().toISOString()}] ` +
                `[${GROUP}] ` +
                `Ошибка валидации: id=${student?.id}`;

            fs.appendFileSync(
                'errors.log',
                message + '\n'
            );

            callback();

            return;
        }

        stats.validated++;

        callback(null, student);
    }
}


// ==================================================
// ENRICH
// ==================================================

class EnrichTransform extends Transform {

    constructor() {
        super({
            objectMode: true,
            highWaterMark: 50
        });
    }

    _transform(student, encoding, callback) {

        const averageGrade =
            Number(
                (
                    student.grade * 0.8 +
                    4.2 * 0.2
                ).toFixed(2)
            );

        const enriched = {
            ...student,
            averageGrade
        };

        stats.enriched++;

        callback(null, enriched);
    }
}


// ==================================================
// FILTER
// ==================================================

class FilterTransform extends Transform {

    constructor() {
        super({
            objectMode: true,
            highWaterMark: 50
        });
    }

    _transform(student, encoding, callback) {

        if (student.grade > 3) {

            stats.filtered++;

            callback(null, student);

        } else {

            callback();
        }
    }
}


// ==================================================
// FORMAT CSV
// ==================================================

class FormatTransform extends Transform {

    constructor() {
        super({
            writableObjectMode: true,
            readableObjectMode: false,
            highWaterMark: 16
        });
    }

    _transform(student, encoding, callback) {

        const line =
            `${student.id},` +
            `${student.name},` +
            `${student.group},` +
            `${student.course},` +
            `${student.grade},` +
            `${student.averageGrade}\n`;

        callback(null, line);
    }
}


// ==================================================
// WRITE CSV
// ==================================================

class StudentWriter extends Writable {

    constructor() {
        super({
            decodeStrings: true,
            highWaterMark: 1024
        });

        this.stream =
            fs.createWriteStream(
                'students.csv'
            );

        this.stream.on('error', error => {
            this.destroy(error);
        });
    }

    _write(chunk, encoding, callback) {

        if (
            !this.stream.write(chunk)
        ) {

            backpressureCount++;

            console.log(
                `[BACKPRESSURE] ` +
                `Writable переполнен ` +
                `(${backpressureCount}-й раз)`
            );

            this.stream.once(
                'drain',
                () => {
                    console.log(
                        '[DRAIN] Продолжаем запись'
                    );

                    callback();
                }
            );

        } else {

            callback();
        }
    }

    _final(callback) {

        this.stream.end();

        this.stream.once(
            'finish',
            callback
        );
    }
}


// ==================================================
// ПРОГРЕСС
// ==================================================

function showProgress() {

    const percent =
        Math.floor(
            (stats.generated / TOTAL) * 100
        );

    const barSize = 30;

    const filled =
        Math.floor(
            percent / 100 * barSize
        );

    const bar =
        '█'.repeat(filled) +
        '░'.repeat(
            barSize - filled
        );

    const elapsed =
        (Date.now() - startTime) / 1000;

    const speed =
        elapsed > 0
            ? Math.floor(
                stats.generated / elapsed
            )
            : 0;

    process.stdout.write(
        `\r[PROGRESS] ${bar} ` +
        `${percent}% | ` +
        `${stats.generated}/${TOTAL} | ` +
        `${speed} записей/сек`
    );
}


// ==================================================
// ЗАПУСК PIPELINE
// ==================================================

const startTime = Date.now();

async function runPipeline() {

    console.log(
        '=== Конвейер обработки данных ' +
        `(группа ${GROUP}) ===`
    );

    console.log(
        `Источник: ${TOTAL} студентов`
    );

    console.log(
        'Фильтр: оценка > 3'
    );

    fs.writeFileSync(
        'errors.log',
        ''
    );

    fs.writeFileSync(
        'students.csv',
        'id,name,group,course,grade,averageGrade\n'
    );

    const generator =
        new StudentGenerator();

    const validate =
        new ValidateTransform();

    const enrich =
        new EnrichTransform();

    const filter =
        new FilterTransform();

    const format =
        new FormatTransform();

    const writer =
        new StudentWriter();

    // Прогресс
    const progressTimer =
        setInterval(
            showProgress,
            500
        );

    try {

        await pipelineAsync(
            generator,
            validate,
            enrich,
            filter,
            format,
            writer
        );

        clearInterval(progressTimer);

        showProgress();

        console.log('\n');

        const elapsed =
            (
                Date.now() - startTime
            ) / 1000;

        const speed =
            Math.floor(
                stats.generated / elapsed
            );

        console.log(
            '=== Результаты ==='
        );

        console.log(
            `Всего сгенерировано: ${stats.generated}`
        );

        console.log(
            `Прошло валидацию: ${stats.validated}`
        );

        console.log(
            `Обогащено: ${stats.enriched}`
        );

        console.log(
            `Отфильтровано: ${stats.filtered}`
        );

        console.log(
            `Записано в CSV: ${stats.filtered}`
        );

        console.log(
            `Ошибок: ${stats.errors}`
        );

        console.log(
            `Время выполнения: ${elapsed.toFixed(2)} сек`
        );

        console.log(
            `Средняя скорость: ${speed} записей/сек`
        );

        const fileSize =
            fs.statSync(
                'students.csv'
            ).size;

        console.log(
            `Файл: students.csv ` +
            `(${(fileSize / 1024 / 1024).toFixed(2)} МБ)`
        );

        console.log(
            '\n=== Демонстрация backpressure ==='
        );

        console.log(
            `Количество срабатываний: ${backpressureCount}`
        );

        console.log(
            '\n=== Сравнение с async iterator ==='
        );

        await runAsyncIterator();

    } catch (error) {

        clearInterval(progressTimer);

        stats.errors++;

        fs.appendFileSync(
            'errors.log',
            `[${new Date().toISOString()}] ` +
            `[${GROUP}] ` +
            `Ошибка pipeline: ${error.message}\n`
        );

        console.error(
            `\n✖ Ошибка pipeline: ${error.message}`
        );
    }
}


// ==================================================
// ASYNC ITERATOR
// ==================================================

async function runAsyncIterator() {

    const start =
        Date.now();

    let count = 0;

    const readable =
        Readable.from(
            generateAsyncStudents()
        );

    for await (
        const student of readable
    ) {

        if (
            student.grade > 3
        ) {
            count++;
        }
    }

    const elapsed =
        (Date.now() - start) / 1000;

    const speed =
        elapsed > 0
            ? Math.floor(
                TOTAL / elapsed
            )
            : 0;

    console.log(
        `[ASYNC] Обработано: ${count} ` +
        `записей за ${elapsed.toFixed(2)} сек`
    );

    console.log(
        `Скорость: ${speed} записей/сек`
    );

    showFiles();
}


// ==================================================
// ASYNC GENERATOR
// ==================================================

async function* generateAsyncStudents() {

    for (let i = 1; i <= TOTAL; i++) {

        yield {
            id: i,
            name: `Студент ${i}`,
            group: GROUP,
            course: (i % 4) + 1,
            grade: Number(
                (
                    2 + Math.random() * 3
                ).toFixed(1)
            )
        };
    }
}


// ==================================================
// ФАЙЛЫ
// ==================================================

function showFiles() {

    console.log(
        '\n=== Содержимое students.csv ==='
    );

    const lines =
        fs.readFileSync(
            'students.csv',
            'utf8'
        )
        .split('\n')
        .slice(0, 6);

    console.log(
        lines.join('\n')
    );

    console.log(
        '\n=== Содержимое errors.log ==='
    );

    if (
        fs.existsSync('errors.log')
    ) {

        const errors =
            fs.readFileSync(
                'errors.log',
                'utf8'
            );

        if (errors.trim()) {
            console.log(errors);
        } else {
            console.log(
                'Ошибок нет'
            );
        }
    }

    demonstrateTimeout();
}


// ==================================================
// TIMEOUT
// ==================================================

function demonstrateTimeout() {

    console.log(
        '\n=== Отмена по таймауту ==='
    );

    console.log(
        'Запуск с таймаутом 1 сек...'
    );

    const controller =
        new AbortController();

    const timeout =
        setTimeout(() => {

            controller.abort();

        }, 1000);

    const slowReadable =
        new Readable({
            objectMode: true,

            read() {

                setTimeout(() => {

                    if (
                        !this.destroyed
                    ) {
                        this.push({
                            id: Date.now()
                        });
                    }

                }, 100);
            }
        });

    const slowTransform =
        new Transform({
            objectMode: true,

            transform(
                object,
                encoding,
                callback
            ) {

                setTimeout(() => {
                    callback(null, object);
                }, 200);
            }
        });

    const slowWritable =
        new Writable({
            objectMode: true,

            write(
                object,
                encoding,
                callback
            ) {

                setTimeout(
                    callback,
                    100
                );
            }
        });

    pipeline(
        slowReadable,
        slowTransform,
        slowWritable,
        {
            signal: controller.signal
        },
        (error) => {

            clearTimeout(timeout);

            if (error) {

                console.log(
                    '✖ Таймаут! Обработка отменена'
                );

                console.log(
                    '✔ Все потоки корректно закрыты'
                );

                console.log(
                    '✔ Ресурсы освобождены'
                );

            } else {

                console.log(
                    '✔ Обработка завершена'
                );
            }
        }
    );
}

runPipeline();