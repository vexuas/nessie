const { SlashCommandBuilder } = require('@discordjs/builders');
const { format } = require('date-fns');
const { version } = require('../../package.json');
const { codeBlock } = require('../../helpers');

const sendAboutEmbed = async ({ nessie, interaction }) => {
  const embed = {
    title: 'About',
    description: `Hi there! I’m Nessie and I provide an easy way to get status updates of Map Rotations in Apex Legends! Hope that you can find me useful (◕ᴗ◕✿)\n\nUpcoming feature: **Automatic Map Status Updates**\n\nAll my data is extracted from the great works of [https://apexlegendsapi.com/](https://apexlegendsapi.com/). Go support them too, it’s a cool project!`,
    color: 3447003,
    thumbnail: {
      url: 'https://cdn.discordapp.com/attachments/889134541615292459/896698383593517066/sir_nessie.png',
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
        value: '30-Nov-2021',
        inline: true,
      },
      {
        name: 'Support Server',
        value: '[Link](https://discord.com/invite/47Ccgz9jA4)',
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
