import { Client, Intents } from 'discord.js';
import Mixpanel from 'mixpanel';
import AutoPoster from 'topgg-autoposter';
import { BOT_TOKEN, MIXPANEL_ID, TOP_GG_TOKEN } from './config/environment';
import { registerEventHandlers } from './events/events';
import { isEmpty } from 'lodash';
import { sendErrorLog } from './utils/helpers';

const nessie = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_TYPING],
});

const initialize = async () => {
  try {
    await nessie.login(BOT_TOKEN);
    const mixpanel = MIXPANEL_ID && !isEmpty(MIXPANEL_ID) ? Mixpanel.init(MIXPANEL_ID) : null;
    TOP_GG_TOKEN && !isEmpty(TOP_GG_TOKEN) && AutoPoster(TOP_GG_TOKEN, nessie);
    registerEventHandlers({ nessie, mixpanel });
  } catch (error) {
    sendErrorLog({ error });
  }
};
initialize();
