const { User } = require('../models/user');

class UserService {

    static async getAll(options = {}) {
        console.log('[SERVICE] Получение списка пользователей');

        return await User.findAll(options);
    }

    static async getById(id) {
        console.log(`[SERVICE] Поиск пользователя: ${id}`);

        return await User.findById(id);
    }

    static async create(data) {
        console.log(
            `[SERVICE] Создание пользователя: ${data.email}`
        );

        const existingUser =
            await User.findByEmail(data.email);

        if (existingUser) {
            const error = new Error(
                'Email already exists'
            );

            error.status = 409;

            throw error;
        }

        const user = await User.create(data);

        console.log(
            `[SERVICE] Пользователь создан: ${user.email}`
        );

        return user;
    }

    static async update(id, data) {
        console.log(
            `[SERVICE] Обновление пользователя: ${id}`
        );

        if (data.email) {
            const existing =
                await User.findByEmail(data.email);

            if (
                existing &&
                existing._id.toString() !== id
            ) {
                const error = new Error(
                    'Email already exists'
                );

                error.status = 409;

                throw error;
            }
        }

        return await User.update(id, data);
    }

    static async delete(id) {
        console.log(
            `[SERVICE] Удаление пользователя: ${id}`
        );

        return await User.delete(id);
    }

    static async search(text) {
        console.log(
            `[SERVICE] Поиск: ${text}`
        );

        return await User.search(text);
    }

    static async stats() {
        console.log(
            '[SERVICE] Формирование статистики'
        );

        return await User.getStats();
    }
}

module.exports = UserService;