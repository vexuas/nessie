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
const { token, lochnessMixpanel, nessieMixpanel, topggToken } = require('./config/nessie.json'); //Get config data from config folder
const { checkIfInDevelopment } = require('./src/utils/helpers');
const { AutoPoster } = require('topgg-autoposter');
const { registerEventHandlers } = require('./src/events/events');
let mixpanel;

//----------
/**
 * Initialize nessie to log in and establish a connection to Discord
 * Wrapped in an async function as we want to wait for the promise to end so that our mixpanel instance knows which project to initialize in
 * TODO: Refactor to use environment variables instead
 */
const initialize = async () => {
  await nessie.login(token);
  mixpanel = Mixpanel.init(checkIfInDevelopment(nessie) ? lochnessMixpanel : nessieMixpanel); //Checks if client is initialising as the development bot
  !checkIfInDevelopment(nessie) && AutoPoster(topggToken, nessie); //Check if this is a one time thing per reboot or it actually auto posts when stats change
  registerEventHandlers({ nessie, mixpanel });
};
initialize();
