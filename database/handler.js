const { Pool } = require('pg');
const { databaseConfig } = require('../config/database');
const { sendGuildUpdateNotification } = require('../helpers');
const { defaultPrefix } = require('../config/nessie.json');

exports.pool = new Pool(databaseConfig); //Intialise pool to connect to our cloud database; more information https://node-postgres.com/features/pooling
/**
 * Creates Guild table inside the nessie database in digital ocean
 * Gets called in the client.once("ready") hook
 * Seems quite scuffed atm but I'm prioritizing speed over elegance
 * Also doesn't help I only have a day's experience with posgres orz
 * But hey this seems to be working and as far as my manual testing goes, it doesn't seem to be breaking anything and looks as normal as it was in sqlite :shrug:
 * Tho might want to revisit these in the future; definitely need error handling and better readability
 * @param guilds - guilds that nessie is in
 * @param nessie - nessie client
 */
exports.createGuildTable = (guilds, nessie) => {
  // Starts a transaction; similar to sqlite's serialize so we can group all the relevant queries and call them in order
  this.pool.connect((err, client, done) => {
    //Maybe put an error handler here someday
    client.query('BEGIN', (err) => {
      // Creates Guilds Table with the relevant columns if it does not exists
      client.query(
        'CREATE TABLE IF NOT EXISTS Guild(uuid TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, member_count INTEGER NOT NULL, owner_id TEXT NOT NULL, prefix TEXT NOT NULL, use_prefix BOOLEAN NOT NULL DEFAULT TRUE)'
      );
      /**
       * Before we were iterating through each guild of nessie and making a query to the database
       * This doesn't seem like a good idea moving forward as performance will definitely take a hit with bigger guild size
       * To refactor this, we only query once for all the guilds in our database and based on the response
       * - We iterate through each guild nessie is in
       * - For each guild, we will check if it exists in the response
       * - If it doesn't, we insert the relevant guild to the database
       */
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
                  // Permanently saves changes in database; without this changes won't be reflected the next time a connection opens
                  if (err) {
                    console.log(err);
                  }
                });
              }
            );
          }
        });
        done(); //Closes connection with database
      });
    });
  });
};
/**
 * Adds new guild to Guild table
 * @param guild - guild that nessie is newly invited in
 */
exports.insertNewGuild = (guild) => {
  this.pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      client.query(
        'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix, use_prefix) VALUES ($1, $2, $3, $4, $5, $6)',
        [guild.id, guild.name, guild.memberCount, guild.ownerId, defaultPrefix, false],
        (err, res) => {
          if (err) {
            console.log(err);
          }
          client.query('COMMIT', (err) => {
            if (err) {
              console.log(err);
            }
            done();
          });
        }
      );
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
  this.pool.connect((err, client, done) => {
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
/**
 * Updates prefix with the new custom prefix provided by the user
 * This will be deprecated in april but might as well migrate it along with the rest of the queries
 * @param message - discord message object
 * @param newPrefix - new custom prefix
 * @param embed - embed message to send back to user after successfully updating
 */
exports.setCustomPrefix = (message, newPrefix, embed) => {
  this.pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      client.query(
        'UPDATE Guild SET prefix = ($1) WHERE uuid = ($2)',
        [`${newPrefix}`, `${message.guildId}`],
        (err) => {
          if (err) {
            console.log(err);
            return message.channel.send('Oops something went wrong! Try again!'); //Maybe add link to support server here?
          }
          client.query('COMMIT', () => {
            if (err) {
              console.log(err);
            }
            message.channel.send({ embeds: embed });
            done();
          });
        }
      );
    });
  });
};