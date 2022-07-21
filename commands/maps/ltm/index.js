const { SlashCommandBuilder } = require('@discordjs/builders');
const { v4: uuidv4 } = require('uuid');
const { getLimitedTimeEvent } = require('../../../adapters');
const { generateErrorEmbed, generatePubsEmbed } = require('../../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ltm')
    .setDescription('Shows current limited event map rotation'),
  async execute({ nessie, interaction }) {
    try {
      await interaction.deferReply();
      const data = await getLimitedTimeEvent();
      const embed = generatePubsEmbed(data, data.current.eventName);
      interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Limited Time Event';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  },
};
