/**
 * https://discord.com/developers/docs/topics/gateway#list-of-intents For list of intents
 * Newer versions of discordjs requires to list down intents to properly work
 * Basically need to explicitly tell discord which events our bot needs
 **/
const Discord = require('discord.js');
const Mixpanel = require('mixpanel');
const nessie = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
  ],
});
const { AutoPoster } = require('topgg-autoposter');
const { registerEventHandlers } = require('./events/events');
const { MIXPANEL_ID, TOP_GG_TOKEN, BOT_TOKEN } = require('./config/environment');

//----------
/**
 * Initialize nessie to log in and establish a connection to Discord
 * Wrapped in an async function as we want to wait for the promise to end so that our mixpanel instance knows which project to initialize in
 * TODO: Refactor to use environment variables instead
 */
const initialize = async () => {
  await nessie.login(BOT_TOKEN);
  const mixpanel = Mixpanel.init(MIXPANEL_ID);
  TOP_GG_TOKEN && TOP_GG_TOKEN.length !== 0 && AutoPoster(TOP_GG_TOKEN, nessie);
  registerEventHandlers({ nessie, mixpanel });
};
initialize();
