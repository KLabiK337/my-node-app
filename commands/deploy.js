const readline =
    require('readline');

const {
    deployProject
} = require('../services/projectService');


module.exports = function(options) {

    if (
        options.env ===
        'production' &&
        !options.force
    ) {

        console.warn(
            '⚠ Вы собираетесь развернуть проект в production!'
        );


        const rl =
            readline.createInterface({

                input:
                    process.stdin,

                output:
                    process.stdout

            });


        rl.question(
            'Продолжить? (y/N) ',
            answer => {

                if (
                    answer.toLowerCase()
                    !== 'y'
                ) {

                    console.log(
                        'Развёртывание отменено.'
                    );

                    rl.close();

                    return;
                }


                rl.close();


                deploy();

            }
        );


        return;

    }


    deploy();


    function deploy() {

        console.log(
            '⠋ Развёртывание...'
        );


        const result =
            deployProject(
                options.env
            );


        console.log(
            '✔ Развёрнуто успешно'
        );

        console.log(
            `URL: ${result.url}`
        );

    }

};