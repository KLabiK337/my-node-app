const http = require('http');
const EventEmitter = require('events');

const logger = require('./logger');

const PORT = 3000;

// ============================================================
// Функция вычисления числа Пи без сторонних библиотек
// Метод Лейбница:
// PI = 4 * (1 - 1/3 + 1/5 - 1/7 + ...)
// ============================================================
function calculatePi(iterations) {
    let pi = 0;

    for (let i = 0; i < iterations; i++) {
        pi += (i % 2 === 0 ? 1 : -1) / (2 * i + 1);
    }

    return pi * 4;
}

// ============================================================
// Задание 1. AppServer
// ============================================================
class AppServer extends EventEmitter {
    constructor() {
        super();

        this.server = http.createServer((req, res) => {
            // Событие получения запроса
            this.emit('request:received', {
                url: req.url,
                method: req.method
            });

            // Задание 3. Обработка заказа
            if (req.method === 'GET' && req.url.startsWith('/order/')) {
                const orderId = req.url.split('/')[2];

                if (orderId) {
                    orderHandler.processOrder(orderId);

                    res.writeHead(200, {
                        'Content-Type': 'text/plain; charset=utf-8'
                    });

                    res.end(
                        `Заказ #${orderId} принят на обработку.`
                    );

                    return;
                }
            }

            // Ответ сервера
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8'
            });

            res.end('Hello from Event-Driven Server!');
        });
    }

    start(port) {
        this.server.listen(port, () => {
            this.emit('server:started', port);
        });
    }

    stop() {
        this.server.close(() => {
            this.emit('server:stopped');
        });
    }
}

// ============================================================
// Задание 3. OrderHandler
// ============================================================
class OrderHandler extends EventEmitter {
    processOrder(orderId) {
        // Начало обработки
        this.emit('order:start', orderId);

        // Через 2 секунды
        setTimeout(() => {
            this.emit(
                'order:processing',
                orderId,
                'Идёт обработка...'
            );
        }, 2000);

        // Ещё через 2 секунды
        setTimeout(() => {
            const sum = Math.floor(Math.random() * 901) + 100;

            this.emit('order:complete', orderId, sum);
        }, 4000);
    }
}

// ============================================================
// Создание сервера и обработчика заказов
// ============================================================
const app = new AppServer();
const orderHandler = new OrderHandler();

// ============================================================
// Задание 2. Подключение логгера
// ============================================================
logger.setupLogger(app);

// ============================================================
// Обработчики событий сервера
// ============================================================

app.on('server:started', (port) => {
    console.log(`🚀 Сервер запущен на порту ${port}`);
});

app.on('request:received', ({ method, url }) => {
    console.log(`📨 Получен запрос: ${method} ${url}`);
});

app.on('server:stopped', () => {
    console.log('🛑 Сервер остановлен');
});

// ============================================================
// Обработчики событий заказов
// ============================================================

orderHandler.on('order:start', (orderId) => {
    console.log(`→ [order:start] Заказ #${orderId} начат`);
});

orderHandler.on('order:processing', (orderId, message) => {
    console.log(
        `→ Через 2 сек: [order:processing] Заказ #${orderId}: ${message}`
    );
});

orderHandler.on('order:complete', (orderId, sum) => {
    const pi = calculatePi(10000000).toFixed(7);

    console.log(
        `→ Через 4 сек: [order:complete] Заказ #${orderId} ` +
        `завершён на сумму ${sum} руб. PI = ${pi}`
    );
});

// ============================================================
// Задание 5. UserTracker
// ============================================================
class UserTracker extends EventEmitter {
    trackAction(userId, action, metadata) {
        const event = {
            userId: userId,
            action: action,
            timestamp: new Date().toISOString(),
            metadata: metadata,
            id: Math.random().toString(36).substr(2, 9)
        };

        this.emit('user:action', event);
    }
}

const userTracker = new UserTracker();

userTracker.on('user:action', (event) => {
    console.log('');
    console.log(
        `👤 Пользователь ${event.userId} совершил действие "${event.action}"`
    );
    console.log(`Время: ${event.timestamp}`);
    console.log(`ID события: ${event.id}`);
    console.log(`Доп. данные: ${JSON.stringify(event.metadata)}`);
    console.log('');
});

// Тестовые вызовы
userTracker.trackAction(
    'user001',
    'login',
    {
        browser: 'Chrome',
        device: 'PC'
    }
);

userTracker.trackAction(
    'user002',
    'purchase',
    {
        product: 'Node.js Course',
        price: 500
    }
);

userTracker.trackAction(
    'user003',
    'logout',
    {
        reason: 'user action'
    }
);

// ============================================================
// Запуск сервера
// ============================================================
app.start(PORT);

// Остановка через 10 секунд
setTimeout(() => {
    app.stop();
}, 10000);