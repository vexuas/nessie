/**
 * File to contain relevant event handlers that nessie needs
 * Moved to its own individual file as housing this inside nessie.js was making it unreadable
 * Granted this isn't much better as it now looks cluttered here than it being there
 * The next good move is to separate each event handler on its own file and have this as the main initialisation
 * But that would be in another time heh
 */
const { guildIDs, token } = require('./config/nessie.json');
const { getBattleRoyalePubs } = require('./adapters');
const { sendMixpanelEvent } = require('./analytics');
const {
  sendHealthLog,
  sendGuildUpdateNotification,
  checkIfInDevelopment,
  sendErrorLog,
} = require('./helpers');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { getApplicationCommands } = require('./commands');
const {
  createGuildTable,
  insertNewGuild,
  removeServerDataFromNessie,
  createStatusTable,
} = require('./database/handler');
const { v4: uuidv4 } = require('uuid');
const {
  cancelStatusStart,
  cancelStatusStop,
  createStatusChannels,
  deleteStatusChannels,
  initialiseStatusScheduler,
  restartStatus,
  cancelStatusRestart,
} = require('./commands/admin/announcement');
const { selectMenuReply } = require('./commands/admin/selectMenu');
const {
  sendConfirmStatusInteraction,
  goBackToGameModeSelection,
  _cancelStatusStart,
  createStatus,
} = require('./commands/maps/status');

const appCommands = getApplicationCommands(); //Get list of application commands

