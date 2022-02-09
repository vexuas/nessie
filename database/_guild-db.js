const { Pool, Client } = require('pg');
const { databaseConfig } = require('../config/database');

const pool = new Pool(databaseConfig);

exports.createGuildTable = (guilds) => {
  // Starts a transaction; similar to sqlite's serialize so we can group all the relevant queries and call them in order
  pool.connect((err, client, done) => {
    //Maybe put an error handler here someday
    client.query('BEGIN', (err) => {
      // Creates Guilds Table with the relevant columns if it does not exists
      client.query(
        'CREATE TABLE IF NOT EXISTS Guild(uuid TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, member_count INTEGER NOT NULL, owner_id TEXT NOT NULL, prefix TEXT NOT NULL, use_prefix BOOLEAN NOT NULL DEFAULT TRUE)'
      );
      client.query('SELECT * FROM Guild', (err, res) => {
        if (err) {
          console.log(err);
        }
        const guildsInDatabase = res.rows;
        guilds.forEach((guild) => {
          const isInDatabase = guildsInDatabase.find((guildDb) => guildDb.uuid === guild.id);
          if (!isInDatabase) {
            console.log('wtf');
          }
        });
      });
    });
  });
};
