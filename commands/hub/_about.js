const { SlashCommandBuilder } = require('@discordjs/builders');
const { format } = require('date-fns');
const { version } = require('../../package.json');

const sendAboutEmbed = async ({ nessie, interaction }) => {
  const embed = {
    title: 'About',
    description: `Hi there! I'm Nessie and I provide information about map rotations in Apex Legends! In my final form, I want to be able to automatically notify you which maps you want to play are currently active!\n\nCurrent version: No notifications yet but you can manually check the current map rotation with my commands! I also display the current br pubs map as my activity status\n\nFor a detailed list of my commands, use the help command!`,
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
