const { Pool, Client } = require('pg');
const { databaseConfig } = require('../config/database');
const { sendGuildUpdateNotification } = require('../helpers');
const { defaultPrefix } = require('../config/nessie.json');

const pool = new Pool(databaseConfig);

exports.createGuildTable = (guilds, nessie) => {
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
        console.log(guildsInDatabase);
        guilds.forEach((guild) => {
          const isInDatabase = guildsInDatabase.find((guildDb) => guildDb.uuid === guild.id);
          if (!isInDatabase) {
            client.query(
              'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix, use_prefix) VALUES ($1, $2, $3, $4, $5, $6)',
              [guild.id, guild.name, guild.memberCount, guild.ownerId, defaultPrefix, false],
              (err, res) => {
                if (err) {
                  console.log(err);
                }
                sendGuildUpdateNotification(nessie, guild, 'join');
                client.query('COMMIT', (err) => {
                  if (err) {
                    console.log(err);
                  }
                });
              }
            );
          }
        });
        done();
      });
    });
  });
};
/**
 * Function to delete all the relevant data in our database when nessie is removed from a server
 * Removes:
 * Guild
 * @param nessie - discord client
 * @param guild - guild in which nessie was kicked in
 */
exports.removeServerDataFromNessie = (nessie, guild) => {
  pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      client.query('DELETE FROM Guild WHERE uuid = ($1)', [`${guild.id}`], (err) => {
        if (err) {
          console.log(err);
        }
        client.query('COMMIT', (err) => {
          if (err) {
            console.log(err);
          }
          sendGuildUpdateNotification(nessie, guild, 'leave');
          done();
        });
      });
    });
  });
};
