const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { getBattleRoyalePubs, getBattleRoyaleRanked, getRotationData } = require('../../adapters');
const {
  generatePubsEmbed,
  generateRankedEmbed,
  generateErrorEmbed,
  sendErrorLog,
} = require('../../helpers');
const { v4: uuidv4 } = require('uuid');

//----- Status Application Command Replies -----//
const sendHelpInteraction = async (interaction) => {
  const embedData = {
    title: 'Status | Help',
    description:
      'This command will send automatic updates of Apex Legends Maps in 2 new channels: *apex-pubs* and *apex-ranked*\n\nUpdates occur **every 15 minutes**\n\nRequires:\n• Manage Channel Permissions\n• Send Message Permissions\n• Only Admins can enable automatic status',
    color: 3447003,
  };
  return await interaction.editReply({ embeds: [embedData] });
};
const sendStartInteraction = async (interaction) => {
  const embedData = {
    title: 'Status | Start',
    color: 3447003,
    description:
      'By confirming below, Nessie will create a new category channel and 2 new text channels for the automated map status:\n• `Apex Map Status`\n• `#apex-pubs`\n• `#apex-ranked`\n\nNessie will use these channels to send automatic updates every 15 minutes',
  };
  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('statusStart__cancelButton')
        .setLabel('Cancel')
        .setStyle('SECONDARY')
    )
    .addComponents(
      new MessageButton()
        .setCustomId('statusStart__startButton')
        .setLabel(`Let's go!`)
        .setStyle('SUCCESS')
    );

  return await interaction.editReply({ components: [row], embeds: [embedData] });
};
const sendStopInteraction = async (interaction) => {
  const embedData = {
    title: 'Status | Stop',
    color: 3447003,
    description:
      'By confirming below, Nessie will stop the existing map status and delete these channels:\n• Apex Map Status\n• #apex-pubs\n• #apex-ranked\n\nTo re-enable the automated map status after, simply use `/status start` again',
  };
  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('statusStop__cancelButton')
        .setLabel('Cancel')
        .setStyle('SECONDARY')
    )
    .addComponents(
      new MessageButton()
        .setCustomId('statusStop__stopButton')
        .setLabel(`Stop it!`)
        .setStyle('DANGER')
    );

  return await interaction.editReply({ components: [row], embeds: [embedData] });
};
//----- Status Functions/Interactions -----//
/**
 * Generates relevant embeds for the status pubs channel
 * Currently only showing battle royale and arenas
 * Might put control in after double checking if it's still up in season 13
 */
const generatePubsStatusEmbeds = (data) => {
  const battleRoyaleEmbed = generatePubsEmbed(data.battle_royale);
  const arenasEmbed = generatePubsEmbed(data.arenas, 'Arenas');
  const informationEmbed = {
    description:
      '**Updates occur every 15 minutes**. This feature is currently in beta! For feedback and bug reports, feel free to drop them in the [support server](https://discord.com/invite/47Ccgz9jA4)!',
    color: 3447003,
    timestamp: Date.now(),
    footer: {
      text: 'Last Update',
    },
  };
  return [informationEmbed, battleRoyaleEmbed, arenasEmbed];
};
/**
 * Generates relevant embeds for the status ranked channel
 * Currently only showing battle royale and arenas
 */
const generateRankedStatusEmbeds = (data) => {
  const battleRoyaleEmbed = generateRankedEmbed(data.ranked);
  const arenasEmbed = generateRankedEmbed(data.arenasRanked, 'Arenas');
  const informationEmbed = {
    description:
      '**Updates occur every 15 minutes**. This feature is currently in beta! For feedback and bug reports, feel free to drop them in the [support server](https://discord.com/invite/47Ccgz9jA4)!',
    color: 3447003,
    timestamp: Date.now(),
    footer: {
      text: 'Last Update',
    },
  };
  return [informationEmbed, battleRoyaleEmbed, arenasEmbed];
};
/**
 * Handler for initialising the process of map status
 * Gets called when a user clicks the confirm button of the /status start reply
 * Main steps upon button click:
 * - Edits initial message with a loading state
 * - Calls the API for the rotation data
 * - Create embeds for each status channel
 * - Creates a category channel and 2 new text channels under it
 * - Sends embeds to respective channels and edits initial message with a success message
 * -
 * TODO: Start the auto-update scheduler
 * TODO: Create tables in database to store status data
 */
