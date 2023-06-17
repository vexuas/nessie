import {
  ActionRowBuilder,
  ButtonBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  WebhookClient,
  ButtonStyle,
  APIEmbed,
  ButtonInteraction,
  Client,
  ChannelType,
  PermissionsBitField,
  AnySelectMenuInteraction,
} from 'discord.js';
import {
  deleteStatus,
  getAllStatus,
  getStatus,
  insertNewStatus,
  StatusRecord,
} from '../../../services/database';
import {
  generatePubsEmbed,
  codeBlock,
  generateRankedEmbed,
  checkMissingBotPermissions,
  checkIfUserHasManageServer,
  sendMissingAllPermissionsError,
  sendMissingBotPermissionsError,
  sendMissingUserPermissionError,
  generateErrorEmbed,
  sendErrorLog,
  sendStatusErrorLog,
} from '../../../utils/helpers';
import { v4 as uuidV4 } from 'uuid';
import { getRotationData } from '../../../services/adapters';
import { nessieLogo } from '../../../utils/constants';
import { differenceInMilliseconds, differenceInSeconds, format } from 'date-fns';
import Scheduler from '../../../services/scheduler';
import { ERROR_NOTIFICATION_WEBHOOK_URL } from '../../../config/environment';
import { isEmpty } from 'lodash';

const errorNotification = {
  count: 0,
  message: '',
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
const generateGameModeSelectionMessage = (status?: StatusRecord | null) => {
  let embed, row;
  if (!status) {
    row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
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
const generateConfirmStatusMessage = ({
  interaction,
}: {
  interaction: AnySelectMenuInteraction;
}) => {
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
  const selectionText = `${isBattleRoyaleSelected ? '*Battle Royale*' : ''} ${
    modeLength > 1 ? 'and' : ''
  } ${isArenasSelected ? '*Arenas*' : ''}`;

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId('statusStart__backButton')
    )
    .addComponents(
      new ButtonBuilder()
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setCustomId('statusStart__cancelButton')
    )
    .addComponents(
      new ButtonBuilder()
        .setLabel("Let's go!")
        .setStyle(ButtonStyle.Success)
        .setCustomId(confirmButtonId)
    );
  const embed = {
    title: 'Step 2 | Status Confirmation',
    description: `You've selected ${selectionText}!\n\nBy confirming below, Nessie will create a new category channel, ${modeLength} text-channels and ${modeLength} webhooks for the automatic map updates:\n• ${codeBlock(
      'Apex Legends Map Status'
    )}\n${isBattleRoyaleSelected ? `• ${codeBlock('#apex-battle-royale')}\n` : ''}${
      isArenasSelected ? `• ${codeBlock('#apex-arenas')}\n` : ''
    }• Webhook for each text channel\n\nUpdates get sent to these channels **every 15 minutes**`,
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
 * TODO: Add typing for ALS Data
 */
const generateBattleRoyaleStatusEmbeds = (data: any) => {
  const battleRoyalePubsEmbed = generatePubsEmbed(data.battle_royale);
  const battleRoyaleRankedEmbed = generateRankedEmbed(data.ranked);
  const informationEmbed = {
    description:
      '**Updates occur every 15 minutes**. This feature is currently in beta! For feedback, bug reports or news updates, feel free to visit the [support server](https://discord.gg/FyxVrAbRAd)!',
    color: 3447003,
    timestamp: new Date(Date.now()).toISOString(),
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
 * TODO: Add typing for ALS Data
 */
const generateArenasStatusEmbeds = (data: any) => {
  const arenasPubsEmbed = generatePubsEmbed(data.arenas, 'Arenas');
  const arenasRankedEmbed = generateRankedEmbed(data.arenasRanked, 'Arenas');
  const informationEmbed = {
    description:
      '**Updates occur every 15 minutes**. This feature is currently in beta! For feedback, bug reports or news updates, feel free to visit the [support server](https://discord.gg/FyxVrAbRAd)!',
    color: 3447003,
    timestamp: new Date(Date.now()).toISOString(),
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
export const sendStartInteraction = async ({
  interaction,
  subCommand,
}: {
  interaction: ChatInputCommandInteraction;
  subCommand: string;
}) => {
  const status = await getStatus(interaction.guildId ?? '');
  const { embed, row } = generateGameModeSelectionMessage(status);
  const { hasMissingPermissions } = checkMissingBotPermissions(interaction);
  const isManageServerUser = checkIfUserHasManageServer(interaction);
  try {
    if (!status) {
      if (hasMissingPermissions && !isManageServerUser) {
        return sendMissingAllPermissionsError({ interaction, title: 'Status | Start' });
      } else {
        if (hasMissingPermissions)
          return sendMissingBotPermissionsError({ interaction, title: 'Status | Start' });
        if (!isManageServerUser)
          return sendMissingUserPermissionError({ interaction, title: 'Status | Start' });
      }
    }
    await interaction.editReply({ embeds: [embed], components: row ? [row] : [] });
  } catch (error) {
    sendErrorLog({ error, interaction, subCommand });
  }
};
/**
 * Handler for when a user selects any of the options in the Game Mode dropdown
 * Will edit and show the second step of the status start wizard: Confirm Status
 */
export const goToConfirmStatus = async ({
  interaction,
}: {
  interaction: AnySelectMenuInteraction;
}) => {
  const { embed, row } = generateConfirmStatusMessage({ interaction });
  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embed], components: [row] });
  } catch (error) {
    sendErrorLog({ error, interaction, customTitle: 'Status Start Confirm Error' });
  } finally {
    // sendMixpanelEvent({
    //   user: interaction.user,
    //   channel: interaction.channel,
    //   guild: interaction.guild,
    //   client: mixpanel,
    //   customEventName: 'Click status start gamemode select menu',
    // });
  }
};
/**
 * Handler for when a user clicks the Back button in Confirm Status Step
 * Will edit and show the first step of the status start wizard: Confirm Status
 */
export const goBackToGameModeSelection = async ({
  interaction,
}: {
  interaction: ButtonInteraction;
}) => {
  const { embed, row } = generateGameModeSelectionMessage();
  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embed], components: row ? [row] : [] });
  } catch (error) {
    sendErrorLog({ error, interaction, customTitle: 'Status Start Back Error' });
  } finally {
    // sendMixpanelEvent({
    //   user: interaction.user,
    //   channel: interaction.channel,
    //   guild: interaction.guild,
    //   client: mixpanel,
    //   customEventName: 'Click status start back button',
    // });
  }
};
/**
 * Handler for when a user clicks the Cancel button in Confirm Status Step
 * Will edit and show a success message that the status configuration has been stopped
 * Prepended an underscore as there's a function in announcement with the same name
 * TODO: Clean up the code there eventually
 */
