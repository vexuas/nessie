import { format } from 'date-fns';
import { APIEmbed, inlineCode, SlashCommandBuilder } from 'discord.js';
import { SeasonAPISchema } from '../../schemas/season';
import { getSeasonInformation } from '../../services/adapters';
import { formatEndDateCountdown, getEmbedColor, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export const generateSeasonEmbed = (season: SeasonAPISchema) => {
  const { info, dates } = season;
  const embed: APIEmbed = {
    title: `Season ${info.season} | ${info.title}`,
    description: `${info.description ?? ''}\n\nSeason Start: ${inlineCode(
      format(new Date(dates.start.readable), 'dd MMM yyyy, h:mm a')
    )}\nCurrent Split: ${inlineCode(info.split.toString())}`,
    color: getEmbedColor(),
    image: {
      url: info.data.image,
    },
    fields: [
      {
        name: 'Split End',
        value:
          '```xl\n\n' +
          `${format(
            new Date(dates.split.readable),
            'dd MMM yyyy, h:mm a'
          )} • ${formatEndDateCountdown({
            endDate: dates.split.timestamp * 1000,
            currentDate: new Date(),
          })}` +
          '```',
      },
      {
        name: 'Season End',
        value:
          '```xl\n\n' +
          `${format(
            new Date(dates.end.rankedEndReadable),
            'dd MMM yyyy, h:mm a'
          )} • ${formatEndDateCountdown({
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
      console.log(seasonData);
      if (!seasonData)
        return await interaction.reply('Unavailable to get season data, try again later!');
      const embed = generateSeasonEmbed(seasonData);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
