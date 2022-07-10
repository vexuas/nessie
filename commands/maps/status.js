const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  generateErrorEmbed,
  sendErrorLog,
  generatePubsEmbed,
  generateRankedEmbed,
} = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const { MessageActionRow, MessageSelectMenu, MessageButton, WebhookClient } = require('discord.js');
const { getRotationData } = require('../../adapters');
const { nessieLogo } = require('../../constants');
const { format } = require('date-fns');
const { insertNewStatus, getStatus } = require('../../database/handler');

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
    const type = 'Status Help';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.editReply({ embeds: errorEmbed });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
/**
 * Handler for generating the UI for Game Mode Selection Step as well as Confirm Status step below
 * This is separated from the interaction handlers as we want to be able to reuse them when the user goes back and forth through the steps
 * Step 1: Game Mode Selection
 * - Uses a multiple select dropdown that shows the supported game modes for status
 * - Users need to choose at least one game mode to continue
 * Step 2: Confirm Status
 * - We show the selected game mode(s) and explain the corresponding actions Nessie will do after confirmation
 * - TODO: Don't forget to add copy for the explanation of webhooks/channels creation + status update cycles
 * - Has 3 buttons: Back goes to Step 1, Cancel stops the wizard entirely, Confirm creates a status for the guild
 */
