import { deleteGuild } from '../../services/database';
import { EventModule } from '../events';

export default function ({ nessie }: EventModule) {
  nessie.on('guildDelete', (guild) => {
    try {
      deleteGuild(guild);
    } catch (e) {
      console.log(e); // Add proper handling
    }
  });
}
