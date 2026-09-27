const {
    buildProject
} = require('../services/projectService');

module.exports = function(options) {

    try {

        console.log(
            '⠋ Сборка проекта...'
        );


        const output =
            buildProject(
                options.config
            );


        console.log(
            '✔ Сборка завершена'
        );

        console.log(
            `Результат: ${output}`
        );

    }

    catch (error) {

        console.error(
            `✖ Ошибка: ${error.message}`
        );

        console.error(
            'Укажите путь через --config'
        );

        process.exitCode = 1;

    }

};