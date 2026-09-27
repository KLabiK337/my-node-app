const fs = require('fs');

module.exports = async (ctx, next) => {
    const start = Date.now();

    await next();

    const duration = Date.now() - start;

    const message =
        `[${new Date().toISOString()}] ` +
        `${ctx.method} ${ctx.url} ` +
        `${ctx.status} ${duration}ms\n`;

    console.log(message.trim());

    fs.appendFileSync(
        'lab24.log',
        message
    );
};