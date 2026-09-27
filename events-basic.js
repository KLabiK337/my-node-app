const EventEmitter = require('events');

const emitter = new EventEmitter();

console.log('=== Демонстрация EventEmitter ===');

emitter.on('greet', (name) => {
    console.log(`[greet] Привет, ${name}!`);
});

emitter.on('info', () => {
    console.log('[info] Группа: ББМО-01-23');
});

emitter.on('bye', () => {
    console.log('[bye] До свидания!');
});

emitter.emit('greet', 'Иван');
emitter.emit('info');
emitter.emit('bye');

const unknownResult = emitter.emit('unknown');

const greetResult = emitter.emit('greet', 'Станислав');

console.log(
    `Событие "unknown" без слушателей: ${unknownResult}`
);

console.log(
    `Событие "greet" со слушателями: ${greetResult}`
);