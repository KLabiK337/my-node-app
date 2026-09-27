const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = 'bbmo_01_23';

const client = new MongoClient(uri);

let db;

async function connectDB() {
    if (db) {
        return db;
    }

    await client.connect();

    db = client.db(dbName);

    await db.command({ ping: 1 });

    console.log('[INFO] MongoDB подключена');
    console.log(`[INFO] База данных: ${dbName}`);

    const users = db.collection('users');

    await users.createIndex(
        { email: 1 },
        {
            unique: true,
            name: 'unique_email'
        }
    );

    return db;
}

function getDB() {
    if (!db) {
        throw new Error('MongoDB не подключена');
    }

    return db;
}

module.exports = {
    connectDB,
    getDB,
    client
};