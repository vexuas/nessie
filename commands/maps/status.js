const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');

const generateHelpEmbed = () => {};
const sendHelpInteraction = async (interaction) => {
  const embedData = {
    title: 'Status | Help',
    description:
      'This command will send automatic updates of Apex Legends Maps in 2 new channels: *apex-pubs* and *apex-ranked*\n\nUpdates occur **every 15 minutes**\n\nRequires:\n• Manage Channel Permissions\n• Send Message Permissions\n• Only Admins can enable automatic status',
    color: 3447003,
  };
  return await interaction.editReply({ embeds: [embedData] });
};
const sendStartInteraction = async (interaction) => {
  const embedData = {
    title: 'Status | Start',
    color: 3447003,
    description:
      'By confirming below, Nessie will create a new category channel and 2 new text channels for the automated map status:\n• `Apex Map Status`\n• `#apex-pubs`\n• `#apex-ranked`\n\nNessie will use these channels to send automatic updates every 15 minutes',
  };
  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('statusStart__cancelButton')
        .setLabel('Cancel')
        .setStyle('SECONDARY')
    )
    .addComponents(
      new MessageButton()
        .setCustomId('statusStart__startButton')
        .setLabel(`Let's go!`)
        .setStyle('SUCCESS')
    );

  return await interaction.editReply({ components: [row], embeds: [embedData] });
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Creates an automated channel to show map status')
    .addSubcommand((subCommand) =>
      subCommand.setName('help').setDescription('Displays information about automatic map status')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('start').setDescription('Starts the automated map status')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('stop').setDescription('Stops an existing automated status')
    ),

  async execute({ nessie, interaction, mixpanel }) {
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          return await sendHelpInteraction(interaction);
          break;
        case 'start':
          return await sendStartInteraction(interaction);
        case 'stop':
          return await interaction.editReply('Status Stop Command');
      }
    } catch (error) {
      console.log(error);
    }
  },
};
