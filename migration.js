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
      const selectGuilds = 'SELECT uuid FROM Guild WHERE use_prefix = ($1)';
      const insertNewGuild =
        'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix, use_prefix) VALUES ($1, $2, $3, $4, $5, $6)';
      const updateUsePrefix = 'UPDATE Guild SET use_prefix = ($1) WHERE uuid = ($2)';
      const updateSetPrefix = 'UPDATE Guild SET prefix = ($1) WHERE uuid = ($2)';
      const deleteGuilds = 'DELETE FROM Guild';
      const dropStatus = 'DROP TABLE Status';
      // ----
      // Create Guild Table
      // client.query(createTable);
      // -----
      // Update to not use prefix commands
      // client.query(updateUsePrefix, [true, '889134541615292456'], (err, res) => {
      //   console.log(err);
      //   console.log(res);
      //   client.query('COMMIT', (err) => {
      //     console.log(err);
      //   });
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
      // client.query(selectGuilds, [true], (err, res) => {
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
      const selectAllStatus = 'SELECT * FROM Status';
      const deleteAllStatus = 'DELETE FROM Status';
      client.query(selectAllStatus, (err, res) => {
        console.log(err);
        console.log(res);
        console.log(res.rows);
        done();
      });
      // client.query(dropStatus, (err, res) => {
      //   console.log(err);
      //   console.log(res);
      //   client.query('COMMIT');
      //   done();
      // });
      // client.query(deleteAllStatus, (err, res) => {
      //   console.log(err);
      //   console.log(res);
      //   client.query('COMMIT');
      // });
    });
  });
};

this.runMigration();
