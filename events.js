/**
 * File to contain relevant event handlers that nessie needs
 * Moved to its own individual file as housing this inside nessie.js was making it unreadable
 * Granted this isn't much better as it now looks cluttered here than it being there
 * The next good move is to separate each event handler on its own file and have this as the main initialisation
 * But that would be in another time heh
 */
const sqlite = require('sqlite3').verbose();
const { guildIDs, token } = require('./config/nessie.json');
const { getBattleRoyalePubs } = require('./adapters');
const { sendMixpanelEvent } = require('./analytics');
const { sendHealthLog, sendGuildUpdateNotification, codeBlock } = require('./helpers');
const {
  createGuildTable,
  insertNewGuild,
  migrateToUseApplicationCommands,
} = require('./database/guild-db');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { getPrefixCommands, getApplicationCommands } = require('./commands');

const commands = getPrefixCommands(); //Get list of commands
const appCommands = getApplicationCommands(); //Get list of application commands

exports.registerEventHandlers = ({ nessie, mixpanel }) => {
  //------
  /**
   * Event handler that fires once when nessie boots up and succesfully logs in
   */
  nessie.once('ready', async () => {
    await registerApplicationCommands();
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
      migrateToUseApplicationCommands(nessieDatabase);
      /**
       * Changes Nessie's activity when the current map has switched over to the next
       * Refer to the setCurrentMapStatus function for more information
       */
      const brPubsData = await getBattleRoyalePubs(); //Get data of br map rotation
      nessie.user.setActivity(brPubsData.current.map); //Set current br map as activity status
      sendHealthLog(brPubsData, logChannel, true); //For logging purpose
      setCurrentMapStatus(brPubsData, logChannel, nessie); //Calls status display function
    } catch (e) {
      console.log(e); //Add proper error handling
    }
  });
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
    } catch (e) {
      console.log(e); // Add proper handling
    }
  });
  nessie.on('guildDelete', (guild) => {
    try {
      removeServerDataFromNessie(nessie, guild);
    } catch (e) {
      console.log(e); // Add proper handling
    }
  });
  //------
  /**
   * Event handler for when a message is sent in a channel that nessie is in
   */
  nessie.on('messageCreate', async (message) => {
    if (message.author.bot) return; //Ignore messages made by nessie
    let database = new sqlite.Database('./database/nessie.db', sqlite.OPEN_READWRITE);
    /**
     * Opens the nessie database and finds the guild data where the message was used
     * This is primarily to know the current prefix of the guild; important when users are using a custom prefix
     */
    database.get(`SELECT * FROM Guild WHERE uuid = ${message.guildId}`, async (error, row) => {
      if (error) {
        console.log(error);
      }
      if (row.use_prefix === 0) return;
      const nessiePrefix = row.prefix;

      //Refactor this into its own function and pass as a callback for better readability in the future
      try {
        /**
         * Nessie checks if messages contains any mentions
         * If it does and if one of the mentions contains nessie's user, returns a message with the current prefix i.e @Nessie
         */
        message.mentions.users.forEach((user) => {
          if (user === nessie.user) {
            return message.channel.send(
              'My current prefix is ' +
                '`' +
                `${nessiePrefix}` +
                '`' +
                '\nTo set a new custom prefix, type ' +
                ` ${codeBlock(`${nessiePrefix}setprefix`)}`
            );
          }
        });
        //Ignores messages without a prefix
        if (message.content.startsWith(nessiePrefix)) {
          const args = message.content.slice(nessiePrefix.length).split(' ', 1); //takes off prefix and returns first word as an array
          const command = args.shift().toLowerCase(); //gets command as a string from array
          const arguments = message.content.slice(nessiePrefix.length + command.length + 1); //gets arguments if there are any

          //Check if command exists in the command file
          if (commands[command]) {
            //If it does check if there are any arguments passed and if the command expects an argument
            if (arguments.length > 0 && !commands[command].hasArguments) {
              await message.channel.send("That command doesn't accept arguments （・□・；）"); //Sends error reply if it doesn't
            } else {
              await commands[command].execute({ message, arguments, nessie, nessiePrefix }); //Executes command
              sendMixpanelEvent(
                message.author,
                message.channel,
                message.channel.guild,
                command,
                mixpanel,
                arguments
              ); //Send tracking event to mixpanel
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
  });

  nessie.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    await appCommands[commandName].execute({ interaction, nessie, mixpanel });
    if (commandName !== 'br' && commandName !== 'arenas') {
      sendMixpanelEvent(
        interaction.user,
        interaction.channel,
        interaction.guild,
        commandName,
        mixpanel,
        null,
        true
      );
    }
  });
};

//TODO: Maybe move these functions in their separate files at some point

//Creates Nessie Database under database folder
const createNessieDatabase = () => {
  let db = new sqlite.Database('./database/nessie.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
  return db;
};
/**
 * In charge of correctly displaying current battle royale pubs rotation in nessie's activity status
 * As the maps have varying durations, needed to figure out a way to dynamically change the timeout after each call
 * Accomplished this by creating a intervalRequest function that has a setTimeout that calls itself as its callback
 * Inside the interval function we can then properly get the current timer and update accordingly
 */
const setCurrentMapStatus = (data, channel, nessie) => {
  const fiveSecondsBuffer = 5000;
  let currentBrPubsData = data;
  let currentTimer = data.current.remainingSecs * 1000 + fiveSecondsBuffer;
  const intervalRequest = async () => {
    try {
      const updatedBrPubsData = await getBattleRoyalePubs();
      /**
       * Checks to see if the data taken from API is accurate
       * Was brought to my attention that the status was displaying the wrong map at one point
       * Not sure why this is happening so just adding a notification when this happens again
       * Don't really want to add extra code for now, if it happens again then i'll fix it
       */
      const isAccurate = currentBrPubsData.next.code === updatedBrPubsData.current.code;
      currentBrPubsData = updatedBrPubsData;
      currentTimer = updatedBrPubsData.current.remainingSecs * 1000 + fiveSecondsBuffer;
      nessie.user.setActivity(updatedBrPubsData.current.map);
      sendHealthLog(updatedBrPubsData, channel, isAccurate);
      setTimeout(intervalRequest, currentTimer);
    } catch (e) {
      console.log(e);
      channel.send('<@183444648360935424> WHOOPS SOMETHING WENT WRONG');
    }
  };
  setTimeout(intervalRequest, currentTimer); //Start initial timer
};
/**
 * Function to delete all the relevant data in our database when nessie is removed from a server
 * Removes:
 * Guild
 * More stuff here when auto notifications gets developed
 * @param guild - guild in which nessie was kicked in
 */
const removeServerDataFromNessie = (nessie, guild) => {
  let database = new sqlite.Database(
    './database/nessie.db',
    sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE
  );
  database.serialize(() => {
    database.run(`DELETE FROM Guild WHERE uuid = "${guild.id}"`);
    sendGuildUpdateNotification(nessie, guild, 'leave');
  });
};
/**
 * Function to register application commands
 * Application commands are different from regular prefix commands as instead of the bot directly responding to messages, discord would be the one doing it
 * In order to do that, we have to register the bot's application commands to discord first before it can be used
 * Two types of application commands:
 * - Guild Commands
 * - Global Commands
 * Basicailly guild commands can only be used in that server it was registered in
 * While global commands can be used to every server that bot is in
 * Main difference between the two apart from server constraints are that app commands are instantly registered in guilds while global would take up to an hour for changes to appear
 * TODO: Add handler for global register, below only handles guilds
 */
const registerApplicationCommands = async () => {
  const appCommandList = Object.keys(appCommands)
    .map((key) => appCommands[key].data)
    .filter((command) => command)
    .map((command) => command.toJSON());

  const rest = new REST({ version: '9' }).setToken(token);
  try {
    await rest.put(Routes.applicationGuildCommands('929421200797626388', guildIDs), {
      body: appCommandList,
    });
    console.log('Successfully registered application commands');
  } catch (e) {
    console.log(e);
  }
};
