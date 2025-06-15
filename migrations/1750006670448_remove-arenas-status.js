/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.dropColumns('status', [
    'arenas_channel_id',
    'arenas_message_id',
    'arenas_webhook_id',
    'arenas_webhook_token',
  ]);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.addColumns('status', {
    arenas_channel_id: {
      type: 'text',
      notNull: true,
    },
    arenas_message_id: {
      type: 'text',
      notNull: true,
    },
    arenas_webhook_id: {
      type: 'text',
      notNull: true,
    },
    arenas_webhook_token: {
      type: 'text',
      notNull: true,
    },
  });
};
