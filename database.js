const mysql = require('mysql');
const { promisify } = require('util');
const { database } = require('./keys');

const pool = mysql.createPool(database);

pool.getConnection((err, connection) => {
    if(err) {
        console.log(err.code);
        throw err;
    }

    if(connection) connection.release();

    console.log('Database is Connected in pool: ' + database.database);

    return
});

pool.query = promisify(pool.query);

module.exports = pool;