const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  generateErrorEmbed,
  sendErrorLog,
  generatePubsEmbed,
  generateRankedEmbed,
  codeBlock,
} = require('../../../helpers');
const { v4: uuidv4 } = require('uuid');
const { MessageActionRow, MessageSelectMenu, MessageButton, WebhookClient } = require('discord.js');
const { getRotationData } = require('../../../adapters');
const { nessieLogo } = require('../../../constants');
const { format } = require('date-fns');
const { insertNewStatus, getStatus, deleteStatus } = require('../../../database/handler');
const { sendHelpInteraction } = require('./help');
const { sendStartInteraction } = require('./start');

/**
 * Handler for when a user initiates the /status stop command
 * Calls the getStatus handler to see for existing status in the guild
 * Passes a success and error callback with the former sending an information embed with context depending on status existence
 */
const sendStopInteraction = async ({ interaction, nessie }) => {
  await getStatus(
    interaction.guildId,
    async (status) => {
      const embed = {
        title: 'Status | Stop',
        color: 3447003,
        description: status
          ? `By confirming below, Nessie will stop all existing map status and **delete**:\n• <#${
              status.category_channel_id
            }>${status.br_channel_id ? `\n• <#${status.br_channel_id}>` : ''}${
              status.arenas_channel_id ? `\n• <#${status.arenas_channel_id}>` : ''
            }\n• Webhooks under each status channel\nThis status was created on ${
              status.created_at
            } by ${
              status.created_by
            }\n\nTo re-enable automated map status after, simply use ${codeBlock(
              '/status start'
            )} again`
          : `There's currently no active automated map status to stop.\n\nTry starting one with ${codeBlock(
              '/status start'
            )}`,
      };
      const row = status
        ? new MessageActionRow()
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
            )
        : null;
      return await interaction.editReply({ components: row ? [row] : [], embeds: [embed] });
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Getting Status in Database (Stop)';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  );
};
/**
 * Handler for when a user clicks the cancel button of /status stop
 * Pretty straightforward; we just edit the initial message with a cancel message similar to the cancel start handler
 */
const _cancelStatusStop = async ({ interaction, nessie }) => {
  const embed = {
    description: 'Cancelled automated map status deletion',
    color: 16711680,
  };
  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embed], components: [] });
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status Stop Cancel';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.editReply({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
/**
 * Handler for stopping the process of map status
 * Gets called when a user clicks the confirm button of the /status stop reply
 * Main steps upon button click:
 * - Edits initial message with a loading state
 * - Calls the deleteStatus handler which returns the status data while also deleting it from the db
 * - Fetches each of the relevant discord channels with the status data
 * - Deletes each of of the discord channels
 * - Edits initial message with a success message
 *
 * We don't need to delete the webhooks as they'll be automatically deleted along with its channels
 */
const deleteGuildStatus = async ({ interaction, nessie }) => {
  await interaction.deferUpdate();
  await deleteStatus(
    interaction.guildId,
    async (status) => {
      try {
        if (status) {
          const embedLoading = {
            description: `Deleting Status Channels...`,
            color: 16776960,
          };
          await interaction.message.edit({ embeds: [embedLoading], components: [] });
          const battleRoyaleStatusChannel =
            status.br_channel_id && (await nessie.channels.fetch(status.br_channel_id));
          const arenasStatusChannel =
            status.arenas_channel_id && (await nessie.channels.fetch(status.arenas_channel_id));
          const categoryStatusChannel =
            status.category_channel_id && (await nessie.channels.fetch(status.category_channel_id));

          battleRoyaleStatusChannel && (await battleRoyaleStatusChannel.delete());
          arenasStatusChannel && (await arenasStatusChannel.delete());
          categoryStatusChannel && (await categoryStatusChannel.delete());

          const embedSuccess = {
            description: `Automatic map status successfully deleted!`,
            color: 3066993,
          };
          await interaction.message.edit({ embeds: [embedSuccess], components: [] });
        }
      } catch (error) {
        const uuid = uuidv4();
        const type = 'Status Stop Button';
        const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
        await interaction.message.edit({ embeds: errorEmbed, components: [] });
        await sendErrorLog({ nessie, error, interaction, type, uuid });
      }
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Getting/Deleting Status in Database (Stop Button)';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.message.edit({ embeds: errorEmbed, components: [] });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  );
};
module.exports = {
  /**
   * Creates Status application command with relevant subcommands
   * Apparently when you create a subcommand under a base command, the base command will no longer be called
   * I.e /status becomes void and only '/status xyz' can be used as commands
   * I'm not sure why Discord did it this way but their explanation is the base command now becomes a folder of sorts
   * Was initially planning to have /status, /status start and /status stop with the former showing the command information
   * Not really a problem anyway since now it's /status about
   *
   * TODO: Check if it's possible to have default permissions when creating commands
   * Alternative is to manaully set it inside the guild settings
   */
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Get your automatic map updates here!')
    .addSubcommand((subCommand) =>
      subCommand
        .setName('help')
        .setDescription('Displays information on setting up automatic map updates')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('start').setDescription('Set up automatic map updates')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('stop').setDescription('Stops existing automatic map updates')
    ),

  async execute({ nessie, interaction, mixpanel }) {
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          return sendHelpInteraction({ interaction, nessie });
        case 'start':
          return sendStartInteraction({ interaction, nessie });
        case 'stop':
          return sendStopInteraction({ interaction, nessie });
      }
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Status Generic';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  },
  _cancelStatusStop,
  deleteGuildStatus,
};
