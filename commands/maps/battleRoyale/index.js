const { SlashCommandBuilder } = require('@discordjs/builders');
const { getBattleRoyalePubs, getBattleRoyaleRanked } = require('../../../adapters');
const {
  sendErrorLog,
  generateErrorEmbed,
  generateRankedEmbed,
  generatePubsEmbed,
} = require('../../../helpers');
const { v4: uuidv4 } = require('uuid');
const { sendMixpanelEvent } = require('../../../analytics');

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
  /**
   * Send correct game mode map information based on user option
   * We want to defer interaction as discord invalidates token after 3 seconds and we're retrieving our data through the api
   * This is pretty cool as discord will treat it as a normal response and we can do whatever we want with it within 15 minutes
   * which is editing the reply with the relevant information after the promise resolves
   **/
  async execute({ nessie, interaction, mixpanel }) {
    let data;
    let embed;
    try {
      await interaction.deferReply();
      const optionMode = interaction.options.getString('mode');
      switch (optionMode) {
        case 'br_pubs':
          data = await getBattleRoyalePubs();
          embed = generatePubsEmbed(data);
          break;
        case 'br_ranked':
          data = await getBattleRoyaleRanked();
          embed = generateRankedEmbed(data);
          break;
      }
      await interaction.editReply({ embeds: [embed] });
      sendMixpanelEvent(
        interaction.user,
        interaction.channel,
        interaction.guild,
        'br',
        mixpanel,
        optionMode,
        true
      );
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Battle Royale';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  },
};
