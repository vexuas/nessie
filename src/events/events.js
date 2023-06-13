/**
 * File to contain relevant event handlers that nessie needs
 * Moved to its own individual file as housing this inside nessie.js was making it unreadable
 * Granted this isn't much better as it now looks cluttered here than it being there
 * The next good move is to separate each event handler on its own file and have this as the main initialisation
 * But that would be in another time heh
 */
const { getBattleRoyalePubs } = require('../services/adapters');
const { sendMixpanelEvent } = require('../services/analytics');
const {
  sendHealthLog,
  sendGuildUpdateNotification,
  sendErrorLog,
  codeBlock,
} = require('../utils/helpers');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { getApplicationCommands } = require('../commands/commands');
const {
  createGuildTable,
  insertNewGuild,
  removeServerDataFromNessie,
  createStatusTable,
} = require('../services/database');
const { v4: uuidv4 } = require('uuid');
const {
  goToConfirmStatus,
  goBackToGameModeSelection,
  _cancelStatusStart,
  createStatus,
  scheduleStatus,
} = require('../commands/maps/status/start');
const { _cancelStatusStop, deleteGuildStatus } = require('../commands/maps/status/stop');
const { ENV, GUILD_ID, BOT_TOKEN } = require('../config/environment');

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
      // const statusScheduler = initialiseStatusScheduler(nessie); //Initialises auto status scheduler
      // statusScheduler.start(); //Starts the scheduler

      const statusSchedule = scheduleStatus(nessie);
      statusSchedule.start();
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
  nessie.on('interactionCreate', async (interaction) => {
    if (!interaction.inGuild()) return; //Only respond in server channels or if it's an actual command

    if (interaction.isCommand()) {
      const { commandName, options } = interaction;
      const usedOption = options.data[0];
      const isArgument = usedOption && usedOption.type === 'STRING';
      const isSubcommand = usedOption && usedOption.type === 'SUB_COMMAND';
      await appCommands[commandName].execute({ interaction, nessie, mixpanel });
      /**
       * Send event information to mixpanel for application commands
       * This is called here so we don't have to repeatadly call them in tn their respective command handlers
       * The sendMixpanelEvent handler is defaulted to send events as commands/subcommands
       * For other interactions, we have to call them in their own handlers
       * TODO: Cleanup analytics code; right now the handler is super smart but sacrifices readability
       */
      sendMixpanelEvent({
        user: interaction.user,
        channel: interaction.channel,
        guild: interaction.guild,
        command: commandName,
        subcommand: isSubcommand ? usedOption.name : null,
        arguments: isArgument ? usedOption.value : null,
        client: mixpanel,
        isApplicationCommand: true,
      });
    }
    /**
     * Since components are also interactions, any user inputs from it go through this listener too
     * This does prove to be a hassle code readability wise as the handlers for these interactions are now detached from their own files
     * Tried to make it less ugly tho and house the implementations inside functions and call them here
     * Will still have to check the customId for each of the buttons here though
     */
    if (interaction.isButton()) {
      /**
       * Fancy handling of when the wrong user tries to use someone else's interactions
       * Fortunately discord has the original interaction attached to the current one's payload which makes this straightforward
       * We'll send the wrong user an ephemeral reply indicating that they can only use their own commands
       */
      if (interaction.user.id !== interaction.message.interaction.user.id) {
        const wrongUserEmbed = {
          description: `Oops looks like that interaction wasn't meant for you! Nessie can only properly interact with your own commands.\n\nTo check what Nessie can do, type ${codeBlock(
            '/help'
          )}!`,
          color: 16711680,
        };
        await interaction.deferReply({ ephemeral: true });
        sendMixpanelEvent({
          user: interaction.user,
          channel: interaction.channel,
          guild: interaction.guild,
          client: mixpanel,
          arguments: interaction.customId,
          customEventName: 'Click wrong user button',
        });
        return interaction.editReply({ embeds: [wrongUserEmbed] });
      }
      switch (interaction.customId) {
        case 'statusStart__backButton':
          return goBackToGameModeSelection({ interaction, nessie, mixpanel });
        case 'statusStart__cancelButton':
          return _cancelStatusStart({ interaction, nessie, mixpanel });
        case 'statusStop__cancelButton':
          return _cancelStatusStop({ interaction, nessie, mixpanel });
        case 'statusStop__stopButton':
          return deleteGuildStatus({ interaction, nessie, mixpanel });
        default:
          if (interaction.customId.includes('statusStart__confirmButton')) {
            return createStatus({ interaction, nessie, mixpanel });
          }
      }
    }
    if (interaction.isSelectMenu()) {
      if (interaction.user.id !== interaction.message.interaction.user.id) {
        const wrongUserEmbed = {
          description: `Oops looks like that interaction wasn't meant for you! Nessie can only properly interact with your own commands.\n\nTo check what Nessie can do, type ${codeBlock(
            '/help'
          )}!`,
          color: 16711680,
        };
        await interaction.deferReply({ ephemeral: true });
        sendMixpanelEvent({
          user: interaction.user,
          channel: interaction.channel,
          guild: interaction.guild,
          client: mixpanel,
          arguments: interaction.customId,
          customEventName: 'Click wrong user select menu',
        });
        return interaction.editReply({ embeds: [wrongUserEmbed] });
      }
      switch (interaction.customId) {
        case 'statusStart__gameModeDropdown':
          return goToConfirmStatus({ interaction, nessie, mixpanel });
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
const registerApplicationCommands = async () => {
  const isInDevelopment = ENV === 'dev';
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

  const rest = new REST({ version: '9' }).setToken(BOT_TOKEN);

  if (isInDevelopment) {
    //Guild register
    try {
      await rest.put(Routes.applicationGuildCommands('929421200797626388', GUILD_ID), {
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
      await rest.put(Routes.applicationGuildCommands('889135055430111252', GUILD_ID), {
        body: adminCommandList,
      });
      console.log('Successfully registered global application commands');
    } catch (e) {
      console.log(e);
    }
  }
};
