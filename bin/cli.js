#!/usr/bin/env node

const { Command } = require('commander');

const initCommand =
    require('../commands/init');

const buildCommand =
    require('../commands/build');

const testCommand =
    require('../commands/test');

const deployCommand =
    require('../commands/deploy');


const program =
    new Command();


program
    .name('my-cli')
    .description(
        'CLI-приложение лабораторной работы №17'
    )
    .version('1.0.0');


program
    .command('init')
    .description('инициализация проекта')
    .requiredOption(
        '--name <name>',
        'название проекта'
    )
    .requiredOption(
        '--type <type>',
        'тип проекта'
    )
    .action(initCommand);


program
    .command('build')
    .description('сборка проекта')
    .option(
        '--config <path>',
        'путь к конфигурации',
        'config.json'
    )
    .action(buildCommand);


program
    .command('test')
    .description('запуск тестов')
    .action(testCommand);


program
    .command('deploy')
    .description('развёртывание проекта')
    .requiredOption(
        '--env <environment>',
        'окружение'
    )
    .option(
        '--force',
        'подтвердить развёртывание'
    )
    .action(deployCommand);


process.on(
    'uncaughtException',
    error => {

        console.error(
            `Ошибка: ${error.message}`
        );

        if (
            process.env.NODE_ENV ===
            'development'
        ) {

            console.error(
                error.stack
            );

        }

        process.exitCode = 1;

    }
);


process.on(
    'unhandledRejection',
    error => {

        console.error(
            `Ошибка: ${error.message}`
        );

        if (
            process.env.NODE_ENV ===
            'development'
        ) {

            console.error(
                error.stack
            );

        }

        process.exitCode = 1;

    }
);


program.parseAsync(
    process.argv
);