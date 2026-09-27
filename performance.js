const fs = require('fs');
const { promisify } = require('util');

const writeFile =
    promisify(fs.writeFile);

const TEST_FILE =
    './performance-test.txt';

const ITERATIONS = 100;

console.log(
    '=== ИССЛЕДОВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ ===\n'
);

// ------------------------------------------------------------
// 1. Синхронная запись
// ------------------------------------------------------------

const syncStart = process.hrtime.bigint();

for (let i = 0; i < ITERATIONS; i++) {

    fs.writeFileSync(
        TEST_FILE,
        `Синхронная запись ${i}`,
        'utf8'
    );
}

const syncEnd = process.hrtime.bigint();

const syncTime =
    Number(syncEnd - syncStart) / 1e6;

console.log(
    `1. Синхронная запись: ${syncTime.toFixed(2)} мс`
);

// ------------------------------------------------------------
// 2. Callback
// ------------------------------------------------------------

let callbackCompleted = 0;

const callbackStart =
    process.hrtime.bigint();

for (let i = 0; i < ITERATIONS; i++) {

    fs.writeFile(
        TEST_FILE,
        `Callback запись ${i}`,
        'utf8',
        () => {

            callbackCompleted++;

            if (callbackCompleted === ITERATIONS) {

                const callbackEnd =
                    process.hrtime.bigint();

                const callbackTime =
                    Number(
                        callbackEnd - callbackStart
                    ) / 1e6;

                console.log(
                    `2. Callback-запись: ${callbackTime.toFixed(2)} мс`
                );

                runPromises();
            }
        }
    );
}

// ------------------------------------------------------------
// 3. Promise
// ------------------------------------------------------------

async function runPromises() {

    const promiseStart =
        process.hrtime.bigint();

    const promises = [];

    for (let i = 0; i < ITERATIONS; i++) {

        promises.push(
            writeFile(
                TEST_FILE,
                `Promise запись ${i}`,
                'utf8'
            )
        );
    }

    await Promise.all(promises);

    const promiseEnd =
        process.hrtime.bigint();

    const promiseTime =
        Number(
            promiseEnd - promiseStart
        ) / 1e6;

    console.log(
        `3. Promise-запись: ${promiseTime.toFixed(2)} мс`
    );

    fs.unlinkSync(TEST_FILE);

    console.log(
        '\n✅ Исследование завершено!'
    );
}