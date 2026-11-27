const fs = require('fs');
const path = require('path');

function initProject(name, type) {

    const projectPath =
        path.resolve(name);

    if (!fs.existsSync(projectPath)) {

        fs.mkdirSync(
            projectPath,
            {
                recursive: true
            }
        );

    }

    return projectPath;
}


function buildProject(configPath) {

    if (!fs.existsSync(configPath)) {

        throw new Error(
            'файл config.json не найден'
        );

    }

    const config =
        JSON.parse(
            fs.readFileSync(
                configPath,
                'utf8'
            )
        );

    const dist =
        path.resolve('dist');

    fs.mkdirSync(
        dist,
        {
            recursive: true
        }
    );

    const output =
        path.join(
            dist,
            'my-app.js'
        );

    fs.writeFileSync(
        output,
        '// Сборка проекта\n',
        'utf8'
    );

    return output;
}


function deployProject(environment) {

    return {
        environment,
        url:
            `https://my-app.example.com`
    };

}


module.exports = {

    initProject,

    buildProject,

    deployProject

};