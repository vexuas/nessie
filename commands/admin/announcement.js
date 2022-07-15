const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  isAdmin: true,
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription("Sets automated map updates on Nessie's announcement channels")
    .addSubcommand((subCommand) =>
      subCommand.setName('stop').setDescription('Stops an existing automated status')
    ),
  async execute({ nessie, interaction }) {
    try {
      await interaction.deferReply();
      return sendStopInteraction({ interaction, nessie });
    } catch (error) {
      console.log(error);
    }
  },
};
