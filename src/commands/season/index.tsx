import { format } from 'date-fns';
import { APIEmbed, SlashCommandBuilder } from 'discord.js';
import { SeasonAPISchema } from '../../schemas/season';
import { getSeasonInformation } from '../../services/adapters';
import { formatEndDateCountdown, getEmbedColor, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export const generateSeasonEmbed = (season: SeasonAPISchema) => {
  const { info, dates } = season;
  const embed: APIEmbed = {
    title: `Season ${info.season} | ${info.title}`,
    description: info.description ?? info.description,
    color: getEmbedColor(),
    image: {
      url: info.data.image,
    },
    fields: [
      {
        name: 'Season Start',
        value: '```xl\n\n' + format(new Date(dates.start.readable), 'dd MMM yyyy, h:mm a') + '```',
      },
      {
        name: 'Current Split',
        value: '```xl\n\n' + info.split.toString() + '```',
        inline: true,
      },
      {
        name: 'Split End',
        value:
          '```xl\n\n' +
          `${format(
            new Date(dates.split.readable),
            'dd MMM yyyy, h:mm a'
          )} | ${formatEndDateCountdown({
            endDate: dates.split.timestamp * 1000,
            currentDate: new Date(),
          })}` +
          '```',
        inline: true,
      },
      {
        name: 'Season End',
        value:
          '```xl\n\n' +
          `${format(
            new Date(dates.end.rankedEndReadable),
            'dd MMM yyyy, h:mm a'
          )} | ${formatEndDateCountdown({
            endDate: dates.end.rankedEnd * 1000,
            currentDate: new Date(),
          })}` +
          '```',
      },
    ],
  };
  return embed;
};

export default {
  commandType: 'Information',
  data: new SlashCommandBuilder()
    .setName('season')
    .setDescription('Displays information about the current season'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      const seasonData = await getSeasonInformation();
      if (!seasonData)
        return await interaction.reply('Unavailable to get season data, try again later!');
      const embed = generateSeasonEmbed(seasonData);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
