const { SlashCommandBuilder } = require('@discordjs/builders');

const sendUpdatesEmbed = async ({ interaction }) => {
  const embed = {
    title: 'Updates | 22 March 2022',
    color: 3447003,
    thumbnail: {
      url: 'https://cdn.discordapp.com/attachments/889134541615292459/896698383593517066/sir_nessie.png',
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
