const fs = require('fs');

function setupLogger(app) {

    function writeLog(eventName, data) {
        const time = new Date().toISOString();

        const line =
            `[${time}] ${eventName}: ${JSON.stringify(data)}\n`;

        fs.appendFile(
            'logs.txt',
            line,
            'utf8',
            (err) => {
                if (err) {
                    console.error(
                        'Ошибка записи лога:',
                        err.message
                    );
                }
            }
        );
    }

    app.on('server:started', (port) => {
        writeLog(
            'server:started',
            { port: port }
        );
    });

    app.on('server:stopped', () => {
        writeLog(
            'server:stopped',
            {}
        );
    });

    app.on('request:received', (request) => {
        writeLog(
            'request:received',
            request
        );
    });
}

module.exports = {
    setupLogger
};