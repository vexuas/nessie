const { Pool } = require('pg');
const { databaseConfig } = require('./config/database');

const pool = new Pool(databaseConfig);

exports.runMigration = (guilds) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      const createTable =
        'CREATE TABLE IF NOT EXISTS Guild(uuid TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, member_count INTEGER NOT NULL, owner_id TEXT NOT NULL, prefix TEXT NOT NULL, use_prefix BOOLEAN NOT NULL DEFAULT TRUE)';

      const insertNewGuild =
        'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix, use_prefix) VALUES ($uuid, $name, $member_count, $owner_id, $prefix, $use_prefix)';
      client.query(createTable);
      guilds.forEach((guild) => {
        client.query(insertNewGuild);
      });
    });
  });
};
