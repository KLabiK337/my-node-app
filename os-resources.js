const os = require('os');

console.log('=== Информация о процессоре ===');

const cpus = os.cpus();

console.log('Количество логических ядер:', cpus.length);

if (cpus.length > 0) {
    console.log('Модель процессора:', cpus[0].model);

    let totalSpeed = 0;

    cpus.forEach((cpu, index) => {
        console.log(`Частота ядра ${index + 1}: ${cpu.speed} МГц`);
        totalSpeed += cpu.speed;
    });

    const averageSpeed = totalSpeed / cpus.length;

    console.log(
        `Средняя частота: ${averageSpeed.toFixed(0)} МГц`
    );
}

console.log('\n=== Информация о памяти ===');

const totalMemory = os.totalmem();
const freeMemory = os.freemem();

const totalGB = totalMemory / 1024 / 1024 / 1024;
const freeGB = freeMemory / 1024 / 1024 / 1024;

const usedMemory = totalMemory - freeMemory;
const usedPercent = (usedMemory / totalMemory) * 100;
const freePercent = (freeMemory / totalMemory) * 100;

console.log(`Общий объём: ${totalGB.toFixed(2)} ГБ`);
console.log(`Свободно: ${freeGB.toFixed(2)} ГБ`);
console.log(
    `Использовано: ${usedMemory / 1024 / 1024 / 1024 .toFixed(2)} ГБ (${usedPercent.toFixed(1)}%)`
);

console.log('\n=== Средняя загрузка системы ===');

if (os.platform() === 'win32') {
    console.log('Средняя загрузка: недоступна для Windows');
} else {
    const load = os.loadavg();

    console.log(
        `1 мин: ${load[0].toFixed(2)} | ` +
        `5 мин: ${load[1].toFixed(2)} | ` +
        `15 мин: ${load[2].toFixed(2)}`
    );
}

console.log('\nГруппа: ББМО-01-23');

if (freePercent < 20) {
    console.log('⚠ ПРЕДУПРЕЖДЕНИЕ: свободной памяти меньше 20%');
} else {
    console.log('Память в норме');
}