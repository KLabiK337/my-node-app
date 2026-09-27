// ============================================================
// Лабораторная работа №12
// Исследование цикла событий Node.js
// ============================================================

// Таймер попадает в фазу timers.
// Он выполняется после завершения текущего синхронного кода
// и обработки очередей микрозадач.
setTimeout(() => {
    console.log('1. setTimeout');
}, 0);

// setImmediate() выполняется в фазе check.
setImmediate(() => {
    console.log('2. setImmediate');
});

// process.nextTick() имеет очень высокий приоритет
// и выполняется после синхронного кода,
// до Promise.then().
process.nextTick(() => {
    console.log('3. process.nextTick');
});

// Promise.then() помещается в очередь микрозадач.
Promise.resolve().then(() => {
    console.log('4. Promise.then');
});

// Синхронный код выполняется сразу.
console.log('5. Синхронный код');

/*
Ожидаемый порядок:

5. Синхронный код
3. process.nextTick
4. Promise.then
1. setTimeout
2. setImmediate

Сначала выполняется синхронный код.
Затем Node.js обрабатывает process.nextTick.
После этого выполняются Promise callbacks.
Далее цикл событий переходит к асинхронным фазам,
где выполняются setTimeout и setImmediate.
*/