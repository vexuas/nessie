import { SlashCommandBuilder } from '@discordjs/builders';
import { getLimitedTimeEvent } from '../../services/adapters';
import { generateErrorEmbed, getCountdown, getMapUrl, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';
import { v4 as uuidV4 } from 'uuid';

//TODO: Add typing after upgrading to djs v14
export const generateLimitedTimeEventEmbed = (data: any) => {
  const mapURL = getMapUrl(data.current.code);
  const embedData = {
    title: data.current.eventName,
    description: '',
    color: 15105570,
    image: {
      url: mapURL && mapURL.length > 0 ? mapURL : data.current.asset,
    },
    timestamp: Date.now() + data.current.remainingSecs * 1000,
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
  async execute({ app, interaction }: AppCommandOptions) {
    try {
      await interaction.deferReply();
      const data = await getLimitedTimeEvent();
      const embed = generateLimitedTimeEventEmbed(data);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const uuid = uuidV4();
      const type = 'Limited Time Event';
      const errorEmbed = await generateErrorEmbed(error, uuid, app);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie: app, error, interaction, type, uuid });
    }
  },
} as AppCommand;
