const { SlashCommandBuilder } = require('@discordjs/builders');
const { nessieLogo } = require('../../constants');

const sendUpdatesEmbed = async ({ interaction }) => {
  const embed = {
    title: 'Updates | 22 March 2022',
    color: 3447003,
    thumbnail: {
      url: nessieLogo,
    },
  };
  return await interaction.reply({ embeds: [embed] });
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('updates')
    .setDescription('Displays latest update of Nessie'),
  async execute({ nessie, interaction }) {
    sendUpdatesEmbed({ interaction });
  },
};
