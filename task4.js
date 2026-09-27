const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const readline = require('readline');

const VARIANT = 12;
const TOTAL_LINES = 100000;
const INPUT = path.join('.', `data_${VARIANT}.txt`);
const OUTPUT = path.join('.', `processed_${VARIANT}.txt`);
const FILTERED = path.join('.', `filtered_${VARIANT}.txt`);

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function generateFile() {
    if (await fileExists(INPUT)) return;

    const handle = await fs.open(INPUT, 'w');

    try {
        for (let i = 1; i <= TOTAL_LINES; i++) {
            const number = Math.floor(Math.random() * 1000) + 1;
            await handle.write(`${i}, ${number}, Вариант ${VARIANT}\n`);
        }
    } finally {
        await handle.close();
    }

    console.log(`✓ Создан файл ${INPUT}`);
}

async function main() {
    try {
        await generateFile();

        const stats = await fs.stat(INPUT);

        console.log(`📊 Обработка файла: data_${VARIANT}.txt`);
        console.log(
            `Размер файла: ${(stats.size / 1024 / 1024).toFixed(2)} МБ`
        );

        const inputStream = fsSync.createReadStream(INPUT, {
            encoding: 'utf8',
            highWaterMark: 64 * 1024
        });

        const outputStream = fsSync.createWriteStream(OUTPUT, {
            encoding: 'utf8'
        });

        const filteredStream = fsSync.createWriteStream(FILTERED, {
            encoding: 'utf8'
        });

        const rl = readline.createInterface({
            input: inputStream,
            crlfDelay: Infinity
        });

        let count = 0;
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;
        let lastPercent = 0;

        for await (const line of rl) {
            if (!line.trim()) continue;

            const parts = line.split(',');
            const number = Number(parts[1]?.trim());

            if (Number.isNaN(number)) continue;

            count++;
            sum += number;
            min = Math.min(min, number);
            max = Math.max(max, number);

            // Вариант 12 относится к вариантам 11-15:
            // записываем только строки с числами > 500.
            if (number > 500) {
                filteredStream.write(line + '\n');
            }

            const percent = Math.floor((count / TOTAL_LINES) * 100);

            if (percent >= lastPercent + 10) {
                lastPercent = percent - (percent % 10);
                console.log(
                    `⏳ Прогресс: ${lastPercent}% (${count.toLocaleString()} строк обработано)`
                );
            }
        }

        const average = sum / count;

        outputStream.write(
            [
                `Вариант: ${VARIANT}`,
                'Студент: Минчук Станислав Игоревич',
                'Группа: 401',
                '',
                `Всего строк: ${count}`,
                `Сумма чисел: ${sum}`,
                `Среднее значение: ${average.toFixed(2)}`,
                `Максимальное число: ${max}`,
                `Минимальное число: ${min}`,
                `Дополнительно: строки с числами больше 500 записаны в ${path.basename(FILTERED)}`
            ].join('\n')
        );

        outputStream.end();
        filteredStream.end();

        await Promise.all([
            new Promise((resolve, reject) => {
                outputStream.once('finish', resolve);
                outputStream.once('error', reject);
            }),
            new Promise((resolve, reject) => {
                filteredStream.once('finish', resolve);
                filteredStream.once('error', reject);
            })
        ]);

        console.log('✅ Обработка завершена!');
        console.log(`- Всего строк: ${count.toLocaleString()}`);
        console.log(`- Сумма чисел: ${sum}`);
        console.log(`- Среднее значение: ${average.toFixed(2)}`);
        console.log(`- Максимальное число: ${max}`);
        console.log(`- Минимальное число: ${min}`);
        console.log(`📄 Результаты сохранены в: processed_${VARIANT}.txt`);
        console.log(`📄 Строки > 500 сохранены в: filtered_${VARIANT}.txt`);
    } catch (error) {
        console.error('Ошибка задания 4:', error.message);
    }
}

main();
