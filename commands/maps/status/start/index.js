const { MessageActionRow, MessageSelectMenu, MessageButton, WebhookClient } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const {
  generateErrorEmbed,
  sendErrorLog,
  generatePubsEmbed,
  generateRankedEmbed,
} = require('../../../../helpers');
const { getRotationData } = require('../../../../adapters');
const { nessieLogo } = require('../../../../constants');
const { format } = require('date-fns');
const { insertNewStatus, getStatus, getAllStatus } = require('../../../../database/handler');
const Scheduler = require('../../../../scheduler');
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
/**
 * Handler in charge in updating map data in the relevant status channels
 * Uses the Scheduler class to create a cron job that fires every 10th second of every 15 minutes (0:5:10, 0:10:10, 0:15:10, etc)
 * When the cron job is executed, we then:
 * - Call the getAllStatus handler to get every existing status in our database
 * - Upon finishing the query, we then call the API for the current rotation data
 * - If there are no existing statuses, we don't do anything
 * - If there are, we then get all relevant webhooks of the guild for each status
 * - We then delete the old rotation message and then send a new message with updated data
 * - Finally we update our database of the current change in status
 *
 * RED ALERT
 * Currently for one guild cycle, this takes at least 6 seconds to finish with both arenas + br status active
 * This is because of our usage with awaits on getting webhooks, deleting and creating messages
 * This is not good cuz we'll find ourselves back to where we started pre-webhooks where it'll take forever for all guilds to get their status updated
 * Fortunately we can do away with fetching webhooks by storing tokens and opting for non-blocking deleting
 * However the big issue here is the creation of new rotation messages. We have to wait for those to finish so we know the message id to delete next cycle
 * There's gotta be a solution out there. Right now the best one I can think of is scrapping deleting and just sending the new message
 * This will definitely be the best case scenario time-wise as we don't care about storing data in expense of UX
 * Oh well, looks like there's one final boss to slay smh
 */
const scheduleStatus = (nessie) => {
  return new Scheduler(
    '10 */15 * * * *',
    async () => {
      getAllStatus(async (allStatus, client) => {
        try {
          if (allStatus) {
            const rotationData = await getRotationData();
            allStatus.forEach(async (status) => {
              const brWebhook =
                status.br_webhook_id && (await nessie.fetchWebhook(status.br_webhook_id));
              const arenasWebhook =
                status.arenas_webhook_id && (await nessie.fetchWebhook(status.arenas_webhook_id));

              const brWebhookClient =
                brWebhook && new WebhookClient({ id: brWebhook.id, token: brWebhook.token });
              const arenasWebhookClient =
                arenasWebhook &&
                new WebhookClient({ id: arenasWebhook.id, token: arenasWebhook.token });

              let newBrMessage;
              let newArenasMessage;

              if (brWebhookClient) {
                const brStatusEmbeds = generateBattleRoyaleStatusEmbeds(rotationData);
                await brWebhookClient.deleteMessage(status.br_message_id);
                newBrMessage = await brWebhookClient.send({ embeds: brStatusEmbeds });
              }
              if (arenasWebhookClient) {
                const arenasStatusEmbeds = generateArenasStatusEmbeds(rotationData);
                await arenasWebhookClient.deleteMessage(status.arenas_message_id);
                newArenasMessage = await arenasWebhookClient.send({ embeds: arenasStatusEmbeds });
              }

              /**
               * Tbh I'm a bit worried about having this query here
               * It seems to be working during development but I'm not sure if it's actually firing only after the message promises are done
               * Probably still not confident with database stuff; I'll just keep my fingers crossed heh
               *
               * TODO: Figure out how to cut down time with this, maybe collect all new messages first then updating database? Rather than updating per iteration
               */
              client.query(
                'UPDATE Status SET br_message_id = ($1), arenas_message_id = ($2) WHERE uuid = ($3)',
                [
                  newBrMessage ? newBrMessage.id.toString() : null,
                  newArenasMessage ? newArenasMessage.id.toString() : null,
                  status.uuid.toString(),
                ],
                (err, res) => {
                  client.query('COMMIT', async () => {
                    console.log('Updated Status');
                  });
                }
              );
            });
          }
        } catch (error) {
          const uuid = uuidv4();
          const type = 'Status Scheduler Config';
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
module.exports = {
  goToConfirmStatus,
  goBackToGameModeSelection,
  _cancelStatusStart,
  createStatus,
  sendStartInteraction,
  scheduleStatus,
};
