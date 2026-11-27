const EventEmitter = require('events');

class DatabaseConnection extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
    }

    connect() {
        console.log('[EVENT] Подключение к БД...');

        this.connected = true;

        this.emit('connect');
    }

    query(sql) {
        if (!this.connected) {
            this.error('База данных не подключена');
            return;
        }

        let result;

        if (sql.startsWith('SELECT')) {
            result = '50 записей';
        } else if (sql.startsWith('INSERT')) {
            result = '1 запись добавлена';
        } else {
            result = 'Запрос выполнен';
        }

        this.emit('query', sql, result);
    }

    close() {
        this.emit('close');

        this.connected = false;
    }

    error(message) {
        this.emit('error', new Error(message));
    }
}

console.log('=== DatabaseConnection (группа ББМО-01-23) ===');

const db = new DatabaseConnection();

db.on('connect', () => {
    console.log('[EVENT] Соединение установлено');
});

db.on('query', (sql, result) => {
    console.log(`[EVENT] Выполнение запроса: ${sql}`);
    console.log(`[EVENT] Результат: ${result}`);
});

db.on('close', () => {
    console.log('[EVENT] Закрытие соединения');
    console.log('[EVENT] Соединение закрыто');
});

db.on('error', (error) => {
    console.log(`[EVENT] Ошибка: ${error.message}`);
});

db.connect();

db.query('SELECT * FROM students');

db.query('INSERT INTO students');

db.close();

console.log('\n=== Демонстрация ошибки ===');

db.error('Connection timeout');

console.log(
    '(без слушателя error — Node.js выбросил бы исключение)'
);