import { sendErrorLog } from '../../utils/helpers';
import { EventModule } from '../events';
import { v4 as uuidV4 } from 'uuid';

export default function ({ nessie }: EventModule) {
  nessie.on('rateLimit', async (data) => {
    const uuid = uuidV4();
    const type = 'Rate Limited';
    const error = {
      message: data
        ? `\n• Timeout: ${data.timeout}ms\n• Limit: ${data.limit}\n• Method: ${data.method}\n• Path: ${data.path}\n• Route: ${data.route}\n• Global: ${data.global}`
        : 'Unexpected rate limit error',
    };
    await sendErrorLog({ nessie, error, type, uuid, ping: true });
  });
}
