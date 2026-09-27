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

});