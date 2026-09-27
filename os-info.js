const os = require('os');

console.log('=== Информация о системе (группа ББМО-01-23) ===');

const platform = os.platform();

console.log('Платформа:', platform);
console.log('Тип ОС:', os.type());
console.log('Архитектура:', os.arch());
console.log('Версия ОС:', os.release());
console.log('Имя хоста:', os.hostname());

const uptime = os.uptime();

const hours = Math.floor(uptime / 3600);
const minutes = Math.floor((uptime % 3600) / 60);
const seconds = Math.floor(uptime % 60);

console.log(
    `Время работы: ${hours} ч ${minutes} мин ${seconds} сек`
);

switch (platform) {
    case 'win32':
        console.log('Вы работаете в Windows');
        break;

    case 'linux':
        console.log('Вы работаете в Linux');
        break;

    case 'darwin':
        console.log('Вы работаете в macOS');
        break;

    default:
        console.log('Неизвестная платформа');
}