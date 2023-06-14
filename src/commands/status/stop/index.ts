import { MessageActionRow, MessageButton } from 'discord.js';
import { deleteStatus, getStatus } from '../../../services/database';
import {
  checkIfUserHasManageServer,
  checkMissingBotPermissions,
  codeBlock,
  generateErrorEmbed,
  sendErrorLog,
  sendMissingAllPermissionsError,
  sendMissingBotPermissionsError,
  sendMissingUserPermissionError,
} from '../../../utils/helpers';
import { v4 as uuidV4 } from 'uuid';

/**
 * Handler for when a user initiates the /status stop command
 * Calls the getStatus handler to see for existing status in the guild
 * Passes a success and error callback with the former sending an information embed with context depending on status existence
 * Also, we want to show permissions errors but only if a status exists as we want to block them from interacting with components
 */
export const sendStopInteraction = async ({ interaction }: any) => {
  const status = await getStatus(interaction.guildId);
  const { hasMissingPermissions } = checkMissingBotPermissions(interaction);
  const isManageServerUser = checkIfUserHasManageServer(interaction);
  if (status) {
    if (hasMissingPermissions && !isManageServerUser) {
      return sendMissingAllPermissionsError({ interaction, title: 'Status | Stop' });
    } else {
      if (hasMissingPermissions)
        return sendMissingBotPermissionsError({ interaction, title: 'Status | Stop' });
      if (!isManageServerUser)
        return sendMissingUserPermissionError({ interaction, title: 'Status | Stop' });
    }
  }
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
};
/**
 * Handler for when a user clicks the cancel button of /status stop
 * Pretty straightforward; we just edit the initial message with a cancel message similar to the cancel start handler
 */
export const _cancelStatusStop = async ({ interaction, app }: any) => {
  const embed = {
    description: 'Cancelled automated map status deletion',
    color: 16711680,
  };
  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embed], components: [] });
  } catch (error) {
    const uuid = uuidV4();
    const type = 'Status Stop Cancel';
    const errorEmbed = await generateErrorEmbed(error, uuid, app);
    await interaction.editReply({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie: app, error, interaction, type, uuid });
  } finally {
    // sendMixpanelEvent({
    //   user: interaction.user,
    //   channel: interaction.channel,
    //   guild: interaction.guild,
    //   client: mixpanel,
    //   customEventName: 'Click status stop cancel button',
    // });
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
export const deleteGuildStatus = async ({ interaction, app }: any) => {
  const status = await deleteStatus(interaction.guildId);
  try {
    await interaction.deferUpdate();
    if (status) {
      const embedLoading = {
        description: `Deleting Status Channels...`,
        color: 16776960,
      };
      await interaction.message.edit({ embeds: [embedLoading], components: [] });
      const battleRoyaleStatusChannel =
        status.br_channel_id && (await app.channels.fetch(status.br_channel_id));
      const arenasStatusChannel =
        status.arenas_channel_id && (await app.channels.fetch(status.arenas_channel_id));
      const categoryStatusChannel =
        status.category_channel_id && (await app.channels.fetch(status.category_channel_id));

      battleRoyaleStatusChannel && (await battleRoyaleStatusChannel.delete());
      arenasStatusChannel && (await arenasStatusChannel.delete());
      categoryStatusChannel && (await categoryStatusChannel.delete());

      const embedSuccess = {
        description: `Automatic map status successfully deleted!`,
        color: 3066993,
      };
      await interaction.message.edit({ embeds: [embedSuccess], components: [] });
      //Sends status deletion log after everything is done
      const statusLogChannel = app.channels.cache.get('976863441526595644');
      const statusLogEmbed = {
        title: 'Status Deleted',
        color: 16711680,
        fields: [
          {
            name: 'Guild',
            value: interaction.guild.name,
          },
        ],
      };
      await statusLogChannel.send({ embeds: [statusLogEmbed] });
    }
  } catch (error) {
    const uuid = uuidV4();
    const type = 'Status Stop Button';
    const errorEmbed = await generateErrorEmbed(error, uuid, app);
    await interaction.message.edit({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie: app, error, interaction, type, uuid });
  } finally {
    // sendMixpanelEvent({
    //   user: interaction.user,
    //   channel: interaction.channel,
    //   guild: interaction.guild,
    //   client: mixpanel,
    //   customEventName: 'Click status stop delete button',
    // });
  }
};
