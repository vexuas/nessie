import { SlashCommandBuilder } from 'discord.js';
import { sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export default {
  commandType: 'Information',
  data: new SlashCommandBuilder()
    .setName('season')
    .setDescription('Shows information of the current season'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      await interaction.deferReply();
      await interaction.editReply({ embeds: [] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
