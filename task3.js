const fs = require('fs').promises;
const path = require('path');

const VARIANT = 12;
const ALLOWED = new Set(['.js', '.json', '.txt', '.md']);

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
}

async function scan(directory, result) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            result.folders++;
            await scan(fullPath, result);
            continue;
        }

        if (!entry.isFile()) continue;

        const ext = path.extname(entry.name).toLowerCase();

        // Вариант 12: анализируем только .js, .json, .txt, .md.
        if (!ALLOWED.has(ext)) continue;

        const stats = await fs.stat(fullPath);

        const item = {
            name: entry.name,
            path: fullPath,
            relativePath: path.relative('.', fullPath),
            extension: ext,
            size: stats.size
        };

        result.files.push(item);
        result.totalSize += stats.size;

        if (!result.byExtension[ext]) {
            result.byExtension[ext] = [];
        }

        result.byExtension[ext].push(item);
    }
}

async function main() {
    const target = process.argv[2] || '.';

    try {
        const result = {
            directory: target,
            folders: 0,
            files: [],
            totalSize: 0,
            byExtension: {}
        };

        await scan(target, result);

        const largest = [...result.files]
            .sort((a, b) => b.size - a.size)
            .slice(0, 5);

        const smallest = [...result.files]
            .sort((a, b) => a.size - b.size)
            .slice(0, 5);

        console.log(`📊 Анализ директории: ${target}`);
        console.log(`📁 Общее количество папок: ${result.folders}`);
        console.log(`📄 Общее количество файлов: ${result.files.length}`);
        console.log(
            `💾 Общий размер: ${formatSize(result.totalSize)} (${result.totalSize} байт)`
        );

        console.log('\n📂 Расширения файлов:');
        for (const [ext, items] of Object.entries(result.byExtension)) {
            const size = items.reduce((sum, item) => sum + item.size, 0);
            console.log(`${ext}: ${items.length} файлов (${formatSize(size)})`);
        }

        console.log('\n🏆 Топ-5 самых больших файлов:');
        largest.forEach((item, index) => {
            console.log(
                `${index + 1}. ${item.name} (${formatSize(item.size)}) - ${item.relativePath}`
            );
        });

        console.log('\n📉 Топ-5 самых маленьких файлов:');
        smallest.forEach((item, index) => {
            console.log(
                `${index + 1}. ${item.name} (${formatSize(item.size)}) - ${item.relativePath}`
            );
        });

        const report = {
            variant: VARIANT,
            student: 'Минчук Станислав Игоревич',
            group: '401',
            date: new Date().toLocaleString('ru-RU'),
            directory: target,
            filter: ['.js', '.json', '.txt', '.md'],
            totalFolders: result.folders,
            totalFiles: result.files.length,
            totalSizeBytes: result.totalSize,
            totalSizeKB: +(result.totalSize / 1024).toFixed(2),
            totalSizeMB: +(result.totalSize / 1024 / 1024).toFixed(2),
            filesByExtension: Object.fromEntries(
                Object.entries(result.byExtension).map(([ext, items]) => [
                    ext,
                    {
                        count: items.length,
                        sizeBytes: items.reduce((sum, item) => sum + item.size, 0)
                    }
                ])
            ),
            largestFiles: largest,
            smallestFiles: smallest
        };

        await fs.writeFile(
            path.join('.', `report_${VARIANT}.json`),
            JSON.stringify(report, null, 4),
            'utf8'
        );

        console.log(`\n📄 Отчёт сохранён: report_${VARIANT}.json`);
    } catch (error) {
        console.error('Ошибка задания 3:', error.message);
    }
}

main();
