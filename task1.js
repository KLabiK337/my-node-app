const fs = require('fs').promises;
const path = require('path');

const VARIANT = 12;
const STUDENT = 'Минчук Станислав Игоревич';
const GROUP = '401';

async function main() {
    const fileName = `student_${VARIANT}.txt`;
    const filePath = path.join('.', fileName);

    try {
        const now = new Date();
        const date = now.toLocaleString('ru-RU');

        const books = [
            '1. «Война и мир» — Л. Толстой',
            '2. «Преступление и наказание» — Ф. Достоевский',
            '3. «Мастер и Маргарита» — М. Булгаков',
            '4. «1984» — Дж. Оруэлл',
            '5. «Гарри Поттер» — Дж. Роулинг'
        ];

        const lines = [
            `Студент: ${STUDENT}`,
            `Группа: ${GROUP}`,
            `Вариант: ${VARIANT}`,
            `Дата: ${date}`,
            'Любимые книги:',
            ...books
        ];

        await fs.writeFile(
            filePath,
            lines.join('\n'),
            'utf8'
        );

        const contentBeforeCount = await fs.readFile(
            filePath,
            'utf8'
        );

        const lineCount = contentBeforeCount.split(/\r?\n/).length;

        await fs.appendFile(
            filePath,
            `\nКоличество записей: ${lineCount}`,
            'utf8'
        );

        const finalContent = await fs.readFile(
            filePath,
            'utf8'
        );

        console.log(`Создан файл: ${fileName}`);
        console.log('Содержимое файла:');
        console.log('─────────────────────────────────');
        console.log(finalContent);
        console.log('─────────────────────────────────');
    } catch (error) {
        console.error('Ошибка задания 1:', error.message);
    }
}

main();
