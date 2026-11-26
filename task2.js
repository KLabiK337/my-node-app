const fs = require('fs').promises;
const path = require('path');

const VARIANT = 12;
const ROOT = path.join('.', `project_${VARIANT}`);

const descriptions = {
    src: 'Каталог исходного кода проекта.',
    modules: 'Каталог модулей программы.',
    components: 'Каталог компонентов приложения.',
    utils: 'Каталог вспомогательных функций.',
    data: 'Каталог данных проекта.',
    input: 'Каталог входных данных.',
    output: 'Каталог результатов работы программы.',
    temp: 'Каталог временных файлов.'
};

async function createFolderFiles(dir) {
    const name = path.basename(dir);

    await fs.writeFile(
        path.join(dir, 'info.txt'),
        `Назначение папки: ${descriptions[name] || 'Рабочая папка проекта.'}\n`,
        'utf8'
    );

    // Вариант 12 чётный: README.md создаётся в каждой папке.
    await fs.writeFile(
        path.join(dir, 'README.md'),
        `# ${name}\n\nДата создания: ${new Date().toLocaleString('ru-RU')}\n`,
        'utf8'
    );
}

async function printTree(dir, prefix = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const last = i === entries.length - 1;
        const branch = last ? '└── ' : '├── ';
        console.log(prefix + branch + entry.name);

        if (entry.isDirectory()) {
            await printTree(
                path.join(dir, entry.name),
                prefix + (last ? '    ' : '│   ')
            );
        }
    }
}

async function main() {
    try {
        await fs.rm(ROOT, { recursive: true, force: true });

        const folders = [
            path.join(ROOT, 'src'),
            path.join(ROOT, 'src', 'modules'),
            path.join(ROOT, 'src', 'components'),
            path.join(ROOT, 'src', 'utils'),
            path.join(ROOT, 'data'),
            path.join(ROOT, 'data', 'input'),
            path.join(ROOT, 'data', 'output'),
            path.join(ROOT, 'temp')
        ];

        for (const dir of folders) {
            await fs.mkdir(dir, { recursive: true });
            await createFolderFiles(dir);
        }

        console.log(`Создана структура ${ROOT}:`);
        console.log(`project_${VARIANT}/`);
        await printTree(ROOT);

        const temp = path.join(ROOT, 'temp');
        const movedTemp = path.join(ROOT, 'data', 'temp');

        await fs.rename(temp, movedTemp);
        console.log('\n✓ temp перемещена в data');

        const output = path.join(ROOT, 'data', 'output');
        const results = path.join(ROOT, 'data', 'results');

        await fs.rename(output, results);
        console.log('✓ data/output переименована в data/results');

        await fs.rm(movedTemp, { recursive: true, force: true });
        console.log('✓ data/temp удалена');

        console.log('\nОбновлённое дерево:');
        console.log(`project_${VARIANT}/`);
        await printTree(ROOT);
    } catch (error) {
        console.error('Ошибка задания 2:', error.message);
    }
}

main();
