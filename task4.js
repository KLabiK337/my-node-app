const fs = require('fs');
const path = require('path');

async function main() {

    const args =
        process.argv.slice(2);


    const filesIndex =
        args.indexOf('--files');


    if (filesIndex === -1) {

        console.error(
            'Ошибка: укажите файлы через --files'
        );

        process.exitCode = 1;

        return;
    }


    const files =
        args.slice(
            filesIndex + 1
        );


    if (files.length === 0) {

        console.error(
            'Ошибка: список файлов пуст'
        );

        process.exitCode = 1;

        return;
    }


    let chalk;

    let ora;

    let cliProgress;


    try {

        chalk =
            (await import('chalk')).default;

        ora =
            (await import('ora')).default;

        cliProgress =
            (await import('cli-progress')).default;

    }

    catch (error) {

        console.error(
            'Ошибка загрузки библиотек:',
            error.message
        );

        process.exitCode = 1;

        return;
    }


    const found = [];

    const missing = [];


    // ========================================
    // ПРОВЕРКА ФАЙЛОВ
    // ========================================

    for (const file of files) {

        if (
            fs.existsSync(file)
        ) {

            found.push(file);

        } else {

            missing.push(file);

        }

    }


    // ========================================
    // СПИННЕР
    // ========================================

    const spinner =
        ora(
            'Обработка файлов...'
        ).start();


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                1000
            )
    );


    spinner.stop();


    if (found.length > 0) {

        console.log(
            chalk.green(
                `✔ Файлы найдены (${found.length} шт.)`
            )
        );

    }


    // ========================================
    // ПРОГРЕСС-БАР
    // ========================================

    const bar =
        new cliProgress.SingleBar({

            format:
                '[{bar}] {percentage}% | {value}/{total} | ETA: {eta_formatted}',

            hideCursor: true

        });


    bar.start(
        found.length,
        0
    );


    const results = [];


    for (
        let i = 0;
        i < found.length;
        i++
    ) {

        const file =
            found[i];


        const stat =
            fs.statSync(file);


        results.push({

            file:
                path.resolve(file),

            size:
                stat.size

        });


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    300
                )
        );


        bar.update(
            i + 1
        );

    }


    bar.stop();


    if (missing.length > 0) {

        for (
            const file of missing
        ) {

            console.error(
                chalk.red(
                    `✖ Файл ${file} не найден`
                )
            );

        }


        console.error(
            chalk.yellow(
                `⚠ Пропущено ${missing.length} файл(ов)`
            )
        );

    }


    const output =
        'output.json';


    process.stdout.write(
        JSON.stringify(
            results,
            null,
            2
        )
    );


    fs.writeFileSync(

        output,

        JSON.stringify(
            results,
            null,
            2
        ),

        'utf8'

    );


    console.error(
        chalk.blue(
            `Результат сохранён: ${output}`
        )
    );


    if (missing.length > 0) {

        process.exitCode = 1;

    } else {

        process.exitCode = 0;

    }

}


main().catch(error => {

    console.error(
        'Ошибка:',
        error.message
    );

    process.exitCode = 1;
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const PORT = 3000;


let students = [

    {
        id: 1,
        name: 'Анна Иванова',
        group: 'ББМО-01-23',
        course: 2
    },

    {
        id: 2,
        name: 'Алексей Петров',
        group: 'ББМО-01-23',
        course: 3
    },

    {
        id: 3,
        name: 'Мария Сидорова',
        group: 'ББМО-02-23',
        course: 1
    },

    {
        id: 4,
        name: 'Иван Кузнецов',
        group: 'ББМО-02-23',
        course: 4
    }

];


let nextId = 5;


// ========================================
// ВАЛИДАЦИЯ
// ========================================

function validateStudent(data, partial = false) {

    if (
        !partial &&
        (
            !data.name ||
            !data.group ||
            data.course === undefined
        )
    ) {

        return 'Поля name, group и course обязательны';

    }


    if (
        data.name !== undefined &&
        (
            typeof data.name !== 'string' ||
            !data.name.trim()
        )
    ) {

        return 'Поле name должно быть непустой строкой';

    }


    if (
        data.group !== undefined &&
        (
            typeof data.group !== 'string' ||
            !data.group.trim()
        )
    ) {

        return 'Поле group должно быть непустой строкой';

    }


    if (
        data.course !== undefined &&
        (
            !Number.isInteger(data.course) ||
            data.course < 1 ||
            data.course > 4
        )
    ) {

        return 'Поле course должно быть целым числом от 1 до 4';

    }


    return null;
}


// ========================================
// GET /students
// ========================================

router.get('/students', (ctx) => {

    let result = [...students];


    if (ctx.query.group) {

        result =
            result.filter(
                student =>
                    student.group === ctx.query.group
            );

    }


    ctx.body = result;

});


// ========================================
// GET /students/:id
// ========================================

router.get('/students/:id', (ctx) => {

    const id =
        Number(ctx.params.id);


    const student =
        students.find(
            item => item.id === id
        );


    if (!student) {

        ctx.status = 404;

        ctx.body = {
            error: 'Студент не найден',
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

        id: nextId++,

        name: data.name.trim(),

        group: data.group.trim(),

        course: data.course

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
        Number(ctx.params.id);


    const student =
        students.find(
            item => item.id === id
        );


    if (!student) {

        ctx.status = 404;

        ctx.body = {
            error: 'Студент не найден',
            status: 404
        };

        return;
    }


    const data =
        ctx.request.body || {};


    const error =
        validateStudent(data, true);


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
        Number(ctx.params.id);


    const index =
        students.findIndex(
            item => item.id === id
        );


    if (index === -1) {

        ctx.status = 404;

        ctx.body = {
            error: 'Студент не найден',
            status: 404
        };

        return;
    }


    students.splice(index, 1);


    ctx.body = {

        message: 'Студент удалён',

        id: id

    };

});


app.use(bodyParser());

app.use(router.routes());

app.use(router.allowedMethods());


app.listen(PORT, () => {

    console.log(
        'Лабораторная работа №15 — Задание 4'
    );

    console.log(
        `API студентов запущен на http://localhost:${PORT}`
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
