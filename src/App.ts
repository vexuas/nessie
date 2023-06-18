import { Client, GatewayIntentBits } from 'discord.js';
import Mixpanel from 'mixpanel';
import AutoPoster from 'topgg-autoposter';
import { BOT_TOKEN, MIXPANEL_ID, TOP_GG_TOKEN } from './config/environment';
import { registerEventHandlers } from './events/events';
import { isEmpty } from 'lodash';
import { sendErrorLog } from './utils/helpers';

const app = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const initialize = async () => {
  try {
    await app.login(BOT_TOKEN);
    const mixpanel = MIXPANEL_ID && !isEmpty(MIXPANEL_ID) ? Mixpanel.init(MIXPANEL_ID) : null;
    TOP_GG_TOKEN && !isEmpty(TOP_GG_TOKEN) && AutoPoster(TOP_GG_TOKEN, app);
    registerEventHandlers({ app, mixpanel });
  } catch (error) {
    sendErrorLog({ error });
  }
};
initialize();
