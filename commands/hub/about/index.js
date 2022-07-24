const { SlashCommandBuilder } = require('@discordjs/builders');
const { format } = require('date-fns');
const { nessieLogo } = require('../../../constants');
const { version } = require('../../../package.json');

const sendAboutEmbed = async ({ nessie, interaction }) => {
  const embed = {
    title: 'About',
    description: `Hi there! I’m Nessie and I provide an easy way to get status updates of Map Rotations in Apex Legends! Hope that you can find me useful (◕ᴗ◕✿)\n\nTry out my new beta feature: **Automatic Map Updates**! To check out what it is, use \`/status help\`!\n\nAll my data is extracted from the great works of [https://apexlegendsapi.com/](https://apexlegendsapi.com/). Go support them too, it’s a cool project!\n\nFor the latest news, check out \`/updates\`!`,
    color: 3447003,
    thumbnail: {
      url: nessieLogo,
    },
    fields: [
      {
        name: 'Creator',
        value: 'Vexuas#8141',
        inline: true,
      },
      {
        name: 'Date Created',
        value: format(nessie.user.createdTimestamp, 'dd-MMM-yyyy'),
        inline: true,
      },
      {
        name: 'Version',
        value: version,
        inline: true,
      },
      {
        name: 'Library',
        value: 'discord.js',
        inline: true,
      },
      {
        name: 'Last Update',
        value: '24-July-2022',
        inline: true,
      },
      {
        name: 'Support Server',
        value: '[Link](https://discord.gg/FyxVrAbRAd)',
        inline: true,
      },
    ],
  };
  return await interaction.reply({ embeds: [embed] });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Displays information about Nessie'),
  async execute({ nessie, interaction }) {
    return await sendAboutEmbed({ nessie, interaction });
  },
};
