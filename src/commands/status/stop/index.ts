import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  inlineCode,
  WebhookClient,
} from 'discord.js';
import { Mixpanel } from 'mixpanel';
import { STATUS_LOG_WEBHOOK_URL } from '../../../config/environment';
import { sendAnalyticsEvent } from '../../../services/analytics';
import { deleteStatus, getStatus } from '../../../services/database';
import {
  checkIfUserHasManageServer,
  checkMissingBotPermissions,
  sendErrorLog,
  sendMissingAllPermissionsError,
  sendMissingBotPermissionsError,
  sendMissingUserPermissionError,
} from '../../../utils/helpers';

/**
 * Handler for when a user initiates the /status stop command
 * Calls the getStatus handler to see for existing status in the guild
 * Passes a success and error callback with the former sending an information embed with context depending on status existence
 * Also, we want to show permissions errors but only if a status exists as we want to block them from interacting with components
 */
export const sendStopInteraction = async ({
  interaction,
  subCommand,
}: {
  interaction: ChatInputCommandInteraction;
  subCommand: string;
}) => {
  const status = await getStatus(interaction.guildId ?? '');
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
  try {
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
        : `There's currently no active automated map status to stop.\n\nTry starting one with ${inlineCode(
            '/status start'
          )}`,
    };
    const row = status
      ? new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('statusStop__cancelButton')
              .setLabel('Cancel')
              .setStyle(ButtonStyle.Secondary)
          )
          .addComponents(
            new ButtonBuilder()
              .setCustomId('statusStop__stopButton')
              .setLabel(`Stop it!`)
              .setStyle(ButtonStyle.Danger)
          )
      : null;
    await interaction.editReply({ components: row ? [row] : [], embeds: [embed] });
  } catch (error) {
    sendErrorLog({ error, interaction, subCommand });
  }
};
/**
 * Handler for when a user clicks the cancel button of /status stop
 * Pretty straightforward; we just edit the initial message with a cancel message similar to the cancel start handler
 */
export const _cancelStatusStop = async ({
  interaction,
  mixpanel,
}: {
  interaction: ButtonInteraction;
  mixpanel?: Mixpanel | null;
}) => {
  const embed = {
    description: 'Cancelled automated map status deletion',
    color: 16711680,
  };
  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embed], components: [] });
  } catch (error) {
    sendErrorLog({ error, interaction, customTitle: 'Status Stop Cancel Error' });
  } finally {
    mixpanel &&
      sendAnalyticsEvent({
        user: interaction.user,
        channel: interaction.inGuild() ? interaction.channel : null,
        guild: interaction.guild,
        client: mixpanel,
        eventName: 'Click status stop cancel button',
      });
  }
};
const sendStatusStopLog = async (interaction: ButtonInteraction) => {
  if (!STATUS_LOG_WEBHOOK_URL) return;
  const statusLogEmbed = {
    title: 'Status Deleted',
    color: 16711680,
    fields: [
      {
        name: 'Guild',
        value: interaction.guild ? interaction.guild.name : '',
      },
    ],
  };
  const statusLogWebhook = new WebhookClient({ url: STATUS_LOG_WEBHOOK_URL });
  await statusLogWebhook.send({ embeds: [statusLogEmbed] });
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
 * TODO: Remove arenas code once we cleanup arenas in our database
 */
export const deleteGuildStatus = async ({
  interaction,
  nessie,
  mixpanel,
}: {
  interaction: ButtonInteraction;
  nessie: Client;
  mixpanel?: Mixpanel | null;
}) => {
  const status = await deleteStatus(interaction.guildId ?? '');
  try {
    await interaction.deferUpdate();
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
      battleRoyaleStatusChannel &&
        interaction.channelId !== battleRoyaleStatusChannel.id &&
        (await interaction.message.edit({ embeds: [embedSuccess], components: [] }));

      //Sends status deletion log after everything is done
      await sendStatusStopLog(interaction);
    }
  } catch (error) {
    sendErrorLog({ error, interaction, customTitle: 'Status Stop Error' });
  } finally {
    mixpanel &&
      sendAnalyticsEvent({
        user: interaction.user,
        channel: interaction.inGuild() ? interaction.channel : null,
        guild: interaction.guild,
        client: mixpanel,
        eventName: 'Click status stop delete button',
      });
  }
};
