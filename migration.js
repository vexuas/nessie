const { Pool } = require('pg');
const { databaseConfig } = require('./config/database');
const { defaultPrefix } = require('./config/nessie.json');

const pool = new Pool(databaseConfig);

/**
 * Below are all the queries used to migrate our existing database to digital ocean
 * Commenting them out as we don't need them anymore
 * Tho I'm gonna keep this file here for now for learning purposes
 */
exports.runMigration = (guilds) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      const createTable =
        'CREATE TABLE IF NOT EXISTS Guild(uuid TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, member_count INTEGER NOT NULL, owner_id TEXT NOT NULL, prefix TEXT NOT NULL, use_prefix BOOLEAN NOT NULL DEFAULT TRUE)';
      const selectGuilds = 'SELECT * FROM Guild WHERE prefix != ($1)';
      const insertNewGuild =
        'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix, use_prefix) VALUES ($1, $2, $3, $4, $5, $6)';
      const updateUsePrefix = 'UPDATE Guild SET use_prefix = ($1) WHERE uuid = ($2)';
      const updateSetPrefix = 'UPDATE Guild SET prefix = ($1) WHERE uuid = ($2)';
      const deleteGuilds = 'DELETE FROM Guild';
      // ----
      // Create Guild Table
      // client.query(createTable);
      // -----
      // Update to not use prefix commands
      // client.query(updateUsePrefix, [false, '806202826547134525'], (err, res) => {
      //   console.log(err);
      //   console.log(res);
      // });
      // -----
      // Update to custom prefix
      // client.query(updateSetPrefix, ['nes', '935574827614482462'], (err, res) => {
      //   console.log(err);
      //   console.log(res);
      // });
      // ----
      // Commit changes to database
      // client.query('COMMIT', (err) => {
      //   console.log(err);
      //   done();
      // });
      // Add each guild to database
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
      // ----
      // Gets all guilds
      // client.query(selectGuilds, ['$nes-'], (err, res) => {
      //   console.log(res.rows);
      //   done();
      // });
      // ----
      // Delete all rows
      // client.query(deleteGuilds, (err, res) => {
      //   console.log(err);
      //   console.log(res);
      //   client.query('COMMIT');
      // });
      // ----
    });
  });
};

// this.runMigration();
