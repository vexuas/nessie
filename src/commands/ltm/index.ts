import { APIEmbed, SlashCommandBuilder } from 'discord.js';
import { getLimitedTimeEvent } from '../../services/adapters';
import { getCountdown, getMapUrl, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

//TODO: Add typing after upgrading to djs v14
export const generateLimitedTimeEventEmbed = (data: any): APIEmbed => {
  const mapURL = getMapUrl(data.current.code);
  const embedData: APIEmbed = {
    title: data.current.eventName,
    description: '',
    color: 15105570,
    image: {
      url: mapURL && mapURL.length > 0 ? mapURL : data.current.asset,
    },
    timestamp: (Date.now() + data.current.remainingSecs * 1000).toString(),
    footer: {
      text: `Next Map: ${data.next.map}`,
    },
    fields: [
      {
        name: 'Current map',
        value: '```fix\n\n' + data.current.map + '```',
        inline: true,
      },
      {
        name: 'Time left',
        value: '```xl\n\n' + getCountdown(data.current.remainingTimer) + '```',
        inline: true,
      },
    ],
  };
  return embedData;
};
export default {
  commandType: 'Maps',
  data: new SlashCommandBuilder()
    .setName('ltm')
    .setDescription('Shows current limited time mode map rotation'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      await interaction.deferReply();
      const data = await getLimitedTimeEvent();
      const embed = generateLimitedTimeEventEmbed(data);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
