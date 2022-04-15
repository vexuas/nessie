const { format } = require('date-fns');
const { version } = require('../../package.json');
const { generateAnnouncementMessage, codeBlock } = require('../../helpers');
const { nessieLogo } = require('../../constants');

const sendAboutEmbed = ({ message, nessie, prefix }) => {
  const embed = {
    title: 'About',
    description:
      generateAnnouncementMessage(prefix) +
      `Hi there! I’m Nessie and I provide an easy way to get status updates of Map Rotations in Apex Legends! Hope that you can find me useful (◕ᴗ◕✿)\n\nUpcoming feature: **Automatic Map Status Updates**\n\nAll my data is extracted from the great works of [https://apexlegendsapi.com/](https://apexlegendsapi.com/). Go support them too, it’s a cool project!\n\nMy current prefix is ${codeBlock(
        prefix
      )} | For a detailed list of my commands, type ${codeBlock(
        `${prefix}help`
      )}\n\nFor the latest news, check out \`updates\`!`,
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
        value: '15-Apr-2022',
        inline: true,
      },
      {
        name: 'Support Server',
        value: '[Link](https://discord.com/invite/47Ccgz9jA4)',
        inline: true,
      },
    ],
  };
  return message.channel.send({ embeds: [embed] });
};

module.exports = {
  name: 'about',
  description: 'The story and information hub of nessie',
  execute({ message, nessie, nessiePrefix }) {
    const prefix = nessiePrefix;
    sendAboutEmbed({ message, nessie, prefix });
  },
};
