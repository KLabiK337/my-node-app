const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const VARIANT = 12;
const SOURCE = path.join('.', `source_${VARIANT}`);
const BACKUP = path.join('.', `backup_${VARIANT}`);
const REPORT = path.join('.', `sync_report_${VARIANT}.txt`);

const fileDefinitions = [
    ['file01.txt', 'Текстовый файл 01\n', 1000],
    ['file02.js', 'console.log("file02");\n', 1200],
    ['file03.json', '{"id":3,"name":"file03"}\n', 1400],
    ['file04.jpg', null, 5000],
    ['file05.png', null, 7000],
    ['file06.gif', null, 9000],
    ['file07.html', '<html><body>file07</body></html>\n', 1100],
    ['file08.css', 'body { margin: 0; }\n', 1300],
    ['file09.csv', 'id,name\n9,file09\n', 1500],
    ['file10.xml', '<file id="10">file10</file>\n', 1700],
    ['file11.log', 'Log entry file11\n', 1900],
    ['file12.dat', 'DATA12\n', 2100],
    ['file13.md', '# File 13\n', 2300],
    ['file14.ini', '[section]\nvalue=14\n', 2500],
    ['file15.cfg', 'enabled=true\n', 2700],
    ['file16.bin', null, 3000],
    ['file17.svg', '<svg></svg>\n', 3200],
    ['file18.conf', 'mode=18\n', 3400],
    ['file19.tmp', 'temporary file 19\n', 3600],
    ['file20.doc', 'Document file 20\n', 3800]
];

async function createTestFile(filePath, text, size) {
    if (text !== null) {
        const repetitions = Math.ceil(size / Buffer.byteLength(text, 'utf8'));
        let content = text.repeat(repetitions);
        content = content.slice(0, size);
        await fs.writeFile(filePath, content, 'utf8');
        return;
    }

    const buffer = Buffer.alloc(size, 65);
    await fs.writeFile(filePath, buffer);
}

async function createSourceStructure() {
    await fs.rm(SOURCE, { recursive: true, force: true });
    await fs.rm(BACKUP, { recursive: true, force: true });

    await fs.mkdir(SOURCE, { recursive: true });

    for (const [name, text, size] of fileDefinitions) {
        await createTestFile(
            path.join(SOURCE, name),
            text,
            size
        );
    }

    const subfolders = ['folder1', 'folder2', 'folder3'];

    for (const folder of subfolders) {
        const dir = path.join(SOURCE, folder);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(
            path.join(dir, `${folder}.txt`),
            `Файл из ${folder}\n`,
            'utf8'
        );

        await fs.writeFile(
            path.join(dir, `${folder}.js`),
            `console.log("${folder}");\n`,
            'utf8'
        );
    }

    const manifest = {
        variant: VARIANT,
        student: 'Минчук Станислав Игоревич',
        group: '401',
        created: new Date().toISOString(),
        files: fileDefinitions.map(([name, , size]) => ({
            name,
            size
        })),
        folders: subfolders
    };

    await fs.writeFile(
        path.join(SOURCE, 'manifest.json'),
        JSON.stringify(manifest, null, 4),
        'utf8'
    );
}

async function getAllFiles(dir) {
    const result = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            result.push(...await getAllFiles(fullPath));
        } else {
            result.push(fullPath);
        }
    }

    return result;
}

async function isDifferent(source, destination) {
    try {
        const sourceStats = await fs.stat(source);
        const destinationStats = await fs.stat(destination);

        return (
            sourceStats.size !== destinationStats.size ||
            Math.abs(sourceStats.mtimeMs - destinationStats.mtimeMs) > 1
        );
    } catch {
        return true;
    }
}

async function copyByStream(source, destination) {
    await fs.mkdir(path.dirname(destination), { recursive: true });

    return new Promise((resolve, reject) => {
        const input = fsSync.createReadStream(source);
        const output = fsSync.createWriteStream(destination);

        input.on('error', reject);
        output.on('error', reject);
        output.on('finish', resolve);

        input.pipe(output);
    });
}

async function copyByChunks(source, destination) {
    await fs.mkdir(path.dirname(destination), { recursive: true });

    const CHUNK_SIZE = 512 * 1024;

    const sourceHandle = await fs.open(source, 'r');
    const destinationHandle = await fs.open(destination, 'w');

    try {
        const buffer = Buffer.alloc(CHUNK_SIZE);
        let position = 0;

        while (true) {
            const { bytesRead } = await sourceHandle.read(
                buffer,
                0,
                CHUNK_SIZE,
                position
            );

            if (bytesRead === 0) break;

            await destinationHandle.write(
                buffer,
                0,
                bytesRead
            );

            position += bytesRead;
        }
    } finally {
        await sourceHandle.close();
        await destinationHandle.close();
    }
}

