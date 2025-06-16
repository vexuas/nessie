import { APIEmbed, SlashCommandBuilder } from 'discord.js';
import { getEmbedColor, sendErrorLog } from '../../utils/helpers';
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
      const {
        season: seasonNumber,
        title,
        data: { url },
      } = season.info;

      // const seasonEnd = formatEndDateCountdown({
      //   endDate: season.dates.end.rankedEnd * 1000,
      //   currentDate: new Date(),
      // });
      // const splitEnd = formatEndDateCountdown({
      //   endDate: season.dates.split.timestamp * 1000,
      //   currentDate: new Date(),
      // });

      const embed: APIEmbed = {
        title: `Season ${seasonNumber} | ${title}`,
        color: getEmbedColor(),
        image: {
          url,
        },
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
