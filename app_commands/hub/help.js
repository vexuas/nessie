const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Directory hub of commands'),
  execute({ interaction }) {
    const embed = {
      color: 3447003,
      description: 'Below you can see all the commands that I know!',
      fields: [
        {
          name: 'Maps',
          value: '`br`, `arenas`',
        },
        {
          name: 'Information',
          value: '`about`, `help`, `invite`',
        },
      ],
    };
    return interaction.reply({ embeds: [embed] });
  },
};