exports.registerEventHandlers = ({ nessie, mixpanel }) => {
  //------
  /**
   * Event handler that fires once when nessie boots up and succesfully logs in
   */
  nessie.once('ready', async () => {
    await registerApplicationCommands(nessie);
    try {
      const testChannel = nessie.channels.cache.get('889212328539725824');
      const logChannel = nessie.channels.cache.get('899620845436141609');
      testChannel && testChannel.send("I'm booting up! (◕ᴗ◕✿)"); //Sends to test bot channel in nessie's canyon
      /**
       * Initialise Database and its tables
       * Will create them if they don't exist
       * See relevant files under database/* for more information
       */
      createGuildTable(nessie.guilds.cache, nessie);
      createStatusTable();
      /**
       * Changes Nessie's activity when the current map has switched over to the next
       * Refer to the setCurrentMapStatus function for more information
       */
      const brPubsData = await getBattleRoyalePubs(); //Get data of br map rotation
      nessie.user.setActivity(brPubsData.current.map); //Set current br map as activity status
      sendHealthLog(brPubsData, logChannel, true); //For logging purpose
      setCurrentMapStatus(brPubsData, logChannel, nessie); //Calls status display function
      const statusScheduler = initialiseStatusScheduler(nessie); //Initialises auto status scheduler
      statusScheduler.start(); //Starts the scheduler
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
   * As of May 22 2022, removed any implementations for this event
   * Discord would be limiting this event for special applications and only be used on a per request basis
   * As nessie doesn't need this, we're deprecating the need of listening to messages and instead using interactions
   * Keeping this in for now until it's officially gone in August
   */
  nessie.on('messageCreate', async (message) => {});

  nessie.on('interactionCreate', async (interaction) => {
    if (!interaction.inGuild()) return; //Only respond in server channels or if it's an actual command

    if (interaction.isCommand()) {
      const { commandName } = interaction;
      await appCommands[commandName].execute({ interaction, nessie, mixpanel });
      /**
       * Send event information to mixpanel for application commands
       * This is for general commands that do not require arguments
       * We can't do this here as we can only get the options within the command execution itself
       * Hence, we have a separate handler for these commands in their own files instead of here
       * TODO: Refactor conditional in the future, probably a better way to check since this isn't scalable
       */
      if (commandName !== 'br' && commandName !== 'arenas' && commandName !== 'control') {
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
    }
    /**
     * Since components are also interactions, any user inputs from it go through this listener too
     * This does prove to be a hassle code readability wise as the handlers for these interactions are now detached from their own files
     * Tried to make it less ugly tho and house the implementations inside functions and call them here
     * Will still have to check the customId for each of the buttons here though
     */
    if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'announcementStart__startButton':
          return createStatusChannels({ interaction, nessie });
        case 'announcementStart__cancelButton':
          return cancelStatusStart({ interaction, nessie });
        case 'announcementStop__stopButton':
          return deleteStatusChannels({ interaction, nessie });
        case 'announcementStop__cancelButton':
          return cancelStatusStop({ interaction, nessie });
        case 'announcementRestart__cancelButton':
          return cancelStatusRestart({ interaction, nessie });
        case 'announcementRestart__allButton':
          return restartStatus({ interaction, nessie, restartId: interaction.customId });
        case 'announcementRestart__allMissingButton':
          return restartStatus({ interaction, nessie, restartId: interaction.customId });
        case 'announcementRestart__brMissingButton':
          return restartStatus({ interaction, nessie, restartId: interaction.customId });
        case 'announcementRestart__arenasMissingButton':
          return restartStatus({ interaction, nessie, restartId: interaction.customId });
        case 'statusStart__backButton':
          return goBackToGameModeSelection({ interaction, nessie });
        case 'statusStart__cancelButton':
          return _cancelStatusStart({ interaction, nessie });
        case 'statusStart__confirmButton':
          return createStatus({ interaction, nessie });
      }
    }
    if (interaction.isSelectMenu()) {
      console.log(interaction);
      switch (interaction.customId) {
        case 'selectMenu__mapOptions':
          return selectMenuReply({ interaction });
        case 'statusStart__gameModeDropdown':
          return sendConfirmStatusInteraction({ interaction, nessie });
      }
    }
  });
  nessie.on('rateLimit', async (data) => {
    const uuid = uuidv4();
    const type = 'Rate Limited';
    const error = {
      message: data
        ? `\n• Timeout: ${data.timeout}ms\n• Limit: ${data.limit}\n• Method: ${data.method}\n• Path: ${data.path}\n• Route: ${data.route}\n• Global: ${data.global}`
        : 'Unexpected rate limit error',
    };
    await sendErrorLog({ nessie, error, type, uuid, ping: true });
  });
};

//TODO: Maybe move these functions in their separate files at some point
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
 * Function to register application commands
 * Application commands are different from regular prefix commands as instead of the bot directly responding to messages, discord would be the one doing it
 * In order to do that, we have to register the bot's application commands to discord first before it can be used
 * Two types of application commands:
 * - Guild Commands
 * - Global Commands
 * Basicailly guild commands can only be used in that server it was registered in
 * While global commands can be used to every server that bot is in
 * Main difference between the two apart from server constraints are that app commands are instantly registered in guilds while global would take up to an hour for changes to appear
 */
const registerApplicationCommands = async (nessie) => {
  const isInDevelopment = checkIfInDevelopment(nessie);
  const publicCommandList = Object.keys(appCommands)
    .map((key) => !appCommands[key].isAdmin && appCommands[key].data)
    .filter((command) => command)
    .map((command) => command.toJSON());
  const adminCommandList = Object.keys(appCommands)
    .map((key) => appCommands[key].isAdmin && appCommands[key].data)
    .filter((command) => command)
    .map((command) => command.toJSON());
  const fullCommandList = Object.keys(appCommands)
    .map((key) => appCommands[key].data)
    .filter((command) => command)
    .map((command) => command.toJSON());

  const rest = new REST({ version: '9' }).setToken(token);

  if (isInDevelopment) {
    //Guild register
    try {
      await rest.put(Routes.applicationGuildCommands('929421200797626388', guildIDs), {
        body: fullCommandList,
      });
      console.log('Successfully registered guild application commands');
    } catch (e) {
      console.log(e);
    }
  } else {
    //Global Register
    //TODO: Maybe create a script one day to delete global commands for test bot
    //TODO: Make fetching of bot id dynamic as it will either use production or testing id
    try {
      await rest.put(Routes.applicationCommands('889135055430111252'), { body: publicCommandList });
      await rest.put(Routes.applicationGuildCommands('889135055430111252', guildIDs), {
        body: adminCommandList,
      });
      console.log('Successfully registered global application commands');
    } catch (e) {
      console.log(e);
    }
  }
};
