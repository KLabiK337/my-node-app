const UserService = require('../services/userService');
const {
    validateUser,
    validateQuery
} = require('../models/user');

function validationDetails(details) {
    return details.map(item => ({
        field: item.path.join('.'),
        message: item.message
    }));
}

async function getUsers(ctx) {

    const { error, value } =
        validateQuery(ctx.query);

    if (error) {
        ctx.status = 400;

        ctx.body = {
            error: 'Validation failed',
            details: validationDetails(
                error.details
            )
        };

        return;
    }

    const result =
        await UserService.getAll(value);

    ctx.body = result;
}

async function getUser(ctx) {

    const user =
        await UserService.getById(
            ctx.params.id
        );

    if (!user) {
        ctx.status = 404;

        ctx.body = {
            error: 'User not found',
            status: 404
        };

        return;
    }

    ctx.body = {
        data: user
    };
}

async function createUser(ctx) {

    const { error, value } =
        validateUser(ctx.request.body);

    if (error) {
        ctx.status = 400;

        ctx.body = {
            error: 'Validation failed',
            details: validationDetails(
                error.details
            )
        };

        return;
    }

    const user =
        await UserService.create(value);

    ctx.status = 201;

    ctx.body = {
        data: user
    };
}

async function updateUser(ctx) {

    const { error, value } =
        validateUser(ctx.request.body);

    if (error) {
        ctx.status = 400;

        ctx.body = {
            error: 'Validation failed',
            details: validationDetails(
                error.details
            )
        };

        return;
    }

    const user =
        await UserService.update(
            ctx.params.id,
            value
        );

    if (!user) {
        ctx.status = 404;

        ctx.body = {
            error: 'User not found',
            status: 404
        };

        return;
    }

    ctx.body = {
        data: user
    };
}

async function deleteUser(ctx) {

    const deleted =
        await UserService.delete(
            ctx.params.id
        );

    if (!deleted) {
        ctx.status = 404;

        ctx.body = {
            error: 'User not found',
            status: 404
        };

        return;
    }

    ctx.body = {
        data: {
            message: 'User deleted successfully'
        }
    };
}

async function searchUsers(ctx) {

    const q = ctx.query.q;

    if (!q) {
        ctx.status = 400;

        ctx.body = {
            error: 'Parameter q is required'
        };

        return;
    }

    const users =
        await UserService.search(q);

    ctx.body = {
        found: users.length,
        data: users
    };
}

async function getStats(ctx) {

    const stats =
        await UserService.stats();

    ctx.body = stats;
}

async function exportUsers(ctx) {

    const result =
        await UserService.getAll({
            page: 1,
            limit: 100
        });

    const users = result.data;

    const header =
        'name,email,group_name,age,course,created_at';

    const rows = users.map(user => {
        return [
            user.name,
            user.email,
            user.group_name,
            user.age || '',
            user.course || '',
            user.created_at || ''
        ]
            .map(value =>
                `"${String(value).replace(/"/g, '""')}"`
            )
            .join(',');
    });

    const csv =
        [header, ...rows].join('\n');

    ctx.type = 'text/csv; charset=utf-8';

    ctx.set(
        'Content-Disposition',
        'attachment; filename="users.csv"'
    );

    ctx.body = csv;
}

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    getStats,
    exportUsers
};