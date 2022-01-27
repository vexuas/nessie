const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('br')
    .setDescription('Shows current map rotation for battle royale')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Game Mode')
        .setRequired(true)
        .addChoice('pubs', 'br_pubs')
        .addChoice('ranked', 'br_ranked')
    ),
  async execute({ interaction }) {
    try {
      const optionMode = interaction.options.getString('mode');
      switch (optionMode) {
        case 'br_pubs':
          return await interaction.reply('br pubs command');
        case 'br_ranked':
          return await interaction.reply('br ranked command');
      }
    } catch (e) {}
  },
};
