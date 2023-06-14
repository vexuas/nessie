import { BOT_UPDATED_AT, BOT_VERSION } from '../../version';
import { AppCommand, AppCommandOptions } from '../commands';
import { format } from 'date-fns';
import { sendErrorLog } from '../../utils/helpers';
import { Client } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

//TODO: Add typing after upgrading to djs v14
export const generateAboutEmbed = (app?: Client) => {
  const embed = {
    title: 'Info',
    description: `Hi there! I’m Nessie and I provide an easy way to get status updates of Map Rotations in Apex Legends! Hope that you can find me useful (◕ᴗ◕✿)\n\nTry out my new beta feature: **Automatic Map Updates**! To check out what it is, use \`/status help\`!\n\nAll my data is extracted from the great works of [https://apexlegendsapi.com/](https://apexlegendsapi.com/). Go support them too, it’s a cool project!\n\nFor the latest news, check out \`/updates\`!`,
    color: 3447003,
    thumbnail: {
      url: 'https://cdn.discordapp.com/attachments/1089616880576245853/1094559253395689562/mitsuha.jpg',
    },
    fields: [
      {
        name: 'Creator',
        value: '-',
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
        value: '-',
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
    .setDescription('Displays information about My App'),
  async execute({ interaction, app }: AppCommandOptions) {
    try {
      const embed = generateAboutEmbed(app);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
