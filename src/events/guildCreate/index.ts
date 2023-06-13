import { insertNewGuild } from '../../services/database';
import { sendGuildUpdateNotification } from '../../utils/helpers';
import { EventModule } from '../events';

export default function ({ nessie }: EventModule) {
  nessie.on('guildCreate', (guild) => {
    try {
      insertNewGuild(guild);
      sendGuildUpdateNotification(nessie, guild, 'join');
    } catch (e) {
      console.log(e); // Add proper handling
    }
  });
}
