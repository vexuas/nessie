import { sendErrorLog } from '../../utils/helpers';
import { EventModule } from '../events';

export default function ({ nessie }: EventModule) {
  nessie.on('rateLimit', async (data) => {
    const error = {
      message: data
        ? `\n• Timeout: ${data.timeout}ms\n• Limit: ${data.limit}\n• Method: ${data.method}\n• Path: ${data.path}\n• Route: ${data.route}\n• Global: ${data.global}`
        : 'Unexpected rate limit error',
    };
    sendErrorLog({ error });
  });
}
