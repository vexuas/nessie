import { insertNewGuild } from '../../services/database';
import { EventModule } from '../events';

export default function ({ nessie }: EventModule) {
  nessie.on('guildCreate', (guild) => {
    try {
      insertNewGuild(guild);
    } catch (e) {
      console.log(e); // Add proper handling
    }
  });
}
