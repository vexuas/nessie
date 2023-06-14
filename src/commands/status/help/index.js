const { v4: uuidv4 } = require('uuid');
const {
  generateErrorEmbed,
  sendErrorLog,
  checkMissingBotPermissions,
  codeBlock,
  checkIfUserHasManageServer,
} = require('../../../utils/helpers');

/**
 * Handler for when a user initiates the /status help command
 * Displays information of status command, explains what it does and permissions it needs
 * Feeling a bit wacky so added a dynamic checklist of required permissions
 * Will either show a tick or mark if the permission is missing
 * Shows a success/warning at the end if any of the permissions are missing
 */
const sendHelpInteraction = async ({ interaction, nessie }) => {
  const {
    hasAdmin,
    hasManageChannels,
    hasManageWebhooks,
    hasViewChannel,
    hasSendMessages,
    hasMissingPermissions,
  } = checkMissingBotPermissions(interaction);
  const isManageServerUser = checkIfUserHasManageServer(interaction);

  try {
    const embedInformation = {
      title: 'Information',
      description: `This command will send automatic updates of Apex Legends Map Rotations. You will be able to choose which game modes, *Battle Royale or/and Arenas*, to get updates for both pubs and ranked.\n\nDepending on what you choose, Nessie will create a set of:\n• ${codeBlock(
        'Category Channel'
      )}\n• ${codeBlock('Text Channel(s)')}\n• ${codeBlock(
        'Webhook(s)'
      )}\nUpdates will then be sent in these channels **every 15 minutes**\n\n`,
      color: 3447003,
    };
    const embedPermissions = {
      title: 'Permissions',
      description: `Nessie requires certain permissions to properly create automatic updates. See the checklist below for the full list.`,
      fields: [
        {
          name: 'User Permissions',
          value: `${isManageServerUser ? '✅' : '❌'} Manage Server`,
        },
        {
          name: 'Bot Permissions',
          value: `${hasAdmin || hasManageChannels ? '✅' : '❌'} Manage Channels\n${
            hasAdmin || hasManageWebhooks ? '✅' : '❌'
          } Manage Webhooks\n${hasAdmin || hasViewChannel ? '✅' : '❌'} View Channels\n${
            hasAdmin || hasSendMessages ? '✅' : '❌'
          } Send Messages\n\n${
            !isManageServerUser || hasMissingPermissions
              ? `Looks like there are missing permissions. Make sure to add the above permissions to be able to use automatic map updates!${
                  isManageServerUser
                    ? `\nYou can refresh Nessie's permissions by reinviting using this [link](https://discord.com/api/oauth2/authorize?client_id=889135055430111252&permissions=536874000&scope=applications.commands%20bot)`
                    : ''
                }`
              : 'Looks like everything is set, use `/status start` to get started!'
          }`,
        },
      ],
      color: 3447003,
    };

    return await interaction.editReply({
      embeds: [
        { title: 'Status | Help', description: '', color: 3447003 },
        embedInformation,
        embedPermissions,
      ],
    });
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
