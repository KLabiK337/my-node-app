const EventEmitter = require('events');

class PluginManager extends EventEmitter {
    constructor() {
        super();

        this.plugins = new Map();

        this.on('newListener', (eventName) => {
            if (
                eventName !== 'newListener' &&
                eventName !== 'removeListener'
            ) {
                console.log(
                    `[newListener] Добавлен слушатель "${eventName}"`
                );
            }
        });

        this.on('removeListener', (eventName) => {
            if (
                eventName !== 'newListener' &&
                eventName !== 'removeListener'
            ) {
                console.log(
                    `[removeListener] Удалён слушатель "${eventName}"`
                );
            }
        });
    }

    register(name, eventName, listener) {
        this.plugins.set(name, {
            eventName,
            listener
        });

        this.on(eventName, listener);

        console.log(`[PLUGIN] Зарегистрирован: ${name}`);

        this.emit('plugin:registered', name);
    }

    remove(name) {
        const plugin = this.plugins.get(name);

        if (!plugin) {
            return;
        }

        this.removeListener(
            plugin.eventName,
            plugin.listener
        );

        this.plugins.delete(name);

        console.log(`[PLUGIN] Удалён: ${name}`);

        this.emit('plugin:removed', name);
    }
}

console.log('=== Система плагинов ===');

const manager = new PluginManager();

manager.on('plugin:registered', (name) => {
    console.log(`[PLUGIN EVENT] Зарегистрирован: ${name}`);
});

manager.on('plugin:removed', (name) => {
    console.log(`[PLUGIN EVENT] Удалён: ${name}`);
});

function loggerPlugin(message) {
    console.log(`[LoggerPlugin] ${message}`);
}

function alertPlugin(message) {
    console.log(`[AlertPlugin] ${message}`);
}

manager.register(
    'LoggerPlugin',
    'log',
    loggerPlugin
);

manager.register(
    'AlertPlugin',
    'alert',
    alertPlugin
);

manager.emit('log', 'Сообщение системы');
manager.emit('alert', 'Внимание!');

manager.remove('LoggerPlugin');

console.log('\n=== Демонстрация утечки ===');

for (let i = 0; i < 10; i++) {
    manager.on('memory-test', () => {});
}

console.log(
    'Слушателей до:',
    manager.listenerCount('memory-test')
);

for (let i = 0; i < 1000; i++) {
    manager.on('memory-test', () => {});
}

console.log(
    'Слушателей после добавления 1000:',
    manager.listenerCount('memory-test')
);

manager.removeAllListeners('memory-test');

console.log(
    'Слушателей после removeAllListeners:',
    manager.listenerCount('memory-test')
);

console.log('\n=== Асинхронные слушатели ===');

manager.on('async-test', async () => {
    await new Promise(resolve => {
        setTimeout(resolve, 100);
    });

    console.log(
        '[BBMO-01-23] async-слушатель завершён через 100ms'
    );
});

console.log(
    '[BBMO-01-23] emit вызван (не ждёт async-слушатель)'
);

manager.emit('async-test');