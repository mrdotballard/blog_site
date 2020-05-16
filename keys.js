module.exports = {

    database: {
        connectionLimit: 10,
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || '',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DB_NAME || 'db'
    }

};