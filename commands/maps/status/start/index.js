const { MessageActionRow, MessageSelectMenu, MessageButton, WebhookClient } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const {
  generateErrorEmbed,
  sendErrorLog,
  generatePubsEmbed,
  generateRankedEmbed,
  checkMissingBotPermissions,
  sendMissingBotPermissionsError,
  checkIfAdminUser,
  sendOnlyAdminError,
  sendMissingAllPermissionsError,
  codeBlock,
  sendStatusErrorLog,
} = require('../../../../helpers');
const { getRotationData } = require('../../../../adapters');
const { nessieLogo } = require('../../../../constants');
const { format, differenceInSeconds, differenceInMilliseconds } = require('date-fns');
const {
  insertNewStatus,
  getStatus,
  getAllStatus,
  deleteStatus,
} = require('../../../../database/handler');
const Scheduler = require('../../../../scheduler');
const { sendMixpanelEvent } = require('../../../../analytics');
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
            description: 'Pubs and Ranked Map Rotation for Battle Royale',
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
      '**Updates occur every 15 minutes**. This feature is currently in beta! For feedback, bug reports or news updates, feel free to visit the [support server](https://discord.gg/FyxVrAbRAd)!',
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
      '**Updates occur every 15 minutes**. This feature is currently in beta! For feedback, bug reports or news updates, feel free to visit the [support server](https://discord.gg/FyxVrAbRAd)!',
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
 * We want to show permissions errors only when status do not exist
 * We want to show them existing status details but block them if they want to create one
 */
const sendStartInteraction = async ({ interaction, nessie }) => {
  await getStatus(
    interaction.guildId,
    async (status) => {
      const { embed, row } = generateGameModeSelectionMessage(status);
      const { hasMissingPermissions } = checkMissingBotPermissions(interaction);
      const isAdminUser = checkIfAdminUser(interaction);
      try {
        if (!status) {
          if (hasMissingPermissions && !isAdminUser) {
            return sendMissingAllPermissionsError({ interaction, title: 'Status | Start' });
          } else {
            if (hasMissingPermissions)
              return sendMissingBotPermissionsError({ interaction, title: 'Status | Start' });
            if (!isAdminUser) return sendOnlyAdminError({ interaction, title: 'Status | Start' });
          }
        }
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
const goToConfirmStatus = async ({ interaction, nessie, mixpanel }) => {
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
  } finally {
    sendMixpanelEvent({
      user: interaction.user,
      channel: interaction.channel,
      guild: interaction.guild,
      client: mixpanel,
      customEventName: 'Click status start gamemode select menu',
    });
  }
};
/**
 * Handler for when a user clicks the Back button in Confirm Status Step
 * Will edit and show the first step of the status start wizard: Confirm Status
 */
const goBackToGameModeSelection = async ({ interaction, nessie, mixpanel }) => {
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
  } finally {
    sendMixpanelEvent({
      user: interaction.user,
      channel: interaction.channel,
      guild: interaction.guild,
      client: mixpanel,
      customEventName: 'Click status start back button',
    });
  }
};
/**
 * Handler for when a user clicks the Cancel button in Confirm Status Step
 * Will edit and show a success message that the status configuration has been stopped
 * Prepended an underscore as there's a function in announcement with the same name
 * TODO: Clean up the code there eventually
 */
const _cancelStatusStart = async ({ interaction, nessie, mixpanel }) => {
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
  } finally {
    sendMixpanelEvent({
      user: interaction.user,
      channel: interaction.channel,
      guild: interaction.guild,
      client: mixpanel,
      customEventName: 'Click status start cancel button',
    });
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
const createStatus = async ({ interaction, nessie, mixpanel }) => {
  const isBattleRoyaleSelected = interaction.customId.includes('battle_royale');
  const isArenasSelected = interaction.customId.includes('arenas');
  const gameModeSelected =
    isBattleRoyaleSelected && isArenasSelected
      ? 'All'
      : isBattleRoyaleSelected
      ? 'Battle Royale'
      : 'Arenas';
  const embedLoadingChannels = {
    description: `Loading Status Channels...`,
    color: 16776960,
  };
  const embedLoadingWebhooks = {
    description: `Loading Webhooks...`,
    color: 16776960,
  };

  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embedLoadingChannels], components: [] });

    const rotationData = await getRotationData();
    const statusBattleRoyaleEmbed = generateBattleRoyaleStatusEmbeds(rotationData);
    const statusArenasEmbed = generateArenasStatusEmbeds(rotationData);
    /**
     * Gets the @everyone role of the guild
     * Important so w can't prevent non-admin users from sending any messages in status channels
     */
    const everyoneRole = interaction.guild.roles.cache.find((role) => role.name === '@everyone');

    const statusCategory = await interaction.guild.channels.create('Apex Legends Map Status', {
      type: 'GUILD_CATEGORY',
    });
    const statusBattleRoyaleChannel =
      isBattleRoyaleSelected &&
      (await interaction.guild.channels.create('apex-battle-royale', {
        parent: statusCategory,
        type: 'GUILD_TEXT',
        permissionOverwrites: [
          {
            id: everyoneRole.id,
            deny: ['SEND_MESSAGES'],
          },
        ],
      }));
    const statusArenasChannel =
      isArenasSelected &&
      (await interaction.guild.channels.create('apex-arenas', {
        parent: statusCategory,
        type: 'GUILD_TEXT',
        permissionOverwrites: [
          {
            id: everyoneRole.id,
            deny: ['SEND_MESSAGES'],
          },
        ],
      }));

    //Since webhooks take way longer to create than channels, adding another loading state here
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

    /**
     * Create new status data object to be inserted in our database
     * We then call the insertNewStatus handler to start insertion
     * * Passes a success and error callback with the former editing the original message with a success embed
     */
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
      battleRoyaleWebhookToken: statusBattleRoyaleWebhook ? statusBattleRoyaleWebhook.token : null,
      arenasWebhookToken: statusArenasWebhook ? statusArenasWebhook.token : null,
      originalChannelId: interaction.channelId,
      gameModeSelected,
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
        //TODO: Probably figure out a better way of handling string manipulation
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
        //Sends status creation log after everything is done
        const statusLogChannel = nessie.channels.cache.get('976863441526595644');
        const statusLogEmbed = {
          title: 'New Status Created',
          color: 3066993,
          fields: [
            {
              name: 'Guild',
              value: interaction.guild.name,
            },
            {
              name: 'Game Modes',
              value:
                isBattleRoyaleSelected && isArenasSelected
                  ? 'All'
                  : isBattleRoyaleSelected
                  ? 'Battle Royale'
                  : 'Arenas',
            },
          ],
        };
        await statusLogChannel.send({ embeds: [statusLogEmbed] });
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
  } finally {
    sendMixpanelEvent({
      user: interaction.user,
      channel: interaction.channel,
      guild: interaction.guild,
      client: mixpanel,
      customEventName: 'Click status start confirm button',
      properties: {
        game_mode_selected: gameModeSelected,
      },
    });
  }
};
/**
 * Handler in charge in updating map data in the relevant status channels
 * Uses the Scheduler class to create a cron job that fires every 10th second of every 15 minutes (0:5:10, 0:10:10, 0:15:10, etc)
 * When the cron job is executed, we then:
 * - Call the getAllStatus handler to get every existing status in our database
 * - Upon finishing the query, we then call the API for the current rotation data
 * - If there are no existing statuses, we don't do anything
 * - If there are, we then edit the relevant status messages
 *
 * Opted to use edits now to lessen runtime of each status cyle through guilds
 * Initially wanted to just edit without waiting for the response for peak speed
 * But realised we at least want to do error handling if it does fail
 * This definitely affects runtime quite a bit but does make our cycles more stable
 * Might have to revisit this in the near future when we're supporting a lot of guilds
 * More detailed explanation here: https://shizuka.notion.site/Spike-on-Status-Time-Taken-0c26284152f04a169c546fe7b582a658
 */
