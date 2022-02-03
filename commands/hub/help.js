const { generateAnnouncementMessage } = require('../../helpers');

module.exports = {
  name: 'help',
  description: 'directory of commands',
  hasArguments: false,
  execute({ message, nessiePrefix }) {
    const embed = {
      color: 3447003,
      description:
        generateAnnouncementMessage(nessiePrefix) +
        'Below you can see all the commands that I know!\n\nMy current prefix is `' +
        nessiePrefix +
        '`',
      fields: [
        {
          name: 'Maps',
          value: '`br`, `br ranked`, `arenas`, `arenas ranked`',
        },
        {
          name: 'Information',
          value: '`announcement`, `about`, `help`, `prefix`, `setprefix`, `invite`',
        },
      ],
    };
    return message.channel.send({ embeds: [embed] });
  },
};
