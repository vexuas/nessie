const { Pool } = require('pg');
const { databaseConfig } = require('./config/database');

const pool = new Pool(databaseConfig);

pool.query('SELECT NOW()', (err, res) => {
  console.log(err);
  console.log(res);
  pool.end();
});
