const EventEmitter = require('events');

const emitter = new EventEmitter();

console.log('=== Сравнение on и once ===');

let onCount = 0;
let onceCount = 0;

function onListener() {
    onCount++;
    console.log(`[tick #${onCount}] on-слушатель`);
}

function onceListener() {
    onceCount++;
    console.log(`[tick #${onceCount}] once-слушатель`);
}

emitter.on('tick', onListener);
emitter.once('tick', onceListener);

emitter.emit('tick');
emitter.emit('tick');
emitter.emit('tick');

console.log();
console.log(`on-слушатель вызван: ${onCount} раза`);
console.log(`once-слушатель вызван: ${onceCount} раз`);

console.log('\n=== Управление подписками ===');

function listener1() {
    console.log('Первый слушатель');
}

function listener2() {
    console.log('Второй слушатель');
}

function listener3() {
    console.log('Третий слушатель');
}

emitter.on('group', listener1);
emitter.on('group', listener2);
emitter.addListener('group', listener3);

console.log(
    'Слушателей до удаления:',
    emitter.listenerCount('group')
);

console.log(
    'Список слушателей:',
    emitter.listeners('group').length
);

emitter.removeListener('group', listener2);

console.log(
    'Слушателей после удаления одного:',
    emitter.listenerCount('group')
);

emitter.removeAllListeners('group');

console.log(
    'Слушателей после removeAllListeners:',
    emitter.listenerCount('group')
);

console.log('\n=== Порядок вызова ===');

function firstListener() {
    console.log('1. Первый слушатель (группа ББМО-01-23)');
}

function secondListener() {
    console.log('2. Второй слушатель');
}

function thirdListener() {
    console.log('3. Третий слушатель');
}

emitter.on('order', firstListener);
emitter.on('order', secondListener);
emitter.on('order', thirdListener);

emitter.emit('order');