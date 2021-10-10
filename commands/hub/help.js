const { defaultPrefix } = require('../../config/nessie.json');

module.exports = {
  name: 'help',
  description: 'directory hub of commands',
  hasArguments: false,
  execute({message}) {
    const embed = {
      color: 3447003,
      description:
        'Below you can see all the commands that I know!\n\nMy current prefix is `' +
        defaultPrefix +
        '`',
      fields: [
        {
          name: 'Maps',
          value: '`br`, `br ranked`, `arenas`, `arenas ranked`'
        },
        {
          name: 'Information',
          value: '`info`, `help`, `prefix`, `invite`'
        }
      ]
    };
    return message.channel.send({ embeds: [embed] });
  }
};
