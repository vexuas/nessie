const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { format } = require('date-fns');
const { getRotationData } = require('../../adapters');
const {
  generatePubsEmbed,
  generateRankedEmbed,
  generateErrorEmbed,
  sendErrorLog,
  codeBlock,
} = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const {
  insertNewStatus,
  getStatus,
  deleteStatus,
  getAllStatus,
} = require('../../database/handler');
const Scheduler = require('../../scheduler');

//----- Status Application Command Replies -----//
/**
 * Handler for when a user initiates the /status help command
 * Calls the getStatus handler to see for existing status in the guild
 * Passes a success and error callback with the former sending an information embed with context depending on status existence
 */
const sendHelpInteraction = async ({ interaction, nessie }) => {
  await getStatus(
    interaction.guildId,
    async (status) => {
      const embedData = {
        title: 'Status | Help',
        description: status
          ? `There's currently an existing automated map status active in:\n• <#${status.pubs_channel_id}>\n• <#${status.ranked_channel_id}>\n\nCreated at ${status.created_at} by ${status.created_by}`
          : 'This command will send automatic updates of Apex Legends Maps in 2 new channels: *apex-pubs* and *apex-ranked*\n\nUpdates occur **every 5 minutes**\n\nRequires:\n• Manage Channel Permissions\n• Send Message Permissions\n• Only Admins can enable automatic status',
        color: 3447003,
      };
      return await interaction.editReply({ embeds: [embedData] });
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Getting Status in Database (Help)';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  );
};
const initialiseStatusScheduler = (nessie) => {
  return new Scheduler('10 */5 * * * *', async () => {
    getAllStatus(
      async (allStatus) => {
        try {
          const rotationData = await getRotationData();
          const statusLogChannel = nessie.channels.cache.get('976863441526595644');
          if (allStatus) {
            allStatus.forEach(async (status) => {
              const pubsChannel = nessie.channels.cache.get(status.pubs_channel_id);
              const rankedChannel = nessie.channels.cache.get(status.ranked_channel_id);
              const pubsMessage = await pubsChannel.messages.fetch(status.pubs_message_id);
              const rankedMessage = await rankedChannel.messages.fetch(status.ranked_message_id);

              const pubsEmbed = generatePubsStatusEmbeds(rotationData);
              const rankedEmbed = generateRankedStatusEmbeds(rotationData);

              await pubsMessage.edit({ embeds: pubsEmbed });
              await rankedMessage.edit({ embeds: rankedEmbed });
              //Figure out rate limiting prevention here
              //Docs say normal requests is 50 per second but idk if this falls into a special route case
              //Probably just take a risk and try to send 40 requests (10 servers) and then add a timeout of 1 second?
            });
          }
          const statusLogEmbed = {
            title: 'Nessie | Auto Map Status Log',
            description: 'Requested data from API and checked database',
            timestamp: Date.now(),
            color: 3066993,
            fields: [
              {
                name: 'Auto Map Status Count:',
                value: allStatus ? `${allStatus.length}` : '0',
                inline: true,
              },
            ],
          };
          await statusLogChannel.send({ embeds: [statusLogEmbed] });
        } catch (error) {
          const uuid = uuidv4();
          const type = 'Status Scheduler (Editing)';
          await sendErrorLog({ nessie, error, type, uuid, ping: true });
        }
      },
      async (error) => {
        const uuid = uuidv4();
        const type = 'Status Scheduler (Database)';
        await sendErrorLog({ nessie, error, type, uuid, ping: true });
      }
    );
  });
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
          return await sendHelpInteraction({ interaction, nessie });
        case 'start':
          return await sendStartInteraction({ interaction, nessie });
        case 'stop':
          return await sendStopInteraction({ interaction, nessie });
      }
    } catch (error) {
      console.log(error);
    }
  },
  initialiseStatusScheduler,
};