export const _cancelStatusStart = async ({ interaction }: { interaction: ButtonInteraction }) => {
  const embed = {
    description: 'Cancelled automatic map status config',
    color: 16711680,
  };
  try {
    await interaction.deferUpdate();
    await interaction.message.edit({ embeds: [embed], components: [] });
  } catch (error) {
    sendErrorLog({ error, interaction, customTitle: 'Status Start Cancel Error' });
  } finally {
    // sendMixpanelEvent({
    //   user: interaction.user,
    //   channel: interaction.channel,
    //   guild: interaction.guild,
    //   client: mixpanel,
    //   customEventName: 'Click status start cancel button',
    // });
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
export const createStatus = async ({
  interaction,
  nessie,
}: {
  interaction: ButtonInteraction;
  nessie: Client;
}) => {
  const isBattleRoyaleSelected = interaction.customId.includes('battle_royale');
  const isArenasSelected = interaction.customId.includes('arenas');
  const gameModeSelected =
    isBattleRoyaleSelected && isArenasSelected
      ? 'All'
      : isBattleRoyaleSelected
      ? 'Battle Royale'
      : 'Arenas';
  const embedLoadingChannels: APIEmbed = {
    description: `Loading Status Channels...`,
    color: 16776960,
  };
  const embedLoadingWebhooks: APIEmbed = {
    description: `Loading Webhooks...`,
    color: 16776960,
  };

  try {
    await interaction.deferUpdate();
    if (!interaction.guild) return;
    await interaction.message.edit({ embeds: [embedLoadingChannels], components: [] });

    const rotationData = await getRotationData();
    const statusBattleRoyaleEmbed = generateBattleRoyaleStatusEmbeds(rotationData);
    const statusArenasEmbed = generateArenasStatusEmbeds(rotationData);
    /**
     * Gets the @everyone role of the guild
     * Important so w can't prevent non-admin users from sending any messages in status channels
     */
    const everyoneRole = interaction.guild.roles.cache.find(
      (role: any) => role.name === '@everyone'
    );

    const statusCategory = await interaction.guild.channels.create({
      name: 'Apex Legends Map Status',
      type: ChannelType.GuildCategory,
    });
    const statusBattleRoyaleChannel =
      isBattleRoyaleSelected &&
      (await interaction.guild.channels.create({
        name: 'apex-battle-royale',
        parent: statusCategory,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: everyoneRole ? everyoneRole.id : '',
            deny: [PermissionsBitField.Flags.SendMessages],
          },
        ],
      }));
    const statusArenasChannel =
      isArenasSelected &&
      (await interaction.guild.channels.create({
        name: 'apex-arenas',
        parent: statusCategory,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: everyoneRole ? everyoneRole.id : '',
            deny: [PermissionsBitField.Flags.SendMessages],
          },
        ],
      }));

    //Since webhooks take way longer to create than channels, adding another loading state here
    await interaction.message.edit({ embeds: [embedLoadingWebhooks], components: [] });

    const statusBattleRoyaleWebhook =
      statusBattleRoyaleChannel &&
      (await statusBattleRoyaleChannel.createWebhook({
        name: 'Nessie Automatic Status',
        avatar: nessieLogo,
        reason: 'Webhook to receive automatic map updates for Apex Battle Royale',
      }));
    const statusArenasWebhook =
      statusArenasChannel &&
      (await statusArenasChannel.createWebhook({
        name: 'Nessie Automatic Status',
        avatar: nessieLogo,
        reason: 'Webhook to receive automatic map updates for Apex Arenas',
      }));

    const statusBattleRoyaleMessage =
      statusBattleRoyaleWebhook &&
      (await new WebhookClient({
        id: statusBattleRoyaleWebhook.id,
        token: statusBattleRoyaleWebhook.token ?? '',
      }).send({
        embeds: statusBattleRoyaleEmbed,
      }));
    const statusArenasMessage =
      statusArenasWebhook &&
      (await new WebhookClient({
        id: statusArenasWebhook.id,
        token: statusArenasWebhook.token ?? '',
      }).send({
        embeds: statusArenasEmbed,
      }));

    /**
     * Create new status data object to be inserted in our database
     * We then call the insertNewStatus handler to start insertion
     * * Passes a success and error callback with the former editing the original message with a success embed
     */
    const newStatus = {
      uuid: uuidV4(),
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

    await insertNewStatus(newStatus); //TODO: Add typing
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
    statusLogChannel &&
      statusLogChannel.type === ChannelType.GuildText &&
      (await statusLogChannel.send({ embeds: [statusLogEmbed] }));
  } catch (error) {
    sendErrorLog({ error, interaction, customTitle: 'Status Start Confirm' });
  } finally {
    // sendMixpanelEvent({
    //   user: interaction.user,
    //   channel: interaction.channel,
    //   guild: interaction.guild,
    //   client: mixpanel,
    //   customEventName: 'Click status start confirm button',
    //   properties: {
    //     game_mode_selected: gameModeSelected,
    //   },
    // });
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
export const scheduleStatus = (nessie: any) => {
  return new Scheduler('5 */15 * * * *', async () => {
    errorNotification.count = 0;
    errorNotification.message = '';
    const startTime = Date.now();
    const allStatus = await getAllStatus();
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
      const uuid = uuidV4();
      const errorEmbed: any = [
        {
          description:
            '**Updates occur every 15 minutes**. This feature is currently in beta! For feedback, bug reports or news updates, feel free to visit the [support server](https://discord.gg/FyxVrAbRAd)!',
          color: 3447003,
          timestamp: new Date(Date.now()).toISOString(),
          footer: {
            text: 'Last Update',
          },
        },
      ];
      const extraError = await generateErrorEmbed(error, uuid, nessie);
      errorEmbed.concat(extraError);
      allStatus &&
        allStatus.forEach(async (status, index) => {
          await handleStatusCycle({
            nessie,
            status,
            brStatusEmbeds: errorEmbed,
            arenasStatusEmbeds: errorEmbed,
            index,
          });
        });
      sendErrorLog({ error, customTitle: 'Status Scheduler Config' });
    }
  });
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
}: any) => {
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
  } catch (error: any) {
    /**
     * Previously we sent an error notification to a channel whenever a status errors within a cycle
     * This was fine in the beginning so that I can be notified relatively fast
     * However with nessie supporting over a hundred statuses now, it's become quite insane being greeted with dozens of notifcations
     * To avoid the spam and potential api abuse, I've added a simple system on error notification below
     * Granted it does use a global object for now but I'm allowing this sin since the latter would require complicated refactors (Im not really feeling it now)
     * Essentially, we only log a max of 3 individual guild error messages before sending an error summary of guilds affected and message at the end of the cycle
     * Resets error notification meta every cycle
     */
    errorNotification.count = errorNotification.count + 1;
    errorNotification.message = error.message;
    const uuid = uuidV4();
    errorNotification.count <= 3 && (await sendStatusErrorLog({ nessie, uuid, error, status }));
    if (errorNotification.count !== 0 && index === totalCount - 1) {
      const errorEmbed = {
        title: 'Error Summary | Status Cycle',
        color: 16711680,
        description: `Error: ${codeBlock(errorNotification.message)}`,
        fields: [
          {
            name: 'Number of guilds affected',
            value: errorNotification.count.toString(),
          },
          {
            name: 'Timestamp',
            value: format(new Date(), 'dd MMM yyyy, h:mm:ss a'),
          },
        ],
      };
      if (ERROR_NOTIFICATION_WEBHOOK_URL && !isEmpty(ERROR_NOTIFICATION_WEBHOOK_URL)) {
        const notificationWebhook = new WebhookClient({ url: ERROR_NOTIFICATION_WEBHOOK_URL });
        await notificationWebhook.send({
          embeds: [errorEmbed],
          username: 'Nessie Error Notification',
          avatarURL: nessieLogo,
        });
      }
    }

    if (error.message === 'Unknown Message' || error.message === 'Unknown Webhook') {
      await deleteStatus(status.guild_id);
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
        const uuid = uuidV4();
        await sendStatusErrorLog({ nessie, uuid, error, status });
      }
    }
  }
};
