/**
 * https://discord.com/developers/docs/topics/gateway#list-of-intents For list of intents
 * Newer versions of discordjs requires to list down intents to properly work
 * Basically need to explicitly tell discord which events our bot needs
 **/
const Discord = require('discord.js');
const nessie = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]});

//Get config data from config folder
const { defaultPrefix, token } = require('./config/nessie.json');

nessie.login(token); //Login to discord with bot's token

/**
 * Event handler that fires once when nessie boots up and succesfully logs in
 */
nessie.once('ready', async () => {
  try {
    const testChannel = nessie.channels.cache.get('889212328539725824');
    testChannel && testChannel.send("I'm booting up! (◕ᴗ◕✿)");
  } catch(e){
    console.log(e);
  }
})

nessie.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    if(message.content.startsWith(defaultPrefix)){
      await message.channel.send('hello!');
    }
  } catch(e){
    console.log(e);
  }
})
