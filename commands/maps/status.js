const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { generateErrorEmbed, sendErrorLog } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');

/**
 * Temporary handler for status command
 * Just displays information on why there's no proper status yet
 * Also has an invite button to redirect people to the support server
 * TODO: Probably need to make the support server an actual community server with actual rules and stuff
 */
const sendHelpInteraction = async ({ interaction, nessie }) => {
  try {
    const embedData = {
      title: 'Status | About',
      description:
        "Due to technical limitations with Discord, automatic updates through normal messages/interactions isn't possible in a large scale. Fortunately an alternative approach is being worked on but it might take a while before it gets released\n\nAs a temporary solution, I've set up automatic map updates in announcement channels in the support server.\n\nFeel free to join and follow the channels!",
      color: 3447003,
    };
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel("To Nessie's Canyon")
        .setStyle('LINK')
        .setURL('https://discord.gg/FyxVrAbRAd')
    );

    return await interaction.editReply({ components: [row], embeds: [embedData] });
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status About';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.editReply({ embeds: errorEmbed });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
module.exports = {
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

  async execute({ nessie, interaction, mixpanel }) {
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          return interaction.editReply('Selected status help');
        case 'start':
          return interaction.editReply('Selected status start');
        case 'stop':
          return interaction.editReply('Selected status stop');
      }
    } catch (error) {
      console.log(error);
    }
  },
};