const generateGameModeSelectionMessage = (status) => {
  let embed, row;
  if (!status) {
    row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('statusStart__gameModeDropdown')
        .setPlaceholder('Requires at least one game mode')
        .setMinValues(1)
        .setMaxValues(2)
        .addOptions([
          {
            label: 'Arenas',
            description: 'Pubs and Ranked Map Rotation for Arenas',
            value: 'gameModeDropdown__arenasValue',
          },
          {
            label: 'Battle Royale',
            description: 'Pubs and Ranked Map Rotation for Arenas',
            value: 'gameModeDropdown__battleRoyaleValue',
          },
        ])
    );
    embed = {
      title: `Step 1 | Game Mode Selection`,
      description: 'Select which game modes to receive automatic updates',
      color: 3447003,
    };
  } else {
    embed = {
      title: 'Status | Start',
      description: `There's currently an existing automated map status active in:${
        status.br_channel_id ? `\n• <#${status.br_channel_id}>` : ''
      }${status.arenas_channel_id ? `\n• <#${status.arenas_channel_id}>` : ''}\n\nCreated at ${
        status.created_at
      } by ${status.created_by}`,
      color: 3447003,
    };
  }

  return {
    embed,
    row,
  };
};
const generateConfirmStatusMessage = ({ interaction }) => {
  /**
   * The game mode selections are passed down from the dropdown interaction in step 1
   * However, there's no direct way of passing them down along with the confirm button interaction
   * To solve this, we're going to append the selected game modes on the customId of the button itself
   * Going to treat them like query params (?x&y)
   */
  const isBattleRoyaleSelected = interaction.values.find(
    (value) => value === 'gameModeDropdown__battleRoyaleValue'
  );
  const isArenasSelected = interaction.values.find(
    (value) => value === 'gameModeDropdown__arenasValue'
  );
  const modeLength = interaction.values.length;

  const confirmButtonId = `statusStart__confirmButton${modeLength > 0 ? '?' : ''}${
    isBattleRoyaleSelected ? 'battle_royale' : ''
  }${modeLength > 1 ? '&' : ''}${isArenasSelected ? 'arenas' : ''}`; //Full selection: statusStart__confirmButton?battle_royale&arenas;

  //TODO: Cleanup the selected game mode display below
  const mapOptions = {
    gameModeDropdown__battleRoyaleValue: 'Battle Royale',
    gameModeDropdown__arenasValue: 'Arenas',
  };

  let selectedValues = '';
  interaction.values.forEach((value, index) => {
    selectedValues += `${index > 0 ? ', ' : ''}${mapOptions[value]}`;
  });
  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('Back')
        .setStyle('SECONDARY')
        .setCustomId('statusStart__backButton')
    )
    .addComponents(
      new MessageButton()
        .setLabel('Cancel')
        .setStyle('DANGER')
        .setCustomId('statusStart__cancelButton')
    )
    .addComponents(
      new MessageButton().setLabel("Let's go!").setStyle('SUCCESS').setCustomId(confirmButtonId)
    );
  const embed = {
    title: 'Step 2 | Status Confirmation',
    description: `Selected ${selectedValues}\n\n• Show selected game modes\n• Explain what channels + webhooks will be created based on selection\n• By confirming below, Nessie will create yada yada yada`,
    color: 3447003,
  };
  return {
    embed,
    row,
  };
};
//----- Status Functions/Interactions -----//
/**
 * Generates relevant embeds for the status battle royale channel
 * Initially was pubs but data shows that br is overwhelmingly more popular than arenas
 * Had to split it between br and arenas after seeing that
 */
const generateBattleRoyaleStatusEmbeds = (data) => {
  const battleRoyalePubsEmbed = generatePubsEmbed(data.battle_royale);
  const battleRoyaleRankedEmbed = generateRankedEmbed(data.ranked);
  const informationEmbed = {
    description:
      '**Updates occur every 15 minutes**. This is a temporary feature while a more refined solution is being worked on to get automatic map updates directly in your servers. For feedback, bug reports or news update, feel free visit the [support server](https://discord.gg/FyxVrAbRAd)!',
    color: 3447003,
    timestamp: Date.now(),
    footer: {
      text: 'Last Update',
    },
  };
  return [informationEmbed, battleRoyaleRankedEmbed, battleRoyalePubsEmbed];
};
/**
 * Generates relevant embeds for the status arenas channel
 * Initially was pubs but data shows that br is overwhelmingly more popular than arenas
 * Had to split it between br and arenas after seeing that
 */
const generateArenasStatusEmbeds = (data) => {
  const arenasPubsEmbed = generatePubsEmbed(data.arenas, 'Arenas');
  const arenasRankedEmbed = generateRankedEmbed(data.arenasRanked, 'Arenas');
  const informationEmbed = {
    description:
      '**Updates occur every 15 minutes**. This is a temporary feature while a more refined solution is being worked on to get automatic map updates directly in your servers. For feedback, bug reports or news update, feel free visit the [support server](https://discord.gg/FyxVrAbRAd)!',
    color: 3447003,
    timestamp: Date.now(),
    footer: {
      text: 'Last Update',
    },
  };
  return [informationEmbed, arenasRankedEmbed, arenasPubsEmbed];
};
/**
 * Handler for when a user initiates the /status start command
 * Shows the first step of the status start wizard: Game Mode Selection
 */
const sendStartInteraction = async ({ interaction, nessie }) => {
  await getStatus(
    interaction.guildId,
    async (status) => {
      const { embed, row } = generateGameModeSelectionMessage(status);
      try {
        await interaction.editReply({ embeds: [embed], components: row ? [row] : [] });
      } catch (error) {
        const uuid = uuidv4();
        const type = 'Status Start';
        const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
        await interaction.editReply({ embeds: errorEmbed });
        await sendErrorLog({ nessie, error, interaction, type, uuid });
      }
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Getting Status in Database (Start)';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  );
};
/**
 * Handler for when a user selects any of the options in the Game Mode dropdown
 * Will edit and show the second step of the status start wizard: Confirm Status
 */
const goToConfirmStatus = async ({ interaction, nessie }) => {
  const { embed, row } = generateConfirmStatusMessage({ interaction });
  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embed], components: [row] });
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status Start Confirm';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.editReply({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
/**
 * Handler for when a user clicks the Back button in Confirm Status Step
 * Will edit and show the first step of the status start wizard: Confirm Status
 */
const goBackToGameModeSelection = async ({ interaction, nessie }) => {
  const { embed, row } = generateGameModeSelectionMessage();
  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embed], components: [row] });
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status Start Back';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.editReply({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
/**
 * Handler for when a user clicks the Cancel button in Confirm Status Step
 * Will edit and show a success message that the status configuration has been stopped
 * Prepended an underscore as there's a function in announcement with the same name
 * TODO: Clean up the code there eventually
 */
const _cancelStatusStart = async ({ interaction, nessie }) => {
  const embed = {
    description: 'Cancelled automatic map status config',
    color: 16711680,
  };
  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embed], components: [] });
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status Start Cancel';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.editReply({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
/**
 * Handler for when a user clicks the Confirm button in Confirm Status Step
 * This is the most important aspect as it will initialise the process of map status
 * Main steps upon button click:
 * - Check which game modes have been selected based on button customId
 * - Edits initial message with a loading state
 * - Calls the API for the rotation data
 * - Create embeds for each status channel
 * - Creates a category channel and relevant text channels under it
 * - Creates relevant webhooks
 * - Send embeds to respective channels through webhooks
 * - Edits initial message with a success message
 *
 * TODO: Save status data in our database
 * TODO: Maybe separate ui and wiring up to respective files/folders for better readability
 */
const createStatus = async ({ interaction, nessie }) => {
  const isBattleRoyaleSelected = interaction.customId.includes('battle_royale');
  const isArenasSelected = interaction.customId.includes('arenas');
  const embedLoadingChannels = {
    description: `Loading status channels...`,
    color: 16776960,
  };
  const embedLoadingWebhooks = {
    description: `Loading webhooks...`,
    color: 16776960,
  };

  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embedLoadingChannels], components: [] });

    const rotationData = await getRotationData();
    const statusBattleRoyaleEmbed = generateBattleRoyaleStatusEmbeds(rotationData);
    const statusArenasEmbed = generateArenasStatusEmbeds(rotationData);

    const statusCategory = await interaction.guild.channels.create('Apex Legends Map Status', {
      type: 'GUILD_CATEGORY',
    });
    const statusBattleRoyaleChannel =
      isBattleRoyaleSelected &&
      (await interaction.guild.channels.create('apex-battle-royale', {
        parent: statusCategory,
        type: 'GUILD_TEXT',
      }));
    const statusArenasChannel =
      isArenasSelected &&
      (await interaction.guild.channels.create('apex-arenas', {
        parent: statusCategory,
        type: 'GUILD_TEXT',
      }));

    await interaction.message.edit({ embeds: [embedLoadingWebhooks], components: [] });

    const statusBattleRoyaleWebhook =
      statusBattleRoyaleChannel &&
      (await statusBattleRoyaleChannel.createWebhook('Nessie Automatic Status', {
        avatar: nessieLogo,
        reason: 'Webhook to receive automatic map updates for Apex Battle Royale',
      }));
    const statusArenasWebhook =
      statusArenasChannel &&
      (await statusArenasChannel.createWebhook('Nessie Automatic Status', {
        avatar: nessieLogo,
        reason: 'Webhook to receive automatic map updates for Apex Arenas',
      }));

    const statusBattleRoyaleMessage =
      statusBattleRoyaleWebhook &&
      (await new WebhookClient({
        id: statusBattleRoyaleWebhook.id,
        token: statusBattleRoyaleWebhook.token,
      }).send({
        embeds: statusBattleRoyaleEmbed,
      }));
    const statusArenasMessage =
      statusArenasWebhook &&
      (await new WebhookClient({
        id: statusArenasWebhook.id,
        token: statusArenasWebhook.token,
      }).send({
        embeds: statusArenasEmbed,
      }));

    const newStatus = {
      uuid: uuidv4(),
      guildId: interaction.guildId,
      categoryChannelId: statusCategory.id,
      battleRoyaleChannelId: statusBattleRoyaleChannel ? statusBattleRoyaleChannel.id : null,
      arenasChannelId: statusArenasChannel ? statusArenasChannel.id : null,
      battleRoyaleMessageId: statusBattleRoyaleMessage ? statusBattleRoyaleMessage.id : null,
      arenasMessageId: statusArenasMessage ? statusArenasMessage.id : null,
      battleRoyaleWebhookId: statusBattleRoyaleWebhook ? statusBattleRoyaleWebhook.id : null,
      arenasWebhookId: statusArenasWebhook ? statusArenasWebhook.id : null,
      originalChannelId: interaction.channelId,
      gameModeSelected:
        isBattleRoyaleSelected && isArenasSelected
          ? 'All'
          : isBattleRoyaleSelected
          ? 'Battle Royale'
          : 'Arenas',
      createdBy: interaction.user.tag,
      createdAt: format(new Date(), 'dd MMM yyyy, h:mm a'),
    };

    await insertNewStatus(
      newStatus,
      async () => {
        const embedSuccess = {
          description: '',
          color: 3066993,
        };
        isBattleRoyaleSelected && isArenasSelected
          ? (embedSuccess.description = `Created map status at ${statusBattleRoyaleChannel} and ${statusArenasChannel}`)
          : null;
        isBattleRoyaleSelected && !isArenasSelected
          ? (embedSuccess.description = `Created map status at ${statusBattleRoyaleChannel}`)
          : null;
        !isBattleRoyaleSelected && isArenasSelected
          ? (embedSuccess.description = `Created map status at ${statusArenasChannel}`)
          : null;

        await interaction.message.edit({ embeds: [embedSuccess], components: [] });
      },
      async (error) => {
        const uuid = uuidv4();
        const type = 'Inserting New Status in Database';
        const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
        await interaction.message.edit({ embeds: errorEmbed, components: [] });
        await sendErrorLog({ nessie, error, interaction, type, uuid });
      }
    );
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status Start Confirm';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.editReply({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
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

  async execute({ nessie, interaction, mixpanel }) {
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          return sendHelpInteraction({ interaction, nessie });
        case 'start':
          return sendStartInteraction({ interaction, nessie });
        case 'stop':
          return interaction.editReply('Selected status stop');
      }
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Status Generic';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  },
  goToConfirmStatus,
  goBackToGameModeSelection,
  _cancelStatusStart,
  createStatus,
};
