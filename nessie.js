/**
 * https://discord.com/developers/docs/topics/gateway#list-of-intents For list of intents
 * Newer versions of discordjs requires to list down intents to properly work
 * Basically need to explicitly tell discord which events our bot needs
 **/
const Discord = require('discord.js');
const Mixpanel = require('mixpanel');
const sqlite = require('sqlite3').verbose();
const nessie = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING]});
const { defaultPrefix, token, lochnessMixpanel, nessieMixpanel } = require('./config/nessie.json'); //Get config data from config folder
const commands = require('./commands'); //Get list of commands
const { getBattleRoyalePubs } = require('./adapters');
const { sendMixpanelEvent } = require('./analytics');
const { sendHealthLog, sendGuildUpdateNotification } = require('./helpers');
const { createGuildTable, insertNewGuild } = require('./database/guild-db');
let mixpanel;

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
    const logChannel = nessie.channels.cache.get('899620845436141609');
    testChannel && testChannel.send("I'm booting up! (◕ᴗ◕✿)"); //Sends to test bot channel in nessie's canyon
    /**
     * Initialise Database and its tables
     * Will create them if they don't exist
     * See relevant files under database/* for more information
     */ 
    const nessieDatabase = createNessieDatabase();
    createGuildTable(nessieDatabase, nessie.guilds.cache, nessie);
    /**
     * Changes Nessie's activity when the current map has switched over to the next
     * Refer to the setCurrentMapStatus function for more information
     */
    const brPubsData = await getBattleRoyalePubs(); //Get data of br map rotation
    nessie.user.setActivity(brPubsData.current.map); //Set current br map as activity status
    sendHealthLog(brPubsData, logChannel, true); //For logging purpose
    setCurrentMapStatus(brPubsData, logChannel); //Calls status display function
  } catch(e){
    console.log(e); //Add proper error handling
  }
})
//------
/**
 * Event handlers for when nessie is invited to a new server and when he is kicked. Will be opting out of guild update as I don't really need to do anything with that
 * Sends notification to channel in Nessie's Canyon
 * guildCreate - called when Nessie is invited to a server
 * guildDelete - called when Nessie is kicked from server
 * More information about each function in their relevant database files
 */
 nessie.on('guildCreate', (guild) => {
  try {
    insertNewGuild(guild);
    sendGuildUpdateNotification(nessie, guild, 'join');
  } catch(e){
    console.log(e); // Add proper handling
  }
});
nessie.on('guildDelete', (guild) => {
  try {
    removeServerDataFromNessie(guild);
  } catch(e){
    console.log(e); // Add proper handling
  }
});
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
      }
    }
  } catch(e){
    console.log(e);
  }
})
//TODO: Maybe move these functions in their separate files at some point

//Creates Nessie Database under database folder
const createNessieDatabase = () => {
  let db = new sqlite.Database('./database/nessie.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
  return db;
}
/**
 * In charge of correctly displaying current battle royale pubs rotation in nessie's activity status
 * As the maps have varying durations, needed to figure out a way to dynamically change the timeout after each call
 * Accomplished this by creating a intervalRequest function that has a setTimeout that calls itself as its callback
 * Inside the interval function we can then properly get the current timer and update accordingly
 */
 const setCurrentMapStatus = (data, channel) => {
  const fiveSecondsBuffer = 5000;
  let currentTimer = data.current.remainingSecs*1000 + fiveSecondsBuffer;
  const intervalRequest = async () => {
    const updatedBrPubsData = await getBattleRoyalePubs();
    /**
     * Checks to see if the data taken from API is accurate
     * Was brought to my attention that the status was displaying the wrong map at one point
     * Not sure why this is happening so just adding a notification when this happens again
     * Don't really want to add extra code for now, if it happens again then i'll fix it
     */
    const isAccurate = data.next.code === updatedBrPubsData.current.code; 
    currentTimer = updatedBrPubsData.current.remainingSecs*1000 + fiveSecondsBuffer;
    nessie.user.setActivity(updatedBrPubsData.current.map);
    sendHealthLog(updatedBrPubsData, channel, isAccurate);
    setTimeout(intervalRequest, currentTimer);
  }
  setTimeout(intervalRequest, currentTimer); //Start initial timer
}
/**
 * Function to delete all the relevant data in our database when yagi is removed from a server
 * Removes:
 * Guild
 * More stuff here when auto notifications gets developed
 * @param guild - guild in which nessie was kicked in
 */
 const removeServerDataFromNessie = (guild) => {
  let database = new sqlite.Database('./database/nessie.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
  database.serialize(() => {
    database.run(`DELETE FROM Guild WHERE uuid = "${guild.id}"`);
    sendGuildUpdateNotification(nessie, guild, 'leave');
  })
}
