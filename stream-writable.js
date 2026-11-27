const { Writable } = require('stream');

console.log('=== Демонстрация Writable-потока ===');

let writtenCount = 0;

const writable = new Writable({
    highWaterMark: 16,

    write(chunk, encoding, callback) {
        const text = chunk.toString();

        console.log(`[WRITE] ${text}`);

        writtenCount++;

        setTimeout(() => {
            callback();
        }, 100);
    }
});

writable.on('drain', () => {
    console.log(
        '[DRAIN] Буфер освобождён, продолжаем запись'
    );

    writeNext();
});

writable.on('finish', () => {
    console.log('[FINISH] Все данные записаны');
    console.log(`Всего записано: ${writtenCount} чанка`);
});

writable.on('error', (error) => {
    console.error(
        `[ERROR] ${error.message}`
    );
});

const data = [
    'Группа: ББМО-01-23',
    'Студент: Минчук Станислав Игоревич',
    'Лабораторная работа: №21',
    'Тема: Потоки в Node.js',
    'Дополнительные данные 1',
    'Дополнительные данные 2',
    'Дополнительные данные 3',
    'Дополнительные данные 4',
    'Дополнительные данные 5'
];

let currentIndex = 0;

function writeNext() {
    while (currentIndex < data.length) {
        const chunk = data[currentIndex];

        currentIndex++;

        const result = writable.write(chunk);

        console.log(
            `write() вернул: ${result}`
        );

        if (!result) {
            console.log(
                '← буфер переполнен, ждём drain'
            );

            return;
        }
    }

    writable.end();
}

writeNext();