const { Pool } = require('pg');
const { databaseConfig } = require('./config/database');
const { defaultPrefix } = require('./config/nessie.json');

const pool = new Pool(databaseConfig);

exports.runMigration = (guilds) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      const createTable =
        'CREATE TABLE IF NOT EXISTS Guild(uuid TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, member_count INTEGER NOT NULL, owner_id TEXT NOT NULL, prefix TEXT NOT NULL, use_prefix BOOLEAN NOT NULL DEFAULT TRUE)';
      const selectGuilds = 'SELECT * FROM Guild';
      const insertNewGuild =
        'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix, use_prefix) VALUES ($1, $2, $3, $4, $5, $6)';
      const updateUsePrefix = 'UPDATE Guild SET use_prefix = ($1) WHERE uuid = ($2)';
      client.query(createTable);
      // client.query(updateUsePrefix, [false, '491143168352452608'], (err, res) => {
      //   console.log(err);
      //   console.log(res);
      // });
      // guilds.forEach((guild) => {
      //   const insertGuildValues = [
      //     guild.id,
      //     guild.name,
      //     guild.memberCount,
      //     guild.ownerId,
      //     defaultPrefix,
      //     true,
      //   ];
      //   client.query(insertNewGuild, insertGuildValues, (err, res) => {
      //     console.log(err);
      //     console.log(res);
      //   });
      // });
      // client.query('COMMIT', (err) => {
      //   console.log(err);
      //   done();
      // });
      client.query(selectGuilds, (err, res) => {
        console.log(res.rows);
        done();
      });
    });
  });
};

this.runMigration();
