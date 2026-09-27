const inquirer = require('inquirer');
const fs = require('fs');

async function main() {

    const args = process.argv.slice(2);

    const noInteractive =
        args.includes('--no-interactive');

    const nameIndex =
        args.indexOf('--name');

    const typeIndex =
        args.indexOf('--type');

    const name =
        nameIndex !== -1
            ? args[nameIndex + 1]
            : null;

    const type =
        typeIndex !== -1
            ? args[typeIndex + 1]
            : null;


    // ========================================
    // НЕИНТЕРАКТИВНЫЙ РЕЖИМ
    // ========================================

    if (noInteractive) {

        if (!name || !type) {

            console.error(
                'Ошибка: в неинтерактивном режиме необходимо указать --name и --type'
            );

            process.exitCode = 1;
            return;
        }

        createProject({
            name,
            type,
            options: {
                typescript:
                    args.includes('--typescript'),

                eslint:
                    args.includes('--eslint'),

                prettier:
                    args.includes('--prettier'),

                jest:
                    args.includes('--jest'),

                git:
                    args.includes('--git')
            }
        });

        return;
    }


    // ========================================
    // ИНТЕРАКТИВНЫЙ РЕЖИМ
    // ========================================

    const answers =
        await inquirer.prompt([

            {
                type: 'input',

                name: 'name',

                message:
                    'Введите название проекта:'
            },

            {
                type: 'list',

                name: 'type',

                message:
                    'Выберите тип проекта:',

                choices: [

                    {
                        name: 'Web-приложение',

                        value: 'web'
                    },

                    {
                        name: 'CLI-утилита',

                        value: 'cli'
                    },

                    {
                        name: 'Библиотека',

                        value: 'library'
                    },

                    {
                        name: 'Микросервис',

                        value: 'microservice'
                    }

                ]

            },

            {
                type: 'checkbox',

                name: 'options',

                message:
                    'Выберите дополнительные опции:',

                choices: [

                    {
                        name: 'TypeScript',

                        value: 'TypeScript'
                    },

                    {
                        name: 'ESLint',

                        value: 'ESLint'
                    },

                    {
                        name: 'Prettier',

                        value: 'Prettier'
                    },

                    {
                        name: 'Jest',

                        value: 'Jest'
                    }

                ]

            },

            {
                type: 'confirm',

                name: 'git',

                message:
                    'Использовать Git?',

                default: true

            },

            {
                type: 'password',

                name: 'token',

                message:
                    'Введите токен доступа:',

                mask: '*'
            }

        ]);


    createProject({

        name:
            answers.name,

        type:
            answers.type,

        options:
            answers.options,

        git:
            answers.git

    });

}


// ========================================
// СОЗДАНИЕ ПРОЕКТА
// ========================================

function createProject(data) {

    const directory =
        data.name;


    if (!fs.existsSync(directory)) {

        fs.mkdirSync(
            directory,
            {
                recursive: true
            }
        );

    }


    console.log(
        `✓ Проект "${data.name}" успешно инициализирован!`
    );


    console.log(
        `Тип: ${getTypeName(data.type)}`
    );


    if (Array.isArray(data.options)) {

        console.log(
            `Опции: ${data.options.join(', ') || 'нет'}`
        );

    } else {

        const selected = [];

        if (data.options?.typescript) {
            selected.push('TypeScript');
        }

        if (data.options?.eslint) {
            selected.push('ESLint');
        }

        if (data.options?.prettier) {
            selected.push('Prettier');
        }

        if (data.options?.jest) {
            selected.push('Jest');
        }

        console.log(
            `Опции: ${selected.join(', ') || 'нет'}`
        );

    }


    console.log(
        `Git: ${data.git === false ? 'нет' : 'да'}`
    );

}


function getTypeName(type) {

    const types = {

        web:
            'Web-приложение',

        cli:
            'CLI-утилита',

        library:
            'Библиотека',

        microservice:
            'Микросервис'

    };

    return types[type] || type;
}


main().catch(error => {

    console.error(
        'Ошибка:',
        error.message
    );

    process.exitCode = 1;

});