const scheduleStatus = (nessie) => {
  return new Scheduler(
    '5 */1 * * * *',
    async () => {
      getAllStatus(async (allStatus, client) => {
        const startTime = Date.now();
        try {
          if (allStatus) {
            const rotationData = await getRotationData();
            const brStatusEmbeds = generateBattleRoyaleStatusEmbeds(rotationData);
            const arenasStatusEmbeds = generateArenasStatusEmbeds(rotationData);
            allStatus.forEach(async (status, index) => {
              await handleStatusCycle({
                nessie,
                status,
                index,
                startTime,
                totalCount: allStatus.length,
                brStatusEmbeds,
                arenasStatusEmbeds,
              });
            });
          }
        } catch (error) {
          /**
           * Different error handling from status cycles
           * Specifically due to this is where we catch API issues
           * Should really make these errors distinguishable from the others but assumming the errors comes from the API here is alright for now
           * Since technically the status is working fine, we still want to edit the status messages in every guild
           * Only difference is instead of the rotation data, we're showing the information embed + an error message
           */
          const uuid = uuidv4();
          const type = 'Status Scheduler Config';
          const errorEmbed = [
            {
              description:
                '**Updates occur every 15 minutes**. This feature is currently in beta! For feedback, bug reports or news updates, feel free to visit the [support server](https://discord.gg/FyxVrAbRAd)!',
              color: 3447003,
              timestamp: Date.now(),
              footer: {
                text: 'Last Update',
              },
            },
          ].concat(await generateErrorEmbed(error, uuid, nessie));
          allStatus.forEach(async (status) => {
            await handleStatusCycle({
              nessie,
              status,
              brStatusEmbeds: errorEmbed,
              arenasStatusEmbeds: errorEmbed,
            });
          });
          await sendErrorLog({ nessie, error, type, uuid, ping: true });
        }
      });
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Status Scheduler (Database)';
      await sendErrorLog({ nessie, error, type, uuid, ping: true });
    }
  );
};
/**
 * Handler for the status cycle execution
 * Moved this to its own function as we want to easily reuse it above
 * Also since the error handling is pretty big here, it makes readability better
 * Error handling:
 * Normally we'll just send an error log but there are specific breaking actions a user might take
 * These would be deleting status messages, channels or and/or webhooks
 * Without these, Nessie won't be able to properly update the guild with rotation data
 * Initially just wanted to send an error log to the original channel where status was initialised and ask the user to stop the status
 * But I felt like that might just open more possibilities of the user to make an error
 * Finally opted to just delete the status entirely if these errors happen and let the guild know about it
 */
