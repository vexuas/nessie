const { SlashCommandBuilder } = require('@discordjs/builders');

const sendInfoEmbed = ({ message, nessie, prefix, interaction }) => {
  const embed = {
    title: 'Info',
    description: `Hi there! I'm Nessie and I provide information about map rotations in Apex Legends! In my final form, I want to be able to automatically notify you which maps you want to play are currently active!\n\nCurrent version: No notifications yet but you can manually check the current map rotation with my commands! I also display the current br pubs map as my activity status. And custom prefixes!\n\nMy current prefix  is ${grvAcnt}${prefix}${grvAcnt} | For a detailed list of my commands, type ${grvAcnt}${prefix}help${grvAcnt}`, //Removed users for now
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
        name: 'Source Code',
        value: '[Github](https://github.com/vexuas/nessie)',
        inline: true,
      },
    ],
  };
  return interaction
    ? interaction.reply({ embeds: [embed] })
    : message.channel.send({ embeds: [embed] });
};

module.exports = {
  name: 'info',
  description: 'The story and information hub of nessie',
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('The story and information hub of nessie'),
  execute({ message, nessie, nessiePrefix, interaction }) {
    const prefix = nessiePrefix;
    sendInfoEmbed({ message, nessie, prefix, interaction });
  },
};
