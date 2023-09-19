import { APIEmbed, SlashCommandBuilder } from 'discord.js';
import { MapRotationMixtapeSchema } from '../../schemas/mapRotation';
import { getMixtape } from '../../services/adapters';
import { getCountdown, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export const generateMixtapeEmbed = (data: MapRotationMixtapeSchema): APIEmbed => {
  const embedData: APIEmbed = {
    title: `Mixtape`,
    color: 15105570,
    image: {
      url: data.current.asset,
    },
    timestamp: new Date(Date.now() + data.current.remainingSecs * 1000).toISOString(),
    footer: {
      text: `Next Mode: ${data.next.eventName} | ${data.next.map}`,
    },
    fields: [
      {
        name: 'Current mode',
        value: '```fix\n\n' + `${data.current.eventName} | ${data.current.map}` + '```',
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
      console.log(data);
      const embed = generateMixtapeEmbed(data);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
