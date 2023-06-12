const { SlashCommandBuilder } = require('@discordjs/builders');
const { getArenasPubs, getArenasRanked } = require('../../../adapters');
const {
  sendErrorLog,
  generateErrorEmbed,
  generatePubsEmbed,
  generateRankedEmbed,
  codeBlock,
} = require('../../../helpers');
const { v4: uuidv4 } = require('uuid');
const { sendMixpanelEvent } = require('../../../analytics');
const { getStatus } = require('../../../database/handler');

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
            case 'arenas_pubs':
              data = await getArenasPubs();
              embed = generatePubsEmbed(data, 'Arenas');
              if (!status) {
                embed.description = `Try out my new feature to get automatic map updates! More details on ${codeBlock(
                  '/status help'
                )}`;
              }
              break;
            case 'arenas_ranked':
              data = await getArenasRanked();
              embed = generateRankedEmbed(data, 'Arenas');
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
          const type = 'Arenas';
          const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
          await interaction.editReply({ embeds: errorEmbed });
          await sendErrorLog({ nessie, error, type, interaction, uuid });
        }
      },
      async (error) => {
        const uuid = uuidv4();
        const type = 'Getting Status in Database (Arenas)';
        const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
        interaction.editReply({ embeds: errorEmbed });
        await sendErrorLog({ nessie, error, interaction, type, uuid });
      }
    );
  },
};
