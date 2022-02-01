const sqlite = require('sqlite3').verbose();
const { sendGuildUpdateNotification } = require('../helpers');
const { defaultPrefix } = require('../config/nessie.json');

/**
 * Creates Guild table inside the Nessie Database
 * Gets called in the client.once("ready") hook
 * @param database - nessie database
 * @param guilds - guilds that nessie is in
 * @param client - nessie client
 */
exports.createGuildTable = (database, guilds, client) => {
  //Wrapped in a serialize to ensure that each method is called in order which its initialised
  database.serialize(() => {
    //Creates Guild Table with the relevant columns if it does not exist
    database.run(
      'CREATE TABLE IF NOT EXISTS Guild(uuid TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, member_count INTEGER NOT NULL, owner_id TEXT NOT NULL, prefix TEXT NOT NULL)'
    );

    //Populate Guild Table with existing guilds
    guilds.forEach((guild) => {
      database.get(`SELECT * FROM Guild WHERE uuid = ${guild.id}`, (error, row) => {
        if (error) {
          console.log(error);
        }
        //Only runs statement and insert into guild table if the guild hasn't been created yet
        if (!row) {
          database.run(
            'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix) VALUES ($uuid, $name, $member_count, $owner_id, $prefix)',
            {
              $uuid: guild.id,
              $name: guild.name,
              $member_count: guild.memberCount,
              $owner_id: guild.ownerId,
              $prefix: defaultPrefix,
            },
            (err) => {
              if (err) {
                console.log(err);
              }
              sendGuildUpdateNotification(client, guild, 'join');
            }
          );
        }
      });
    });
  });
};
/**
 * Adds new guild to Guild table
 * @param guild - guild that nessie is newly invited in
 */
exports.insertNewGuild = (guild) => {
  let database = new sqlite.Database('./database/nessie.db', sqlite.OPEN_READWRITE);
  database.run(
    'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix, use_prefix) VALUES ($uuid, $name, $member_count, $owner_id, $prefix, $use_prefix)',
    {
      $uuid: guild.id,
      $name: guild.name,
      $member_count: guild.memberCount,
      $owner_id: guild.ownerId,
      $prefix: defaultPrefix,
      $use_prefix: false,
    },
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );
};
/**
 * Script to migrate existing database table to have a new use_prefix column
 * This is so the transition of using application commands for users is easier
 * Guilds that joined after v1.0.0 will only be able to use application commands
 * While existing guilds prior to that will be able to use prefix commands and app commands; until april 29 that is
 * To be able to distinguish between the two, this script will create a new table with a new use_prefix column based on the data from existing guilds
 * Then by using the use_prefix value, we'll be able to constrain guilds
 * TODO: Since this is a one-time use, probably best to remove this after v1.0.0 is deployed
 * @param database - nessie database
 */
exports.migrateToUseApplicationCommands = (database) => {
  database.get(
    'SELECT name FROM sqlite_master WHERE type="table" AND name="OldGuild"',
    (error, row) => {
      if (!row) {
        database.serialize(() => {
          database.run('ALTER TABLE Guild RENAME TO OldGuild');
          database.run(
            'CREATE TABLE Guild(uuid TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, member_count INTEGER NOT NULL, owner_id TEXT NOT NULL, prefix TEXT NOT NULL, use_prefix BOOLEAN NOT NULL DEFAULT TRUE)'
          );
          database.run(
            'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix) SELECT uuid, name, member_count, owner_id, prefix FROM OldGuild'
          );
        });
      }
    }
  );
};
