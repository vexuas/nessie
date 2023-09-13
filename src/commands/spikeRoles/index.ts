import { APIEmbed, SlashCommandBuilder } from 'discord.js';
import { getEmbedColor, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export default {
  data: new SlashCommandBuilder()
    .setName('spikeRoles')
    .setDescription('Spike roles necessary for map alerts'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      await interaction.deferReply();
      const embed: APIEmbed = {
        description: 'Add roles here',
        color: getEmbedColor(),
      };
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
