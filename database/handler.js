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
 * Creates Status table in our database
 * Straightforward; no additional checks and only creates the table if it does not exist
 * Gets called in the onReady event of Nessie
 */
exports.createStatusTable = () => {
  this.pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      client.query(
        'CREATE TABLE IF NOT EXISTS Status(uuid TEXT NOT NULL PRIMARY KEY, guild_id TEXT NOT NULL, category_channel_id TEXT NOT NULL, pubs_channel_id TEXT NOT NULL, ranked_channel_id TEXT NOT NULL, pubs_message_id TEXT NOT NULL, ranked_message_id TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL)'
      );
      client.query('COMMIT', (err) => {
        done();
      });
    });
  });
};
/**
 * Inserts new status in our database
 * Takes in a status object with all the relevant data for scheduler usage
 * Was feeling intuitive so added callback functions for both success and error
 * @param status - new status data object
 * @param onSuccess - function to call when queries are successfully done
 * @param onError - function to call when queries throw an error
 */
exports.insertNewStatus = async (status, onSuccess, onError) => {
  this.pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      client.query(
        'INSERT INTO Status (uuid, guild_id, category_channel_id, pubs_channel_id, ranked_channel_id, pubs_message_id, ranked_message_id, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          status.uuid,
          status.guildId,
          status.categoryChannelId,
          status.pubsChannelId,
          status.rankedChannelId,
          status.pubsMessageId,
          status.rankedMessageId,
          status.createdBy,
          status.createdAt,
        ],
        (err, res) => {
          if (err) {
            onError && onError(err.message ? err.message : { message: 'Unexpected Error' });
            return done();
          }
          client.query('COMMIT', (err) => {
            if (err) {
              onError && onError(err.message ? err.message : { message: 'Unexpected Error' });
              return done();
            }
            onSuccess && onSuccess();
            done();
          });
        }
      );
    });
  });
};
/**
 * Gets an existing status in our database
 * Takes in the guild id of the interaction to be able to query correctly
 * @param guildId - guild id of the interaction
 * @param onSuccess - function to call when queries are successfully done
 * @param onError - function to call when queries throw an error
 */
exports.getStatus = async (guildId, onSuccess, onError) => {
  this.pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      client.query('SELECT * FROM Status WHERE guild_id = ($1)', [guildId], (err, res) => {
        if (err) {
          onError && onError(err.message ? err.message : { message: 'Unexpected Error' });
          return done();
        }
        onSuccess && onSuccess(res.rows.length > 0 ? res.rows[0] : null);
        done();
      });
    });
  });
};
/**
 * Deletes an existing status in our database
 * To do this, we need to get the status tied to the guild first
 * This is important as we would need the relevant channel ids to be able to delete those channels in discord
 * Was initially thinking of adding an onGet callback; we delete the discord channels after we query the data
 * Had troubles in making it work tho as it was firing it at the same time as the delete queries
 * Probably doing something wrong but I've opted to just deleting the channels after we delete the status from our database
 * Prayers to discord's API to not go down when this is happening :prayge:
 * @param guildId - guild id of the interaction
 * @param onSuccess - function to call when queries are successfully done
 * @param onError - function to call when queries throws an error
 */
exports.deleteStatus = async (guildId, onSuccess, onError) => {
  this.pool.connect((err, client, done) => {
    client.query('BEGIN', (err) => {
      client.query('SELECT * FROM Status WHERE guild_id = ($1)', [guildId], (err, res) => {
        if (err) {
          //Returning on done to close the connecting to the db; will really need to figure out a better way for error handling here
          onError && onError(err.message ? err.message : { message: 'Unexpected Error' });
          return done();
        }

        client.query('DELETE FROM Status WHERE guild_id = ($1)', [guildId], (err) => {
          if (err) {
            onError && onError(err.message ? err.message : { message: 'Unexpected Error' });
            return done();
          }
          client.query('COMMIT', (err) => {
            if (err) {
              onError && onError(err.message ? err.message : { message: 'Unexpected Error' });
              return done();
            }
            onSuccess && onSuccess(res.rows.length > 0 ? res.rows[0] : null);
            done();
          });
        });
      });
    });
  });
};
