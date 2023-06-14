import { Collection, Guild } from 'discord.js';
import { Pool, QueryResult } from 'pg';
const { sendGuildUpdateNotification } = require('../utils/helpers');
const { DATABASE_CONFIG } = require('../config/environment');

const pool = DATABASE_CONFIG ? new Pool(DATABASE_CONFIG) : null;

type GuildRecord = {
  uuid: string;
  name: string;
  member_count: number;
  owner_id: string;
  prefix: string;
  use_prefix: boolean;
};

export async function createGuildTable() {
  if (!pool) return;
  const client = await pool.connect();
  if (client) {
    try {
      await client.query('BEGIN');
      const createGuildTableQuery =
        'CREATE TABLE IF NOT EXISTS Guild(uuid TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, member_count INTEGER NOT NULL, owner_id TEXT NOT NULL, prefix TEXT NOT NULL, use_prefix BOOLEAN NOT NULL DEFAULT TRUE)';
      await client.query(createGuildTableQuery);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.log(error); //TODO: Add error handling
    } finally {
      client.release();
    }
  }
}
export async function getGuilds(): Promise<QueryResult<GuildRecord> | undefined> {
  if (!pool) return;
  const client = await pool.connect();
  if (client) {
    try {
      await client.query('BEGIN');
      const getAllGuildsQuery = 'SELECT * FROM Guild';
      const allGuilds = await client.query(getAllGuildsQuery);
      return allGuilds;
    } catch (error) {
      await client.query('ROLLBACK');
      console.log(error); //TODO: Add error handling
    } finally {
      client.release();
    }
  }
}
export async function populateGuilds(existingGuilds: Collection<string, Guild>) {
  try {
    const guildsInDatabase = await getGuilds();
    existingGuilds.forEach(async (guild) => {
      const isInDatabase =
        guildsInDatabase && guildsInDatabase.rows.some((guildDb) => guildDb.uuid === guild.id);
      if (!isInDatabase) {
      }
    });
  } catch (error) {
    console.log(error); //TODO: Add error handling
  }
}
export async function insertNewGuild(newGuild: Guild) {
  if (!pool) return;
  const client = await pool.connect();
  if (client) {
    try {
      await client.query('BEGIN');
      const insertNewGuildQuery =
        'INSERT INTO Guild (uuid, name, member_count, owner_id, prefix, use_prefix) VALUES ($1, $2, $3, $4, $5, $6)';
      await client.query(insertNewGuildQuery, [
        newGuild.id,
        newGuild.name,
        newGuild.memberCount,
        newGuild.ownerId,
        '$nes-',
        false,
      ]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.log(error); //TODO: Add error handling
    } finally {
      client.release();
    }
  }
}
export async function deleteGuild(existingGuild: Guild) {
  if (!pool) return;
  const client = await pool.connect();
  if (client) {
    try {
      await client.query('BEGIN');
      const deleteGuildQuery = 'DELETE from Guild WHERE uuid = ($1)';
      await client.query(deleteGuildQuery, [existingGuild.id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.log(error); //TODO: Add error handling
    } finally {
      client.release();
    }
  }
}
/**
 * Function to delete all the relevant data in our database when nessie is removed from a server
 * Removes:
 * Guild
 * @param nessie - discord client
 * @param guild - guild in which nessie was kicked in
 */
exports.removeServerDataFromNessie = (nessie, guild) => {
  this.pool.connect((_, client, done) => {
    client.query('BEGIN', () => {
      client.query('DELETE FROM Guild WHERE uuid = ($1)', [`${guild.id}`], (err) => {
        if (err) {
          console.log(err);
        }
        client.query('DELETE FROM Status WHERE guild_id = ($1)', [guild.id.toString()], (err) => {
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
  });
};
/**
 * Creates Status table in our database
 * Straightforward; no additional checks and only creates the table if it does not exist
 * Gets called in the onReady event of Nessie
 * TODO: Maybe document all the necessary columns we need to create a status in notion
 */
exports.createStatusTable = () => {
  this.pool.connect((_, client, done) => {
    client.query('BEGIN', () => {
      client.query(
        'CREATE TABLE IF NOT EXISTS Status(uuid TEXT NOT NULL PRIMARY KEY, guild_id TEXT NOT NULL, category_channel_id TEXT, br_channel_id TEXT, arenas_channel_id TEXT, br_message_id TEXT, arenas_message_id TEXT, br_webhook_id TEXT, arenas_webhook_id TEXT, br_webhook_token TEXT, arenas_webhook_token TEXT, original_channel_id TEXT NOT NULL, game_mode_selected TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL)'
      );
      client.query('COMMIT', () => {
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
  this.pool.connect((_, client, done) => {
    client.query('BEGIN', () => {
      client.query(
        'INSERT INTO Status (uuid, guild_id, category_channel_id, br_channel_id, arenas_channel_id, br_message_id, arenas_message_id, br_webhook_id, arenas_webhook_id, br_webhook_token, arenas_webhook_token, original_channel_id, game_mode_selected, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
        [
          status.uuid,
          status.guildId,
          status.categoryChannelId,
          status.battleRoyaleChannelId,
          status.arenasChannelId,
          status.battleRoyaleMessageId,
          status.arenasMessageId,
          status.battleRoyaleWebhookId,
          status.arenasWebhookId,
          status.battleRoyaleWebhookToken,
          status.arenasWebhookToken,
          status.originalChannelId,
          status.gameModeSelected,
          status.createdBy,
          status.createdAt,
        ],
        (err) => {
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
  this.pool.connect((_, client, done) => {
    client.query('BEGIN', () => {
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
 * Gets all existing status in our database
 * @param onSuccess - function to call when queries are successfully done
 * @param onError - function to call when queries throw an error
 */
exports.getAllStatus = async (onSuccess, onError) => {
  this.pool.connect((_, client, done) => {
    client.query('BEGIN', () => {
      client.query('SELECT * FROM Status', (err, res) => {
        if (err) {
          onError && onError(err.message ? err.message : { message: 'Unexpected Error' });
          return done();
        }
        onSuccess && onSuccess(res.rows.length > 0 ? res.rows : null, client);
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
  this.pool.connect((_, client, done) => {
    client.query('BEGIN', () => {
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
