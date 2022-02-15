const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Generates an invite link for Nessie'),
  async execute({ interaction }) {
    const embed = {
      description: `<@${interaction.user.id}> | [Add me to your servers! (◕ᴗ◕✿)](https://discord.com/api/oauth2/authorize?client_id=889135055430111252&permissions=3088&scope=applications.commands%20bot)`,
      color: 3447003,
    };
    return await interaction.reply({ embeds: [embed] });
  },
};
