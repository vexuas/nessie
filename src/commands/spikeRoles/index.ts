import { APIEmbed, SlashCommandBuilder } from 'discord.js';
import { checkMissingBotPermissions, getEmbedColor, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export default {
  data: new SlashCommandBuilder()
    .setName('spikeroles')
    .setDescription('Spike roles necessary for map alerts'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      await interaction.deferReply();
      const {
        hasAdmin,
        hasManageChannels,
        hasManageWebhooks,
        hasSendMessages,
        hasViewChannel,
        hasManageRoles,
      } = checkMissingBotPermissions(interaction);
      const embed: APIEmbed = {
        description: `• hasAdmin: ${hasAdmin}\n• hasManageChannels: ${hasManageChannels}\n• hasManageWebhooks: ${hasManageWebhooks}\n• hasSendMessage: ${hasSendMessages}\n• hasViewChannel: ${hasViewChannel}\n• hasManageRoles: ${hasManageRoles}`,
        color: getEmbedColor(),
      };
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
