const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Generates an invite link for Nessie'),
  async execute({ interaction }) {
    const embed = {
      description: `<@${interaction.user.id}> | [Add me to your servers! (◕ᴗ◕✿)](https://tinyurl.com/nessie-invite-v021)`,
      color: 3447003,
    };
    return await interaction.reply({ embeds: [embed] });
  },
};
