const sqlite = require('sqlite3').verbose();
const { sendGuildUpdateNotification } = require('../helpers');
const { defaultPrefix } = require('../config/nessie.json');

/**
 * Creates Guild table inside the Yagi Database
 * Gets called in the client.once("ready") hook
 * @param database - yagi database
 * @param guilds - guilds that yagi is in
 * @param client - yagi client
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
 * @param guild - guild that yagi is newly invited in
 */
exports.insertNewGuild = (guild) => {
  let database = new sqlite.Database('./database/nessie.db', sqlite.OPEN_READWRITE);
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
    }
  );
};

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
