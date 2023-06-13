const { SlashCommandBuilder } = require('@discordjs/builders');
const { generateErrorEmbed, sendErrorLog } = require('../../../utils/helpers');
const { v4: uuidv4 } = require('uuid');
const { sendHelpInteraction } = require('./help');
const { sendStartInteraction } = require('./start');
const { sendStopInteraction } = require('./stop');

module.exports = {
  /**
   * Creates Status application command with relevant subcommands
   * Apparently when you create a subcommand under a base command, the base command will no longer be called
   * I.e /status becomes void and only '/status xyz' can be used as commands
   * I'm not sure why Discord did it this way but their explanation is the base command now becomes a folder of sorts
   * Was initially planning to have /status, /status start and /status stop with the former showing the command information
   * Not really a problem anyway since now it's /status about
   *
   * TODO: Check if it's possible to have default permissions when creating commands
   * Alternative is to manaully set it inside the guild settings
   */
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Get your automatic map updates here!')
    .addSubcommand((subCommand) =>
      subCommand
        .setName('help')
        .setDescription('Displays information on setting up automatic map updates')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('start').setDescription('Set up automatic map updates')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('stop').setDescription('Stops existing automatic map updates')
    ),

  async execute({ nessie, interaction }) {
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          return sendHelpInteraction({ interaction, nessie });
        case 'start':
          return sendStartInteraction({ interaction, nessie });
        case 'stop':
          return sendStopInteraction({ interaction, nessie });
      }
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Status Generic';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  },
};
