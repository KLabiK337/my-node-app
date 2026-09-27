module.exports = async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        console.error('[ERROR]', error);

        ctx.status = error.status || 500;

        ctx.body = {
            error: 'Internal server error',
            status: ctx.status
        };
    }
};