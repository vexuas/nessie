const { SlashCommandBuilder } = require('@discordjs/builders');
const { generateErrorEmbed, sendErrorLog } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');

/**
 * Handler for when a user initiates the /status help command
 * Displays information of status command, explains what it does and permissions it needs
 * Feeling a bit wacky so added a dynamic checklist of required permissions
 * Will either show a tick or mark if the permission is missing
 * Shows a success/warning at the end if any of the permissions are missing
 */
const sendHelpInteraction = async ({ interaction, nessie }) => {
  const isAdminUser = interaction.member.permissions.has('ADMINISTRATOR'); //Checks if user who initiated command is an Admin
  const hasAdmin = interaction.guild.me.permissions.has('ADMINISTRATOR');
  const hasManageChannels = interaction.guild.me.permissions.has('MANAGE_CHANNELS', false);
  const hasManageWebhooks = interaction.guild.me.permissions.has('MANAGE_WEBHOOKS', false);
  const hasSendMessages = interaction.guild.me.permissions.has('SEND_MESSAGES', false);
  const hasMissingPermissions =
    (!hasManageChannels || !hasManageWebhooks || !hasSendMessages) && !hasAdmin; //Overrides missing permissions if nessie has Admin

  try {
    const embedData = {
      title: 'Status | Help',
      description:
        "• Explain the status command does\n• Explain what it'll create; channels, webhooks\n• Explain necessary user permissions; admin\n• Explain bot permissions; whatever nessie needs to operate",
      fields: [
        {
          name: 'User Permissions',
          value: `${isAdminUser ? '✅' : '❌'} Administrator`,
        },
        {
          name: 'Bot Permissions',
          value: `${hasAdmin || hasManageChannels ? '✅' : '❌'} Manage Channels\n${
            hasAdmin || hasManageWebhooks ? '✅' : '❌'
          } Manage Webhooks\n${hasAdmin || hasSendMessages ? '✅' : '❌'} Send Messages\n\n${
            !isAdminUser || hasMissingPermissions
              ? 'Looks like there are missing permissions. Make sure to add the above permissions to be able to create automatic map updates!'
              : 'Looks like everything is set, use `/status start` to get started!'
          }`,
        },
      ],
      color: 3447003,
    };

    return await interaction.editReply({ embeds: [embedData] });
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
          return sendHelpInteraction({ interaction, nessie });
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
