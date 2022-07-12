const { v4: uuidv4 } = require('uuid');
const {
  generateErrorEmbed,
  sendErrorLog,
  checkMissingBotPermissions,
  checkIfAdminUser,
} = require('../../../../helpers');

/**
 * Handler for when a user initiates the /status help command
 * Displays information of status command, explains what it does and permissions it needs
 * Feeling a bit wacky so added a dynamic checklist of required permissions
 * Will either show a tick or mark if the permission is missing
 * Shows a success/warning at the end if any of the permissions are missing
 */
const sendHelpInteraction = async ({ interaction, nessie }) => {
  const { hasAdmin, hasManageChannels, hasManageWebhooks, hasSendMessages, hasMissingPermissions } =
    checkMissingBotPermissions(interaction);
  const isAdminUser = checkIfAdminUser(interaction);

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
    const type = 'Status Help';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.editReply({ embeds: errorEmbed });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};

module.exports = {
  sendHelpInteraction,
};
