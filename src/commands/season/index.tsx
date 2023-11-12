import { SlashCommandBuilder } from 'discord.js';
import { sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export default {
  commandType: 'Information',
  data: new SlashCommandBuilder()
    .setName('season')
    .setDescription('Displays information about the current season'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      await interaction.reply('season command');
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
