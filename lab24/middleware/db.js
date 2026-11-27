const { getDB } = require('../db');

module.exports = async (ctx, next) => {
    ctx.db = getDB();

    await next();
};