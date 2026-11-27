const { ObjectId } = require('mongodb');
const { getDB } = require('../db');
const Joi = require('joi');

const userSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required(),

    email: Joi.string()
        .email()
        .required(),

    group_name: Joi.string()
        .pattern(/^ББМО-\d{2}-\d{2}$/)
        .required(),

    age: Joi.number()
        .integer()
        .min(16)
        .max(100)
        .required(),

    course: Joi.number()
        .integer()
        .min(1)
        .max(4)
        .optional()
});

const querySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),

    group_name: Joi.string()
        .pattern(/^ББМО-\d{2}-\d{2}$/)
        .optional(),

    course: Joi.number()
        .integer()
        .min(1)
        .max(4)
        .optional(),

    age_min: Joi.number()
        .integer()
        .min(16)
        .optional(),

    age_max: Joi.number()
        .integer()
        .max(100)
        .optional(),

    sort: Joi.string()
        .valid(
            'name',
            '-name',
            'age',
            '-age',
            'created_at',
            '-created_at'
        )
        .default('-created_at'),

    search: Joi.string()
        .min(1)
        .optional()
});

function validateUser(data) {
    return userSchema.validate(data, {
        abortEarly: false
    });
}

function validateQuery(data) {
    return querySchema.validate(data, {
        abortEarly: false
    });
}

class User {

    static collection() {
        return getDB().collection('users');
    }

    static async findAll(options = {}) {
        const {
            page = 1,
            limit = 10,
            group_name,
            course,
            age_min,
            age_max,
            sort = '-created_at'
        } = options;

        const filter = {};

        if (group_name) {
            filter.group_name = group_name;
        }

        if (course !== undefined) {
            filter.course = Number(course);
        }

        if (age_min !== undefined ||
            age_max !== undefined) {

            filter.age = {};

            if (age_min !== undefined) {
                filter.age.$gte = Number(age_min);
            }

            if (age_max !== undefined) {
                filter.age.$lte = Number(age_max);
            }
        }

        let sortField = sort;
        let sortOrder = 1;

        if (sort.startsWith('-')) {
            sortField = sort.substring(1);
            sortOrder = -1;
        }

        const skip = (page - 1) * limit;

        const data = await this.collection()
            .find(filter)
            .sort({
                [sortField]: sortOrder
            })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total =
            await this.collection()
                .countDocuments(filter);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async findById(id) {
        if (!ObjectId.isValid(id)) {
            return null;
        }

        return await this.collection().findOne({
            _id: new ObjectId(id)
        });
    }

    static async findByEmail(email) {
        return await this.collection().findOne({
            email
        });
    }

    static async create(data) {
        const result =
            await this.collection().insertOne({
                ...data,
                created_at: new Date()
            });

        return await this.findById(
            result.insertedId.toString()
        );
    }

    static async update(id, data) {
        if (!ObjectId.isValid(id)) {
            return null;
        }

        return await this.collection()
            .findOneAndUpdate(
                {
                    _id: new ObjectId(id)
                },
                {
                    $set: data
                },
                {
                    returnDocument: 'after'
                }
            );
    }

    static async delete(id) {
        if (!ObjectId.isValid(id)) {
            return false;
        }

        const result =
            await this.collection().deleteOne({
                _id: new ObjectId(id)
            });

        return result.deletedCount > 0;
    }

    static async search(text) {
        return await this.collection()
            .find({
                $text: {
                    $search: text
                }
            })
            .project({
                name: 1,
                email: 1,
                group_name: 1,
                age: 1,
                course: 1,
                score: {
                    $meta: 'textScore'
                }
            })
            .sort({
                score: {
                    $meta: 'textScore'
                }
            })
            .limit(100)
            .toArray();
    }

    static async getStats() {
        const result =
            await this.collection()
                .aggregate([
                    {
                        $facet: {
                            total: [
                                {
                                    $count: 'count'
                                }
                            ],

                            averageAge: [
                                {
                                    $group: {
                                        _id: null,
                                        value: {
                                            $avg: '$age'
                                        }
                                    }
                                }
                            ],

                            byGroup: [
                                {
                                    $group: {
                                        _id: '$group_name',
                                        count: {
                                            $sum: 1
                                        }
                                    }
                                },
                                {
                                    $sort: {
                                        _id: 1
                                    }
                                }
                            ],

                            byCourse: [
                                {
                                    $group: {
                                        _id: '$course',
                                        count: {
                                            $sum: 1
                                        }
                                    }
                                },
                                {
                                    $sort: {
                                        _id: 1
                                    }
                                }
                            ]
                        }
                    }
                ])
                .toArray();

        const stats = result[0];

        return {
            total:
                stats.total[0]?.count || 0,

            averageAge:
                Number(
                    (stats.averageAge[0]?.value || 0)
                        .toFixed(2)
                ),

            byGroup:
                Object.fromEntries(
                    stats.byGroup.map(item => [
                        item._id,
                        item.count
                    ])
                ),

            byCourse:
                Object.fromEntries(
                    stats.byCourse.map(item => [
                        item._id,
                        item.count
                    ])
                )
        };
    }
}

module.exports = {
    User,
    userSchema,
    querySchema,
    validateUser,
    validateQuery
};