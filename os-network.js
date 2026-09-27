const os = require('os');

console.log('=== Сетевые интерфейсы ===');

const interfaces = os.networkInterfaces();

let totalInterfaces = 0;
let mainInterface = null;

function maskMac(mac) {
    const parts = mac.split(':');

    if (parts.length === 6) {
        return `${parts[0]}:${parts[1]}:${parts[2]}:**:**:**`;
    }

    return mac;
}

for (const [name, addresses] of Object.entries(interfaces)) {
    console.log(`\nИнтерфейс: ${name}`);

    totalInterfaces++;

    for (const address of addresses) {
        console.log(`IPv${address.family === 'IPv4' ? '4' : '6'}: ${address.address}`);
        console.log(`MAC: ${maskMac(address.mac)}`);

        const internalText = address.internal ? 'да' : 'нет';
        console.log(`Внутренний: ${internalText}`);

        if (
            address.family === 'IPv4' &&
            !address.internal &&
            !mainInterface
        ) {
            mainInterface = {
                name,
                address: address.address
            };
        }
    }
}

console.log(`\nВсего интерфейсов: ${totalInterfaces}`);

if (mainInterface) {
    console.log(
        `Основной интерфейс: ${mainInterface.name} (${mainInterface.address})`
    );
} else {
    console.log('Основной интерфейс: не найден');
}

console.log('\n=== Информация о пользователе ===');

const userInfo = os.userInfo();

console.log('Имя пользователя:', userInfo.username);

if (process.platform === 'win32') {
    console.log('UID: недоступен в Windows');
    console.log('GID: недоступен в Windows');
} else {
    console.log('UID:', userInfo.uid);
    console.log('GID:', userInfo.gid);
}

console.log('Домашняя директория:', userInfo.homedir);

if (process.platform === 'win32') {
    console.log('Оболочка по умолчанию: недоступна в Windows');
} else {
    console.log('Оболочка по умолчанию:', userInfo.shell);
}

console.log('Группа: ББМО-01-23');

if (process.platform === 'win32') {
    console.log('Проверка root: не применимо для Windows');
} else {
    console.log(
        'Проверка root:',
        userInfo.uid === 0 ? 'да' : 'нет'
    );
}