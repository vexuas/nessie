const { generateErrorEmbed, sendErrorLog, codeBlock } = require('../../../../helpers');
const { v4: uuidv4 } = require('uuid');
const { MessageActionRow, MessageButton } = require('discord.js');
const { getStatus, deleteStatus } = require('../../../../database/handler');
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
            }\n• Webhooks under each status channel\n\nThis status was created at ${
              status.created_at
            } by ${status.created_by}`
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
  _cancelStatusStop,
  sendStopInteraction,
  deleteGuildStatus,
};
