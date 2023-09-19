import { APIEmbed, SlashCommandBuilder } from 'discord.js';
import { MapRotationMixtapeSchema } from '../../schemas/mapRotation';
import { getMixtape } from '../../services/adapters';
import { getCountdown, getMapUrl, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export const generateMixtapeEmbed = (data: MapRotationMixtapeSchema): APIEmbed => {
  const mapURL = getMapUrl(data.current.code);
  const embedData: APIEmbed = {
    title: data.current.eventName,
    color: 15105570,
    image: {
      url: mapURL && mapURL.length > 0 ? mapURL : data.current.asset,
    },
    timestamp: new Date(Date.now() + data.current.remainingSecs * 1000).toISOString(),
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
    .setName('mixtape')
    .setDescription('Shows current mode and map rotation for mixtape'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      await interaction.deferReply();
      const data = await getMixtape();
      const embed = generateMixtapeEmbed(data);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
