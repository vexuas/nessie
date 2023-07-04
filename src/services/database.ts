import { Collection, Guild } from 'discord.js';
import { Pool, QueryResult } from 'pg';
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
export type StatusRecord = {
  uuid: string;
  guild_id: string;
  category_channel_id: string;
  br_channel_id: string;
  arenas_channel_id: string;
  br_message_id: string;
  arenas_message_id: string;
  br_webhook_id: string;
  arenas_webhook_id: string;
  br_webhook_token: string;
  arenas_webhook_token: string;
  original_channel_id: string;
  game_mode_selected: string;
  created_by: string;
  created_at: string;
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
      const allGuilds: QueryResult<GuildRecord> = await client.query(getAllGuildsQuery);
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
        await insertNewGuild(guild);
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
export async function createStatusTable() {
  if (!pool) return;
  const client = await pool.connect();
  if (client) {
    try {
      await client.query('BEGIN');
      const createStatusTableQuery =
        'CREATE TABLE IF NOT EXISTS Status(uuid TEXT NOT NULL PRIMARY KEY, guild_id TEXT NOT NULL, category_channel_id TEXT, br_channel_id TEXT, arenas_channel_id TEXT, br_message_id TEXT, arenas_message_id TEXT, br_webhook_id TEXT, arenas_webhook_id TEXT, br_webhook_token TEXT, arenas_webhook_token TEXT, original_channel_id TEXT NOT NULL, game_mode_selected TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL)';
      await client.query(createStatusTableQuery);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.log(error); //TODO: Add error handling
    } finally {
      client.release();
    }
  }
}
//TODO: Add typing for status during commands refactor
export async function insertNewStatus(status: any) {
  if (!pool) return;
  const client = await pool.connect();
  if (client) {
    try {
      await client.query('BEGIN');
      const insertNewStatusQuery =
        'INSERT INTO Status (uuid, guild_id, category_channel_id, br_channel_id, arenas_channel_id, br_message_id, arenas_message_id, br_webhook_id, arenas_webhook_id, br_webhook_token, arenas_webhook_token, original_channel_id, game_mode_selected, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)';
      await client.query(insertNewStatusQuery, [
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
export async function getStatus(guildId: string): Promise<StatusRecord | undefined | null> {
  if (!pool) return;
  const client = await pool.connect();
  if (client) {
    try {
      await client.query('BEGIN');
      const getStatusQuery = 'SELECT * FROM Status WHERE guild_id = ($1)';
      const status: QueryResult<StatusRecord> = await client.query(getStatusQuery, [guildId]);
      return status.rows.length > 0 ? status.rows[0] : null;
    } catch (error) {
      await client.query('ROLLBACK');
      console.log(error); //TODO: Add error handling
    } finally {
      client.release();
    }
  }
}
export async function getAllStatus(): Promise<StatusRecord[] | undefined> {
  if (!pool) return;
  const client = await pool.connect();
  if (client) {
    try {
      await client.query('BEGIN');
      const getAllStatusQuery = 'SELECT * FROM Status';
      const allStatus: QueryResult<StatusRecord> = await client.query(getAllStatusQuery);
      return allStatus.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      console.log(error); //TODO: Add error handling
    } finally {
      client.release();
    }
  }
}
export async function deleteStatus(guildId: string): Promise<StatusRecord | undefined | null> {
  if (!pool) return;
  const client = await pool.connect();
  if (client) {
    try {
      await client.query('BEGIN');
      const getStatusQuery = 'SELECT * FROM Status WHERE guild_id = ($1)';
      const status: QueryResult<StatusRecord> = await client.query(getStatusQuery, [guildId]);
      const deleteStatusQuery = 'DELETE FROM Status WHERE guild_id = ($1)';
      status.rows.length > 0 && (await client.query(deleteStatusQuery, [guildId]));
      await client.query('COMMIT');
      return status.rows.length > 0 ? status.rows[0] : null;
    } catch (error) {
      await client.query('ROLLBACK');
      console.log(error); //TODO: Add error handling
    } finally {
      client.release();
    }
  }
}
