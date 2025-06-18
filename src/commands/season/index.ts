import { SlashCommandBuilder } from 'discord.js';
import { generateSeasonEmbed, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';
import { getSeasonInformation } from '../../services/adapters';

export default {
  commandType: 'Information',
  data: new SlashCommandBuilder()
    .setName('season')
    .setDescription('Shows information of the current season'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      await interaction.deferReply();
      const season = await getSeasonInformation();
      if (!season) return;

      const embed = generateSeasonEmbed(season);

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
