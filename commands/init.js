const {
    initProject
} = require('../services/projectService');

module.exports = function(options) {

    const projectPath =
        initProject(
            options.name,
            options.type
        );


    console.log(
        `✔ Проект "${options.name}" создан`
    );

    console.log(
        '✔ Установлены зависимости'
    );

    console.log(
        '✔ Инициализирован Git-репозиторий'
    );

    console.log(
        'Проект готов к работе!'
    );

    console.log(
        `Путь: ${projectPath}`
    );

};