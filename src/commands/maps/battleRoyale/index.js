const { SlashCommandBuilder } = require('@discordjs/builders');
const { getBattleRoyalePubs, getBattleRoyaleRanked } = require('../../../services/adapters');
const {
  sendErrorLog,
  generateErrorEmbed,
  generateRankedEmbed,
  generatePubsEmbed,
  codeBlock,
} = require('../../../utils/helpers');
const { v4: uuidv4 } = require('uuid');
const { getStatus } = require('../../../services/database');

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
    /**
     * Temporary database query to check if there's an existing status in the guild
     * This is so we can conditionally show the status prompt to lessen visual clutter
     * One could argue this isn't necessary; especially when we're only going to have the prompt till end of August
     * I don't really have any counter arguments lmao but I'm keeping it in
     * TODO: Remove this after Aug 31 2022
     */
    await getStatus(
      interaction.guildId,
      async (status) => {
        let data;
        let embed;
        try {
          await interaction.deferReply();
          const optionMode = interaction.options.getString('mode');
          switch (optionMode) {
            case 'br_pubs':
              data = await getBattleRoyalePubs();
              embed = generatePubsEmbed(data);
              if (!status) {
                embed.description = `Try out my new feature to get automatic map updates! More details on ${codeBlock(
                  '/status help'
                )}`;
              }
              break;
            case 'br_ranked':
              data = await getBattleRoyaleRanked();
              embed = generateRankedEmbed(data);
              if (!status) {
                embed.description = `Try out my new feature to get automatic map updates! More details on ${codeBlock(
                  '/status help'
                )}`;
              }
              break;
          }
          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          const uuid = uuidv4();
          const type = 'Battle Royale';
          const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
          await interaction.editReply({ embeds: errorEmbed });
          await sendErrorLog({ nessie, error, interaction, type, uuid });
        }
      },
      async (error) => {
        const uuid = uuidv4();
        const type = 'Getting Status in Database (Battle Royale)';
        const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
        interaction.editReply({ embeds: errorEmbed });
        await sendErrorLog({ nessie, error, interaction, type, uuid });
      }
    );
  },
};
