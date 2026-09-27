const args = process.argv.slice(2);

function showHelp() {
    console.log('');
    console.log('Использование: my-cli <команда> [аргументы]');
    console.log('');
    console.log('Доступные команды:');
    console.log('  greet <имя> - поприветствовать пользователя');
    console.log('  info        - вывести информацию о группе');
    console.log('');
}

function main() {

    if (args.length === 0) {
        showHelp();
        process.exitCode = 0;
        return;
    }

    const command = args[0];

    if (command === 'greet') {

        const name = args[1];

        if (!name) {
            console.error('Ошибка: необходимо указать имя.');
            process.exitCode = 1;
            return;
        }

        console.log(
            `Привет, ${name}! Добро пожаловать в CLI-приложение группы ББМО-01-23.`
        );

        process.exitCode = 0;
        return;
    }

    if (command === 'info') {

        console.log('Группа: ББМО-01-23');
        console.log('Студент: Минчук Станислав Игоревич');
        console.log('Лабораторная работа: №17');
        console.log(`Дата: ${new Date().toLocaleDateString('ru-RU')}`);

        process.exitCode = 0;
        return;
    }

    if (command === '--help' || command === '-h') {
        showHelp();
        process.exitCode = 0;
        return;
    }

    console.error(
        `Ошибка: неизвестная команда "${command}"`
    );

    console.error(
        'Для справки используйте: my-cli --help'
    );

    process.exitCode = 1;
}

main();