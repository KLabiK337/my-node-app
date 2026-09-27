const { Command } = require('commander');
const fs = require('fs');

const program = new Command();

program
    .name('my-cli')
    .description('CLI-приложение для лабораторной работы №17')
    .version('1.0.0')
    .option('-v, --verbose', 'подробный вывод');


// ========================================
// GENERATE
// ========================================

program
    .command('generate')
    .description('сгенерировать отчёт')
    .option('-t, --type <type>', 'тип отчёта', 'html')
    .option('-o, --output <path>', 'путь для сохранения')
    .option('-f, --force', 'перезаписать существующий файл')
    .option('--dry-run', 'показать что будет сделано без выполнения')
    .action((options) => {

        const allowedTypes = [
            'html',
            'pdf',
            'json',
            'csv'
        ];

        if (!allowedTypes.includes(options.type)) {

            console.error(
                `Ошибка: недопустимый тип отчёта "${options.type}".`
            );

            console.error(
                'Допустимые значения: html, pdf, json, csv'
            );

            process.exitCode = 1;
            return;
        }

        const output =
            options.output ||
            `./output.${options.type}`;

        const verbose =
            program.opts().verbose;

        if (options.dryRun) {

            console.log(
                `[DRY-RUN] Будет сгенерирован отчёт типа: ${options.type}`
            );

            console.log(
                `[DRY-RUN] Файл будет сохранён в: ${output}`
            );

            console.log(
                '[DRY-RUN] Действия не выполнены (режим проверки)'
            );

            return;
        }

        if (verbose) {

            console.log(
                '[VERBOSE] Запуск генерации отчёта...'
            );

            console.log(
                `[VERBOSE] Тип отчёта: ${options.type}`
            );

            console.log(
                `[VERBOSE] Путь сохранения: ${output}`
            );
        }

        if (
            fs.existsSync(output) &&
            !options.force
        ) {

            console.error(
                `Ошибка: файл ${output} уже существует. Используйте --force.`
            );

            process.exitCode = 1;
            return;
        }

        let content;

        if (options.type === 'json') {

            content = JSON.stringify({

                laboratory: 17,

                group: 'ББМО-01-23',

                student:
                    'Минчук Станислав Игоревич',

                generatedAt:
                    new Date().toISOString()

            }, null, 2);

        } else if (options.type === 'csv') {

            content =
                'laboratory,group,student\n' +
                '17,ББМО-01-23,Минчук Станислав Игоревич\n';

        } else {

            content =
                `Лабораторная работа №17\n` +
                `Группа: ББМО-01-23\n` +
                `Студент: Минчук Станислав Игоревич\n`;

        }

        fs.writeFileSync(
            output,
            content,
            'utf8'
        );

        console.log(
            `Отчёт успешно сгенерирован: ${output}`
        );
    });


// ========================================
// CONVERT
// ========================================

program
    .command('convert')
    .description('конвертировать файл')
    .option('-i, --input <path>', 'входной файл')
    .option('-o, --output <path>', 'выходной файл')
    .action((options) => {

        if (!options.input) {

            console.error(
                'Ошибка: необходимо указать --input'
            );

            process.exitCode = 1;
            return;
        }

        if (!fs.existsSync(options.input)) {

            console.error(
                `Ошибка: файл ${options.input} не найден`
            );

            process.exitCode = 1;
            return;
        }

        const data =
            fs.readFileSync(
                options.input,
                'utf8'
            );

        const output =
            options.output ||
            `${options.input}.converted`;

        fs.writeFileSync(
            output,
            data,
            'utf8'
        );

        console.log(
            `Файл конвертирован: ${output}`
        );
    });


program.parse(process.argv);