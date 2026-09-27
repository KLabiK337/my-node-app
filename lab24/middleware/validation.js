const { validateUser } = require('../models/user');

module.exports = async (ctx, next) => {
    if (
        ctx.method === 'POST' ||
        ctx.method === 'PUT'
    ) {
        const { error, value } =
            validateUser(ctx.request.body);

        if (error) {
            ctx.status = 400;

            ctx.body = {
                error: 'Validation failed',
                details: error.details.map(item => ({
                    field: item.path.join('.'),
                    message: item.message
                }))
            };

            return;
        }

        ctx.request.body = value;
    }

    await next();
};