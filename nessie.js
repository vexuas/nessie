/**
 * https://discord.com/developers/docs/topics/gateway#list-of-intents For list of intents
 * Newer versions of discordjs requires to list down intents to properly work
 * Basically need to explicitly tell discord which events our bot needs
 **/
const Discord = require('discord.js');
const Mixpanel = require('mixpanel');
const nessie = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING]});
const { defaultPrefix, token, lochnessMixpanel, nessieMixpanel } = require('./config/nessie.json'); //Get config data from config folder
const commands = require('./commands'); //Get list of commands
const { getBattleRoyalePubs } = require('./adapters');
const { sendMixpanelEvent } = require('./analytics');
let mixpanel;

/**
 * In charge of correctly displaying current battle royale pubs rotation in nessie's activity status
 * As the maps have varying durations, needed to figure out a way to dynamically change the timeout after each call
 * Accomplished this by creating a intervalRequest function that has a setTimeout that calls itself as its callback
 * Inside the interval function we can then properly get the current timer and update accordingly
 */
const setCurrentMapStatus = (data) => {
  const fiveSecondsBuffer = 5000;
  let currentTimer = data.current.remainingSecs*1000 + fiveSecondsBuffer;
  const intervalRequest = async () => {
    const updatedBrPubsData = await getBattleRoyalePubs();
    currentTimer = updatedBrPubsData.current.remainingSecs*1000 + fiveSecondsBuffer;
    nessie.user.setActivity(updatedBrPubsData.current.map);
    setTimeout(intervalRequest, currentTimer);
  }
  setTimeout(intervalRequest, currentTimer); //Start initial timer
}
//----------
/**
 * Initialize nessie to log in and establish a connection to Discord
 * Wrapped in an async function as we want to wait for the promise to end so that our mixpanel instance knows which project to initialize in
 */
const initialize = async () => {
  await nessie.login(token);
  mixpanel = Mixpanel.init(nessie.user.id === '889208189017538572' ? lochnessMixpanel : nessieMixpanel); //Checks if client is initialising as the development bot
}
initialize();
//------
/**
 * Event handler that fires once when nessie boots up and succesfully logs in
 */
nessie.once('ready', async () => {
  try {
    const testChannel = nessie.channels.cache.get('889212328539725824');
    testChannel && testChannel.send("I'm booting up! (◕ᴗ◕✿)");
    const brPubsData = await getBattleRoyalePubs();
    nessie.user.setActivity(brPubsData.current.map);
    setCurrentMapStatus(brPubsData);
  } catch(e){
    console.log(e); //Add proper error handling
  }
})
//------
/**
 * Event handler for when a message is sent in a channel that nessie is in
 */
nessie.on('messageCreate', async (message) => {
  if (message.author.bot) return; //Ignore messages made by nessie
  const nessiePrefix = defaultPrefix;

  try {
    /**
     * Nessie checks if messages contains any mentions
     * If it does and if one of the mentions contains nessie's user, returns a message with the current prefix i.e @Nessie
     */
    message.mentions.users.forEach((user) => {
      if(user === nessie.user){
        return message.channel.send('My current prefix is ' + '`' + `${nessiePrefix}` + '`');
      }
    });
    //Ignores messages without a prefix
    if(message.content.startsWith(nessiePrefix)){
      const args = message.content.slice(nessiePrefix.length).split(' ', 1); //takes off prefix and returns first word as an array
      const command = args.shift().toLowerCase(); //gets command as a string from array
      const arguments = message.content.slice(nessiePrefix.length + command.length + 1); //gets arguments if there are any

      //Check if command exists in the command file
      if(commands[command]){
        //If it does check if there are any arguments passed and if the command expects an argument
        if(arguments.length > 0 && !commands[command].hasArguments){
          await message.channel.send("That command doesn't accept arguments （・□・；）"); //Sends error reply if it doesn't
        } else {
          await commands[command].execute({message, arguments, nessie}); //Executes command
          sendMixpanelEvent(message.author, message.channel, message.channel.guild, command, mixpanel, arguments); //Send tracking event to mixpanel
        }
      } else {
        await message.channel.send("I'm not sure what you meant by that! （・□・；）"); //Sends error reply if command doesn't exist
      }
    }
  } catch(e){
    console.log(e);
  }
})
