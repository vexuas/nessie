const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Directory hub of commands'),
  async execute({ interaction }) {
    const embed = {
      color: 3447003,
      description: 'Below you can see all the commands that I know!',
      fields: [
        {
          name: 'Maps',
          value: '`br`, `arenas`, `status`',
        },
        {
          name: 'Information',
          value: '`about`, `help`, `invite`, `updates`',
        },
      ],
    };
    return await interaction.reply({ embeds: [embed] });
  },
};
