import { APIEmbed, SlashCommandBuilder } from 'discord.js';
import { getEmbedColor, getMapUrl, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';
import { getSeasonInformation } from '../../services/adapters';
import { snakeCase } from 'lodash';

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
        description,
        data: { image },
      } = season.info;
      console.log(season);

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
        description,
        image: {
          url: getMapUrl(`${snakeCase(image)}_rotation`) ?? '',
        },
        fields: [
          {
            name: '',
            value: '',
          },
        ],
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
