const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  isAdmin: true,
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription("Sets automated map updates on Nessie's announcement channels")
    .addSubcommand((subCommand) =>
      subCommand.setName('start').setDescription('Starts the automated map status')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('stop').setDescription('Stops an existing automated status')
    ),
  async execute({ nessie, interaction }) {
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      await interaction.editReply('Test');
    } catch (error) {
      console.log(error);
    }
  },
};
