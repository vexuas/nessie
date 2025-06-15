import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns('status', [
    'arenas_channel_id',
    'arenas_message_id',
    'arenas_webhook_id',
    'arenas_webhook_token',
  ]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns('status', {
    arenas_channel_id: {
      type: 'text',
      notNull: false,
    },
    arenas_message_id: {
      type: 'text',
      notNull: false,
    },
    arenas_webhook_id: {
      type: 'text',
      notNull: false,
    },
    arenas_webhook_token: {
      type: 'text',
      notNull: false,
    },
  });
}
