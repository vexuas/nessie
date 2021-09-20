const Discord = require('discord.js');
const nessie = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS]});
//https://discord.com/developers/docs/topics/gateway#list-of-intents For list of intents

const { defaultPrefix, token } = require('./config/nessie.json');

nessie.login(token);

nessie.once('ready', async () => {
  try {
    const testChannel = nessie.channels.cache.get('889212328539725824');
    testChannel && testChannel.send("I'm booting up! (◕ᴗ◕✿)");
  } catch(e){
    console.log(e);
  }
})
