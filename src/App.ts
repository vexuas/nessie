import { Client, Intents } from 'discord.js';
import Mixpanel from 'mixpanel';
import AutoPoster from 'topgg-autoposter';
import { BOT_TOKEN, MIXPANEL_ID, TOP_GG_TOKEN } from './config/environment';
import { registerEventHandlers } from './events/events';

const nessie = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_TYPING],
});

const initialize = async () => {
  await nessie.login(BOT_TOKEN);
  const mixpanel = MIXPANEL_ID && MIXPANEL_ID.length !== 0 ? Mixpanel.init(MIXPANEL_ID) : null;
  TOP_GG_TOKEN && TOP_GG_TOKEN.length !== 0 && AutoPoster(TOP_GG_TOKEN, nessie);
  registerEventHandlers({ nessie, mixpanel });
};
initialize();
