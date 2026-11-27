const { Readable } = require('stream');

console.log('=== Демонстрация Readable-потока ===');

const chunks = [
    'Группа: ББМО-01-23',
    'Студент: Минчук Станислав Игоревич',
    'Лабораторная работа: №21',
    'Тема: Потоки в Node.js'
];

let index = 0;
let chunkCount = 0;
let totalBytes = 0;

const readable = new Readable({
    read() {
        if (index < chunks.length) {
            const data = chunks[index];

            index++;

            this.push(data);
        } else {
            this.push(null);
        }
    }
});

readable.on('data', (chunk) => {
    chunkCount++;
    totalBytes += chunk.length;

    console.log(
        `[CHUNK ${chunkCount}] ${chunk.toString()}`
    );
});

readable.on('end', () => {
    console.log('[END] Поток завершён');
    console.log(`Всего получено чанков: ${chunkCount}`);
    console.log(`Общий размер данных: ${totalBytes} байт`);
});

readable.on('error', (error) => {
    console.error(
        `[ERROR] ${error.message}`
    );
});