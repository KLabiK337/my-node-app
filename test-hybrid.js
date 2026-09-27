const HybridFileManager =
    require('./hybridFileManager');

const manager =
    new HybridFileManager('./hybrid-data');

console.log(
    '=== ТЕСТИРОВАНИЕ ГИБРИДНОГО МОДУЛЯ ===\n'
);

// Callback
manager.createFile(
    'callback.txt',
    'Файл создан через callback',
    (err, filePath) => {

        if (err) {
            console.error(
                '❌ Ошибка callback:',
                err.message
            );
            return;
        }

        console.log(
            `✅ Callback: ${filePath}`
        );

        manager.readFile(
            'callback.txt',
            (err, content) => {

                if (err) {
                    console.error(
                        '❌ Ошибка чтения:',
                        err.message
                    );
                    return;
                }

                console.log(
                    `✅ Callback чтение: ${content}`
                );
            }
        );
    }
);

// Promise
async function testPromises() {

    try {

        const path =
            await manager.createFileAsync(
                'promise.txt',
                'Файл создан через Promise'
            );

        console.log(
            `✅ Promise: ${path}`
        );

        const content =
            await manager.readFileAsync(
                'promise.txt'
            );

        console.log(
            `✅ Promise чтение: ${content}`
        );

        await manager.deleteFileAsync(
            'promise.txt'
        );

        console.log(
            '✅ Promise удаление выполнено'
        );

    } catch (error) {

        console.error(
            '❌ Ошибка Promise:',
            error.message
        );
    }
}

testPromises();