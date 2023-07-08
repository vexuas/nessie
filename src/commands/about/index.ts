import { BOT_UPDATED_AT, BOT_VERSION } from '../../version';
import { AppCommand, AppCommandOptions } from '../commands';
import { format } from 'date-fns';
import { getEmbedColor, sendErrorLog } from '../../utils/helpers';
import { APIEmbed, Client, hyperlink, SlashCommandBuilder } from 'discord.js';
import { nessieLogo } from '../../utils/constants';

export const generateAboutEmbed = (app?: Client): APIEmbed => {
  const embed = {
    title: 'Info',
    description: `Hi there! I’m Nessie and I provide an easy way to get status updates of Map Rotations in Apex Legends! Hope that you can find me useful (◕ᴗ◕✿)\n\nTry out my cool feature: **Automatic Map Updates**! To check out what it is, use \`/status help\`!\n\nAll my data is extracted from the great works of ${hyperlink(
      'Apex Legends API',
      'https://apexlegendsapi.com'
    )}. Go support them too, it’s a cool project!`,
    color: getEmbedColor(),
    thumbnail: {
      url: nessieLogo,
    },
    fields: [
      {
        name: 'Creator',
        value: 'vexuas',
        inline: true,
      },
      {
        name: 'Date Created',
        value:
          app && app.application ? format(app.application.createdTimestamp, 'dd-MM-yyyy') : 'N/A',
        inline: true,
      },
      {
        name: 'Version',
        value: BOT_VERSION,
        inline: true,
      },
      {
        name: 'Library',
        value: 'discord.js',
        inline: true,
      },
      {
        name: 'Last Updated',
        value: BOT_UPDATED_AT,
        inline: true,
      },
      {
        name: 'Support Server',
        value: hyperlink('Link', 'https://discord.gg/FyxVrAbRAd'),
        inline: true,
      },
    ],
  };
  return embed;
};
export default {
  commandType: 'Information',
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Displays information about Nessie'),
  async execute({ interaction, app }: AppCommandOptions) {
    try {
      const embed = generateAboutEmbed(app);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
