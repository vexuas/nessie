const { SlashCommandBuilder } = require('@discordjs/builders');
const { generateErrorEmbed, sendErrorLog } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const { getStatus } = require('../../database/handler');

//----- Status Application Command Replies -----//
/**
 * Handler for when a user initiates the /status help command
 * Calls the getStatus handler to see for existing status in the guild
 * Passes a success and error callback with the former sending an information embed with context depending on status existence
 */
const sendHelpInteraction = async ({ interaction, nessie }) => {
  await getStatus(
    interaction.guildId,
    async (status) => {
      const embedData = {
        title: 'Status | Help',
        description: 'To be filled',
        color: 3447003,
      };
      return await interaction.editReply({ embeds: [embedData] });
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Getting Status in Database (Help)';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  );
};
module.exports = {
  data: new SlashCommandBuilder().setName('status').setDescription('To be filled'),

  async execute({ nessie, interaction, mixpanel }) {
    try {
      await interaction.deferReply();
      return await sendHelpInteraction({ interaction, nessie });
    } catch (error) {
      console.log(error);
    }
  },
};
