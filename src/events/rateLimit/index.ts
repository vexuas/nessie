import { sendErrorLog } from '../../utils/helpers';
import { EventModule } from '../events';

export default function ({ app }: EventModule) {
  app.on('rateLimit', async (data) => {
    try {
      const error = {
        message: data
          ? `\n• Timeout: ${data.timeout}ms\n• Limit: ${data.limit}\n• Method: ${data.method}\n• Path: ${data.path}\n• Route: ${data.route}\n• Global: ${data.global}`
          : 'Unexpected rate limit error',
      };
      sendErrorLog({ error });
    } catch (error) {
      sendErrorLog({ error });
    }
  });
}