const createStatusChannel = async ({ nessie, interaction }) => {
  interaction.deferUpdate();
  try {
    /**
     * Since we defer the update, discord's loading state isn't long enough to last until every promise is done
     * To solve that, we'll edit the initial message with a loading embed
     * This is so that we prevent any extra clicks from users on the buttons
     **/
    const embedLoading = {
      description: `Loading status channels...`,
      color: 16776960,
    };
    await interaction.message.edit({ embeds: [embedLoading], components: [] });

    const rotationData = await getRotationData();
    const statusPubsEmbed = generatePubsStatusEmbeds(rotationData);
    const statusRankedEmbed = generateRankedStatusEmbeds(rotationData);

    // //Creates a category channel for better readability
    const statusCategory = await interaction.guild.channels.create('Apex Legends Map Status', {
      type: 'GUILD_CATEGORY',
    });
    //Creates the status channnel for pubs and ranked
    const statusPubsChannel = await interaction.guild.channels.create('apex-pubs', {
      parent: statusCategory,
    });
    const statusRankedChannel = await interaction.guild.channels.create('apex-ranked', {
      parent: statusCategory,
    });
    await statusPubsChannel.send({ embeds: statusPubsEmbed }); //Sends initial pubs embed in status channel
    await statusRankedChannel.send({ embeds: statusRankedEmbed }); //Sends initial ranked embed in status channel
    const embedSuccess = {
      description: `Created map status at ${statusPubsChannel} and ${statusRankedChannel}`,
      color: 3066993,
    };
    await interaction.message.edit({ embeds: [embedSuccess], components: [] }); //Sends success message in channel where command got instantiated
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status Start Button';
    const errorEmbed = generateErrorEmbed(
      'Oops something went wrong! D: Try again in a bit!',
      uuid
    );
    await interaction.message.edit({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
/**
 * Handler for cancelling the setup of /status start
 * Gets called when a user clicks the cancel button of the /status start reply
 * Pretty straightforward; we just edit the initial message with a cancel message
 */
const cancelStatusStart = async ({ nessie, interaction }) => {
  interaction.deferUpdate();
  try {
    const embedSuccess = {
      description: 'Cancelled automated map status setup',
      color: 16711680,
    };
    await interaction.message.edit({ embeds: [embedSuccess], components: [] });
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status Cancel Button';
    const errorEmbed = generateErrorEmbed(
      'Oops something went wrong! D: Try again in a bit!',
      uuid
    );
    await interaction.message.edit({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
module.exports = {
  /**
   * Creates Status application command with relevant subcommands
   * Apparently when you create a subcommand under a base command, the base command will no longer be called
   * I.e /status becomes void and only '/status xyz' can be used as commands
   * I'm not sure why Discord did it this way but their explanation is the base command now becomes a folder of sorts
   * Was initially planning to have /status, /status start and /status stop with the former showing the command information
   * Not really a problem anyway since now it's /status help
   */
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Creates an automated channel to show map status')
    .addSubcommand((subCommand) =>
      subCommand.setName('help').setDescription('Displays information about automatic map status')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('start').setDescription('Starts the automated map status')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('stop').setDescription('Stops an existing automated status')
    ),
  /**
   * Send correct reply based on the user's subcommand input
   * Since we're opting to use button components, the actual status implementation can't be placed here when an application command is called
   * This is because buttons are also interactions similar to app commands (component interactions)
   * Upon clicking a button, a new interaction is retrieved by the interactionCreate listener and would have to be treated there
   * It's honestly going to be a maze trying to link things together here but it's the price of being trailblazers I guess
   */
  async execute({ nessie, interaction, mixpanel }) {
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          return await sendHelpInteraction(interaction);
        case 'start':
          return await sendStartInteraction(interaction);
        case 'stop':
          return await sendStopInteraction(interaction);
      }
    } catch (error) {
      console.log(error);
    }
  },
  createStatusChannel,
  cancelStatusStart,
};
