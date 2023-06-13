import { removeServerDataFromNessie } from '../../services/database';
import { EventModule } from '../events';

export default function ({ nessie }: EventModule) {
  nessie.on('guildDelete', (guild) => {
    try {
      removeServerDataFromNessie(nessie, guild);
    } catch (e) {
      console.log(e); // Add proper handling
    }
  });
}
