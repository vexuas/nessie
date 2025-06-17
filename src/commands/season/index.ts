import { APIEmbed, inlineCode, SlashCommandBuilder } from 'discord.js';
import {
  formatEndDateCountdown,
  getEmbedColor,
  getMapUrl,
  sendErrorLog,
} from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';
import { getSeasonInformation } from '../../services/adapters';
import { snakeCase } from 'lodash';
import { format } from 'date-fns';

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
        split,
        data: { image },
      } = season.info;

      const seasonEnd = formatEndDateCountdown({
        endDate: season.dates.end.rankedEnd * 1000,
        currentDate: new Date(),
      });
      const splitEnd = formatEndDateCountdown({
        endDate: season.dates.split.timestamp * 1000,
        currentDate: new Date(),
      });

      const embed: APIEmbed = {
        title: `Season ${seasonNumber} | ${title}`,
        color: getEmbedColor(),
        description: `${description}\n\nStarted on: ${inlineCode(
          format(season.dates.start.timestamp * 1000, 'dd MMM, h:mm a')
        )}\nCurrent Split: ${inlineCode(split.toString())}`,
        image: {
          url: getMapUrl(`${snakeCase(image)}_rotation`) ?? '',
        },
        footer: {
          text: `Season ends on ${format(season.dates.end.rankedEnd * 1000, 'dd MMM, h:mm a')}`,
        },
        fields: [
          {
            name: 'Split ends in',
            value: '```fix\n\n' + splitEnd + '```',
            inline: true,
          },
          {
            name: 'Season ends in',
            value: '```fix\n\n' + seasonEnd + '```',
            inline: true,
          },
        ],
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
