import { insertNewGuild } from '../../services/database';
import { EventModule } from '../events';
import { isEmpty } from 'lodash';
import { Guild, WebhookClient } from 'discord.js';
import { DATABASE_CONFIG, GUILD_NOTIFICATION_WEBHOOK_URL } from '../../config/environment';
import { sendErrorLog, serverNotificationEmbed } from '../../utils/helpers';
import { nessieLogo } from '../../utils/constants';

export default function ({ app }: EventModule) {
  app.on('guildCreate', async (guild: Guild) => {
    try {
      DATABASE_CONFIG && (await insertNewGuild(guild));
      if (GUILD_NOTIFICATION_WEBHOOK_URL && !isEmpty(GUILD_NOTIFICATION_WEBHOOK_URL)) {
        const embed = await serverNotificationEmbed({ app, guild, type: 'join' });
        const notificationWebhook = new WebhookClient({ url: GUILD_NOTIFICATION_WEBHOOK_URL });
        await notificationWebhook.send({
          embeds: [embed],
          username: 'Nessie Server Notification',
          avatarURL: nessieLogo,
        });
      }
    } catch (error) {
      sendErrorLog({ error });
    }
  });
}