const handleStatusCycle = async ({
  nessie,
  status,
  index,
  startTime,
  totalCount,
  brStatusEmbeds,
  arenasStatusEmbeds,
}) => {
  try {
    const brWebhook =
      status.br_webhook_id &&
      status.br_webhook_token &&
      new WebhookClient({
        id: status.br_webhook_id,
        token: status.br_webhook_token,
      });
    const arenasWebhook =
      status.arenas_webhook_id &&
      status.arenas_webhook_token &&
      new WebhookClient({
        id: status.arenas_webhook_id,
        token: status.arenas_webhook_token,
      });
    if (brWebhook) {
      await brWebhook.editMessage(status.br_message_id, { embeds: brStatusEmbeds });
    }
    if (arenasWebhook) {
      await arenasWebhook.editMessage(status.arenas_message_id, {
        embeds: arenasStatusEmbeds,
      });
    }
    /**
     * Logs health of status after the last guild gets done
     * This is placed here instead of finally as somehow the latter gets fired even before the loop ends
     * Added time fields so we can monitor how long a cycle finishes
     */
    if (index === totalCount - 1) {
      const endTime = Date.now();
      const statusLogChannel = nessie.channels.cache.get('976863441526595644');
      const statusLogEmbed = {
        title: 'Nessie | Auto Map Status Log',
        description: 'Successfully finished status cycle',
        color: 3066993,
        fields: [
          {
            name: 'Status Count',
            value: codeBlock(totalCount),
            inline: true,
          },
          {
            name: 'Start Time',
            value: codeBlock(format(startTime, 'dd MMM yyyy, h:mm:ss a')),
          },
          {
            name: 'End Time',
            value: codeBlock(format(endTime, 'dd MMM yyyy, h:mm:ss a')),
          },
          {
            name: 'Time Taken',
            value: codeBlock(
              `${differenceInSeconds(endTime, startTime)} seconds | ${differenceInMilliseconds(
                endTime,
                startTime
              )} milliseconds`
            ),
          },
        ],
      };
      await statusLogChannel.send({ embeds: [statusLogEmbed] });
    }
  } catch (error) {
    const uuid = uuidv4();
    await sendStatusErrorLog({ nessie, uuid, error, status });
    if (error.message === 'Unknown Message' || error.message === 'Unknown Webhook') {
      deleteStatus(status.guild_id, async (status) => {
        try {
          //Uses cache on status channels so it doesn't fail when they dont exist
          //Might have to revamp these when we have to do sharding
          const battleRoyaleStatusChannel =
            status.br_channel_id && (await nessie.channels.cache.get(status.br_channel_id));
          const arenasStatusChannel =
            status.arenas_channel_id && (await nessie.channels.cache.get(status.arenas_channel_id));
          const categoryStatusChannel =
            status.category_channel_id &&
            (await nessie.channels.cache.get(status.category_channel_id));
          battleRoyaleStatusChannel && (await battleRoyaleStatusChannel.delete());
          arenasStatusChannel && (await arenasStatusChannel.delete());
          categoryStatusChannel && (await categoryStatusChannel.delete());
          const originalChannel = await nessie.channels.fetch(status.original_channel_id);
          await originalChannel.send({
            embeds: [
              {
                title: 'Automatic Map Status Error',
                description: `Oops looks like one of the channels/webhooks/messages for map status got deleted!\nNessie needs these to properly send map updates so please refrain from manually deleting them.\n\nMap status has been temporarily stopped. To start it again, use ${codeBlock(
                  '/status start'
                )}`,
                color: 16711680,
              },
            ],
          });
        } catch (error) {
          const uuid = uuidv4();
          await sendStatusErrorLog({ nessie, uuid, error, status });
        }
      });
    }
  }
};
module.exports = {
  goToConfirmStatus,
  goBackToGameModeSelection,
  _cancelStatusStart,
  createStatus,
  sendStartInteraction,
  scheduleStatus,
};
