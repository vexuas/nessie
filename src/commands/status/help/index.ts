import {
  ActionRowBuilder,
  APIEmbed,
  bold,
  ChatInputCommandInteraction,
  inlineCode,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { isEmpty } from 'lodash';
import { Mixpanel } from 'mixpanel';
import { sendAnalyticsEvent } from '../../../services/analytics';
import {
  checkIfUserHasManageServer,
  checkMissingBotPermissions,
  sendErrorLog,
} from '../../../utils/helpers';

const informationDescription = `This command will send automatic updates of Apex Legends Map Rotations. Currently Nessie supports:\n• Battle Royale Pubs\n• Battle Royale Ranked\n\n Automatic updates occur every ${bold(
  '5'
)} minutes.`;

const generateStatusHelpRow = (defaultValue: 'information' | 'setup' | 'permissions') => {
  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('statusHelp__sectionDropdown')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: 'Information',
          value: 'sectionDropdown__informationValue',
          default: defaultValue === 'information',
          emoji: { name: 'ℹ️' },
        },
        {
          label: 'Permissions',
          value: 'sectionDropdown__permissionsValue',
          default: defaultValue === 'permissions',
          emoji: { name: '⚙️' },
        },
        {
          label: 'Setup',
          value: 'sectionDropdown__setupValue',
          default: defaultValue === 'setup',
          emoji: { name: '🛠️' },
        },
      ])
  );
  return row;
};
export const sendStatusHelpInformationInteraction = async ({
  interaction,
  subCommand,
}: {
  interaction: ChatInputCommandInteraction;
  subCommand: string;
}) => {
  try {
    const row = generateStatusHelpRow('information');
    const embed: APIEmbed = {
      title: 'Information',
      description: informationDescription,
      color: 3447003,
    };

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (error) {
    sendErrorLog({ error, interaction, subCommand });
  }
};
export const showStatusHelpMessage = async ({
  interaction,
  mixpanel,
}: {
  interaction: StringSelectMenuInteraction;
  mixpanel?: Mixpanel | null;
}) => {
  const value = !isEmpty(interaction.values) ? interaction.values[0] : null;

  switch (value) {
    case 'sectionDropdown__informationValue':
      await showStatusHelpInformation({ interaction, mixpanel });
      break;
    case 'sectionDropdown__setupValue':
      await showStatusHelpSetup({ interaction, mixpanel });
      break;
    case 'sectionDropdown__permissionsValue':
      await showStatusHelpPermissions({ interaction, mixpanel });
      break;
  }
};
export const showStatusHelpInformation = async ({
  interaction,
  mixpanel,
}: {
  interaction: StringSelectMenuInteraction;
  mixpanel?: Mixpanel | null;
}) => {
  const row = generateStatusHelpRow('information');
  const embed: APIEmbed = {
    title: 'Information',
    description: informationDescription,
    color: 3447003,
  };
  try {
    await interaction.message.edit({ embeds: [embed], components: [row] });
  } catch (error) {
    sendErrorLog({ error, interaction });
  } finally {
    mixpanel &&
      sendAnalyticsEvent({
        user: interaction.user,
        channel: interaction.inGuild() ? interaction.channel : null,
        guild: interaction.guild,
        client: mixpanel,
        eventName: 'Click status help information select menu',
      });
  }
};
export const showStatusHelpSetup = async ({
  interaction,
  mixpanel,
}: {
  interaction: StringSelectMenuInteraction;
  mixpanel?: Mixpanel | null;
}) => {
  const row = generateStatusHelpRow('setup');
  // TODO: Add created roles after wiring up
  const embed: APIEmbed = {
    title: 'Setup',
    description: `To start an automatic map status, use ${inlineCode(
      '/status start'
    )}\n\nUpon choosing your game modes, Nessie will create a set of:\n• ${inlineCode(
      'Category Channel'
    )}\n• ${inlineCode('Text Channel')}\n• ${inlineCode(
      'Webhook'
    )}\n\nUpdates will then be sent in these channels ${bold('every 5 minutes')}`,
    color: 3447003,
  };
  try {
    await interaction.message.edit({ embeds: [embed], components: [row] });
  } catch (error) {
    sendErrorLog({ error, interaction });
  } finally {
    mixpanel &&
      sendAnalyticsEvent({
        user: interaction.user,
        channel: interaction.inGuild() ? interaction.channel : null,
        guild: interaction.guild,
        client: mixpanel,
        eventName: 'Click status help setup select menu',
      });
  }
};
export const showStatusHelpPermissions = async ({
  interaction,
  mixpanel,
}: {
  interaction: StringSelectMenuInteraction;
  mixpanel?: Mixpanel | null;
}) => {
  const {
    hasAdmin,
    hasManageChannels,
    hasManageWebhooks,
    hasViewChannel,
    hasSendMessages,
    hasMissingPermissions,
  } = checkMissingBotPermissions(interaction);
  const isManageServerUser = checkIfUserHasManageServer(interaction);

  const row = generateStatusHelpRow('permissions');
  const embed: APIEmbed = {
    title: 'Permissions',
    description: `Nessie requires certain permissions to properly create automatic updates. See the checklist below for the full list.`,
    fields: [
      {
        name: 'User Permissions',
        value: `${isManageServerUser ? '✅' : '❌'} Manage Server`,
      },
      {
        name: 'Bot Permissions',
        value: `${hasAdmin || hasManageChannels ? '✅' : '❌'} Manage Channels\n${
          hasAdmin || hasManageWebhooks ? '✅' : '❌'
        } Manage Webhooks\n${hasAdmin || hasViewChannel ? '✅' : '❌'} View Channels\n${
          hasAdmin || hasSendMessages ? '✅' : '❌'
        } Send Messages\n\n${
          !isManageServerUser || hasMissingPermissions
            ? `Looks like there are missing permissions. Make sure to add the above permissions to be able to use automatic map updates!${
                isManageServerUser
                  ? `\nYou can refresh Nessie's permissions by reinviting using this [link](https://discord.com/api/oauth2/authorize?client_id=889135055430111252&permissions=536874000&scope=applications.commands%20bot)`
                  : ''
              }`
            : 'Looks like everything is set, use `/status start` to get started!'
        }`,
      },
    ],
    color: 3447003,
  };
  try {
    await interaction.message.edit({ embeds: [embed], components: [row] });
  } catch (error) {
    sendErrorLog({ error, interaction });
  } finally {
    mixpanel &&
      sendAnalyticsEvent({
        user: interaction.user,
        channel: interaction.inGuild() ? interaction.channel : null,
        guild: interaction.guild,
        client: mixpanel,
        eventName: 'Click status help permissions select menu',
      });
  }
};
