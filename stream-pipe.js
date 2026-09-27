const fs = require('fs');
const {
    pipeline,
    Transform
} = require('stream');

console.log('=== Демонстрация pipe() ===');

const inputFile = 'input.txt';
const pipeOutput = 'output-pipe.txt';

console.log(`Чтение: ${inputFile}`);
console.log(`Запись: ${pipeOutput}`);

const readStream = fs.createReadStream(inputFile);
const writeStream = fs.createWriteStream(pipeOutput);

readStream.on('error', (error) => {
    console.log(
        `✖ Ошибка: ${error.message}`
    );
});

writeStream.on('error', (error) => {
    console.log(
        `✖ Ошибка записи: ${error.message}`
    );
});

writeStream.on('finish', () => {
    const size = fs.statSync(pipeOutput).size;

    console.log('✔ Копирование завершено');
    console.log(`Размер: ${size} байт`);

    demonstratePipeError();
});

readStream.pipe(writeStream);


// --------------------------------------------------
// PIPE С ОШИБКОЙ
// --------------------------------------------------

function demonstratePipeError() {
    console.log('\n=== Демонстрация pipe() с ошибкой ===');

    const missingStream =
        fs.createReadStream('missing.txt');

    const badDestination =
        new (require('stream').Writable)({
            write(chunk, encoding, callback) {
                callback();
            }
        });

    let destinationClosed = false;

    badDestination.on('close', () => {
        destinationClosed = true;
    });

    badDestination.on('finish', () => {
        console.log(
            '[PIPE] Целевой поток получил finish'
        );
    });

    missingStream.on('error', (error) => {
        console.log(
            `✖ Ошибка: ${error.message}`
        );

        setTimeout(() => {
            console.log(
                `⚠ pipe(): целевой поток закрыт автоматически: ${destinationClosed}`
            );

            demonstratePipeline();
        }, 100);
    });

    missingStream.pipe(badDestination);
}


// --------------------------------------------------
// PIPELINE
// --------------------------------------------------

function demonstratePipeline() {
    console.log('\n=== Демонстрация pipeline() ===');

    const pipelineOutput =
        'output-pipeline.txt';

    console.log(`Чтение: ${inputFile}`);
    console.log(`Запись: ${pipelineOutput}`);

    pipeline(
        fs.createReadStream(inputFile),
        fs.createWriteStream(pipelineOutput),
        (error) => {
            if (error) {
                console.log(
                    `✖ Ошибка: ${error.message}`
                );
            } else {
                console.log(
                    '✔ Копирование завершено'
                );
            }

            demonstratePipelineError();
        }
    );
}


// --------------------------------------------------
// PIPELINE С ОШИБКОЙ
// --------------------------------------------------

function demonstratePipelineError() {
    console.log(
        '\n=== Демонстрация pipeline() с ошибкой ==='
    );

    const source =
        fs.createReadStream('missing.txt');

    const destination =
        fs.createWriteStream(
            'pipeline-error-output.txt'
        );

    pipeline(
        source,
        destination,
        (error) => {
            if (error) {
                console.log(
                    `✖ Ошибка: ${error.message}`
                );

                console.log(
                    '✔ Все потоки автоматически закрыты'
                );

                console.log(
                    '✔ Утечек нет'
                );
            }

            demonstrateChain();
        }
    );
}


// --------------------------------------------------
// ЦЕПОЧКА TRANSFORM
// --------------------------------------------------

function demonstrateChain() {
    console.log('\n=== Цепочка потоков ===');

    console.log(
        'input.txt → uppercase → reverse → output-chain.txt'
    );

    const uppercase = new Transform({
        transform(chunk, encoding, callback) {
            callback(
                null,
                chunk.toString().toUpperCase()
            );
        }
    });

    const reverse = new Transform({
        transform(chunk, encoding, callback) {
            const text = chunk
                .toString()
                .split('')
                .reverse()
                .join('');

            callback(null, text);
        }
    });

    pipeline(
        fs.createReadStream(inputFile),
        uppercase,
        reverse,
        fs.createWriteStream(
            'output-chain.txt'
        ),
        (error) => {
            if (error) {
                console.log(
                    `✖ Ошибка цепочки: ${error.message}`
                );
            } else {
                console.log(
                    '✔ Обработка завершена'
                );
            }
        }
    );
}