async function copyFile(source, destination) {
    const stats = await fs.stat(source);
    const extension = path.extname(source).toLowerCase();

    // >1 МБ: чанки по 512 КБ.
    if (stats.size > 1024 * 1024) {
        await copyByChunks(source, destination);
        return 'chunks';
    }

    // .txt, .js, .json: потоки.
    if (['.txt', '.js', '.json'].includes(extension)) {
        await copyByStream(source, destination);
        return 'stream';
    }

    // .jpg, .png, .gif: обычное копирование.
    if (['.jpg', '.png', '.gif'].includes(extension)) {
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.copyFile(source, destination);
        return 'normal';
    }

    // Остальные расширения: обычное копирование.
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    return 'normal';
}

async function compareDirectories() {
    const sourceFiles = await getAllFiles(SOURCE);
    const backupFiles = await getAllFiles(BACKUP);

    const sourceMap = new Map(
        sourceFiles.map(file => [
            path.relative(SOURCE, file),
            file
        ])
    );

    const backupMap = new Map(
        backupFiles.map(file => [
            path.relative(BACKUP, file),
            file
        ])
    );

    const added = [];
    const deleted = [];
    const changed = [];
    const same = [];

    for (const [relative, source] of sourceMap) {
        if (!backupMap.has(relative)) {
            added.push(relative);
            continue;
        }

        const different = await isDifferent(
            source,
            backupMap.get(relative)
        );

        if (different) {
            changed.push(relative);
        } else {
            same.push(relative);
        }
    }

    for (const relative of backupMap.keys()) {
        if (!sourceMap.has(relative)) {
            deleted.push(relative);
        }
    }

    return {
        same,
        changed,
        added,
        deleted
    };
}

async function main() {
    try {
        await createSourceStructure();

        await fs.mkdir(BACKUP, { recursive: true });

        const files = await getAllFiles(SOURCE);

        console.log(`📂 Исходная директория: source_${VARIANT}`);
        console.log(`📂 Директория назначения: backup_${VARIANT}`);
        console.log(`📋 Обнаружено файлов: ${files.length}`);

        let copied = 0;
        let skipped = 0;
        let streamed = 0;
        let normal = 0;
        let chunks = 0;
        let totalSize = 0;

        for (let i = 0; i < files.length; i++) {
            const source = files[i];
            const relative = path.relative(SOURCE, source);
            const destination = path.join(BACKUP, relative);

            // Варианты 11-15: инкрементальное копирование.
            // Если файл не изменился, повторно его не копируем.
            if (!(await isDifferent(source, destination))) {
                skipped++;
                console.log(
                    `⏭ ${i + 1}/${files.length}: без изменений — ${relative}`
                );
                continue;
            }

            const stats = await fs.stat(source);
            totalSize += stats.size;

            const method = await copyFile(
                source,
                destination
            );

            copied++;

            if (method === 'stream') streamed++;
            if (method === 'normal') normal++;
            if (method === 'chunks') chunks++;

            console.log(
                `⏳ Прогресс копирования: ${i + 1}/${files.length} файлов — ${relative}`
            );
        }

        console.log('\n✅ Копирование завершено!');
        console.log(`- Скопировано файлов: ${copied}`);
        console.log(`- Пропущено без изменений: ${skipped}`);
        console.log(`- Потоковое копирование: ${streamed}`);
        console.log(`- Обычное копирование: ${normal}`);
        console.log(`- Копирование чанками: ${chunks}`);
        console.log(`- Общий размер новых копий: ${totalSize} байт`);

        const comparison = await compareDirectories();

        console.log('\n🔄 Сравнение директорий:');
        console.log(`- Совпадают: ${comparison.same.length} файлов`);
        console.log(`- Изменены: ${comparison.changed.length} файлов`);
        console.log(`- Добавлены: ${comparison.added.length} файлов`);
        console.log(`- Удалены: ${comparison.deleted.length} файлов`);

        const report = [
            'ОТЧЁТ СИНХРОНИЗАЦИИ',
            `Студент: Минчук Станислав Игоревич`,
            `Группа: 401`,
            `Вариант: ${VARIANT}`,
            `Дата: ${new Date().toLocaleString('ru-RU')}`,
            '',
            `Совпадают: ${comparison.same.length}`,
            `Изменены: ${comparison.changed.length}`,
            `Добавлены: ${comparison.added.length}`,
            `Удалены: ${comparison.deleted.length}`,
            '',
            'Изменённые файлы:',
            ...comparison.changed.map(file => `- ${file}`),
            '',
            'Добавленные файлы:',
            ...comparison.added.map(file => `- ${file}`),
            '',
            'Удалённые файлы:',
            ...comparison.deleted.map(file => `- ${file}`)
        ].join('\n');

        await fs.writeFile(
            REPORT,
            report,
            'utf8'
        );

        console.log(`📄 Отчёт сохранён: sync_report_${VARIANT}.txt`);
    } catch (error) {
        console.error('Ошибка задания 5:', error.message);
    }
}

main();
