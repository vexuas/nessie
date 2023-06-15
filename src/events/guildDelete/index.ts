import { DATABASE_CONFIG, GUILD_NOTIFICATION_WEBHOOK_URL } from '../../config/environment';
import { deleteGuild } from '../../services/database';
import { EventModule } from '../events';
import { isEmpty } from 'lodash';
import { serverNotificationEmbed } from '../../utils/helpers';
import { Guild, WebhookClient } from 'discord.js';
import { nessieLogo } from '../../utils/constants';

export default function ({ nessie }: EventModule) {
  nessie.on('guildDelete', async (guild: Guild) => {
    try {
      DATABASE_CONFIG && (await deleteGuild(guild));
      if (GUILD_NOTIFICATION_WEBHOOK_URL && !isEmpty(GUILD_NOTIFICATION_WEBHOOK_URL)) {
        const embed = await serverNotificationEmbed({ app: nessie, guild, type: 'leave' });
        const notificationWebhook = new WebhookClient({ url: GUILD_NOTIFICATION_WEBHOOK_URL });
        await notificationWebhook.send({
          embeds: [embed],
          username: 'Nessie Server Notification',
          avatarURL: nessieLogo,
        });
      }
    } catch (e) {
      console.log(e); // Add proper handling
    }
  });
}
