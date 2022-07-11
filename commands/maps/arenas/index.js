const { SlashCommandBuilder } = require('@discordjs/builders');
const { getArenasPubs, getArenasRanked } = require('../../../adapters');
const {
  sendErrorLog,
  generateErrorEmbed,
  generatePubsEmbed,
  generateRankedEmbed,
} = require('../../../helpers');
const { v4: uuidv4 } = require('uuid');
const { sendMixpanelEvent } = require('../../../analytics');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arenas')
    .setDescription('Shows current map rotation for arenas')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Game Mode')
        .setRequired(true)
        .addChoice('pubs', 'arenas_pubs')
        .addChoice('ranked', 'arenas_ranked')
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
        case 'arenas_pubs':
          data = await getArenasPubs();
          embed = generatePubsEmbed(data, 'Arenas');
          break;
        case 'arenas_ranked':
          data = await getArenasRanked();
          embed = generateRankedEmbed(data, 'Arenas');
          break;
      }
      await interaction.editReply({ embeds: [embed] });
      sendMixpanelEvent(
        interaction.user,
        interaction.channel,
        interaction.guild,
        'arenas',
        mixpanel,
        optionMode,
        true
      );
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Arenas';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, type, interaction, uuid });
    }
  },
};
