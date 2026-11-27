const EventEmitter = require('events');
const os = require('os');
const http = require('http');

const GROUP = 'ББМО-01-23';

class EventBus extends EventEmitter {
    constructor() {
        super();

        this.events = new Map();
        this.anyListeners = new Set();

        this.metrics = {
            events: {},
            total: 0,
            lastCall: null,
            errors: {}
        };
    }

    on(event, listener, priority = 0) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push({
            listener,
            priority,
            once: false
        });

        this.events.get(event).sort(
            (a, b) => b.priority - a.priority
        );

        return this;
    }

    once(event, listener, priority = 0) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push({
            listener,
            priority,
            once: true
        });

        this.events.get(event).sort(
            (a, b) => b.priority - a.priority
        );

        return this;
    }

    off(event, listener) {
        if (!this.events.has(event)) {
            return this;
        }

        const listeners = this.events.get(event);

        const filtered = listeners.filter(
            item => item.listener !== listener
        );

        this.events.set(event, filtered);

        return this;
    }

    onAny(listener) {
        this.anyListeners.add(listener);

        return this;
    }

    emit(event, ...args) {
        this.metrics.total++;

        if (!this.metrics.events[event]) {
            this.metrics.events[event] = 0;
        }

        this.metrics.events[event]++;

        this.metrics.lastCall = new Date().toISOString();

        for (const listener of this.anyListeners) {
            try {
                listener(event, args);
            } catch (error) {
                this.recordError(event, error);
            }
        }

        const listeners = this.events.get(event);

        if (!listeners) {
            return false;
        }

        const currentListeners = [...listeners];

        for (const item of currentListeners) {
            try {
                item.listener(...args);
            } catch (error) {
                this.recordError(event, error);
            }

            if (item.once) {
                this.off(event, item.listener);
            }
        }

        return true;
    }

    recordError(event, error) {
        if (!this.metrics.errors[event]) {
            this.metrics.errors[event] = 0;
        }

        this.metrics.errors[event]++;

        console.log(
            `[ERROR] [${GROUP}] Ошибка в слушателе "${event}": ${error.message}`
        );
    }

    getMetrics() {
        const listeners = {};

        for (const [event, items] of this.events) {
            listeners[event] = items.length;
        }

        return {
            group: GROUP,
            events: this.metrics.events,
            total: this.metrics.total,
            lastCall: this.metrics.lastCall,
            errors: this.metrics.errors,
            listeners
        };
    }
}

const bus = new EventBus();

console.log(`=== EventBus (группа ${GROUP}) ===`);

console.log('\n--- Приоритеты ---');

bus.on(
    'priority-test',
    () => {
        console.log('[priority 10] Высокий приоритет');
    },
    10
);

bus.on(
    'priority-test',
    () => {
        console.log('[priority 5] Средний приоритет');
    },
    5
);

bus.on(
    'priority-test',
    () => {
        console.log('[priority 0] Низкий приоритет');
    },
    0
);

bus.emit('priority-test');

console.log('\n--- Wildcard ---');

bus.onAny((event, args) => {
    console.log(
        `[onAny] Событие "${event}" с аргументами: ${JSON.stringify(args)}`
    );
});

bus.on('greet', (name) => {
    console.log(`Привет, ${name}!`);
});

bus.on('info', (group) => {
    console.log(`Информация о группе: ${group}`);
});

bus.emit('greet', 'Иван');
bus.emit('info', GROUP);

console.log('\n--- Once-кэш ---');

let tickCount = 0;
let onceCount = 0;

bus.on('tick', () => {
    tickCount++;
    console.log(`[tick] Вызов ${tickCount}`);
});

bus.once('tick', () => {
    onceCount++;
    console.log('[tick] once-слушатель');
});

bus.emit('tick');
bus.emit('tick');
bus.emit('tick');

console.log(
    `once-слушатель вызван: ${onceCount} раз`
);

console.log('\n--- Обработка ошибок ---');

bus.on('test', () => {
    throw new Error('Ошибка в первом слушателе');
});

bus.on('test', () => {
    console.log('Второй слушатель продолжил работу');
});

bus.emit('test');

console.log('\n--- Метрики ---');

const metrics = bus.getMetrics();

for (const [event, count] of Object.entries(metrics.events)) {
    console.log(`${event}: ${count} вызова`);
}

console.log(`Всего событий: ${metrics.total}`);

console.log('\n--- Интеграция с os ---');

bus.on('system-info', (data) => {
    console.log(
        `[OS] Платформа: ${data.platform}, CPU: ${data.cpu}, RAM: ${data.ram} ГБ`
    );
});

const totalMemory =
    os.totalmem() / 1024 / 1024 / 1024;

bus.emit('system-info', {
    platform: os.platform(),
    cpu: os.cpus().length,
    ram: totalMemory.toFixed(2)
});

console.log('\n--- HTTP-сервер ---');

const server = http.createServer((req, res) => {
    bus.emit('request', {
        method: req.method,
        url: req.url
    });

    if (req.method === 'GET' && req.url === '/metrics') {
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8'
        });

        res.end(
            JSON.stringify(
                bus.getMetrics(),
                null,
                2
            )
        );

        return;
    }

    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });

    res.end(
        'EventBus server. Используйте GET /metrics'
    );
});

server.listen(3000, () => {
    console.log(
        'HTTP-сервер запущен: http://localhost:3000'
    );

    console.log(
        'GET /metrics — просмотр метрик'
    );
});