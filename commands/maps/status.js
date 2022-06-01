const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { format } = require('date-fns');
const { getRotationData } = require('../../adapters');
const {
  generatePubsEmbed,
  generateRankedEmbed,
  generateErrorEmbed,
  sendErrorLog,
  codeBlock,
} = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const {
  insertNewStatus,
  getStatus,
  deleteStatus,
  getAllStatus,
} = require('../../database/handler');
const Scheduler = require('../../scheduler');

//----- Status Application Command Replies -----//
/**
 * Handler for when a user initiates the /status help command
 * Calls the getStatus handler to see for existing status in the guild
 * Passes a success and error callback with the former sending an information embed with context depending on status existence
 */
const sendHelpInteraction = async ({ interaction, nessie }) => {
  await getStatus(
    interaction.guildId,
    async (status) => {
      const embedData = {
        title: 'Status | Help',
        description: status
          ? `There's currently an existing automated map status active in:\n• <#${status.pubs_channel_id}>\n• <#${status.ranked_channel_id}>\n\nCreated at ${status.created_at} by ${status.created_by}`
          : 'This command will send automatic updates of Apex Legends Maps in 2 new channels: *apex-pubs* and *apex-ranked*\n\nUpdates occur **every 5 minutes**\n\nRequires:\n• Manage Channel Permissions\n• Send Message Permissions\n• Only Admins can enable automatic status',
        color: 3447003,
      };
      return await interaction.editReply({ embeds: [embedData] });
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Getting Status in Database (Help)';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  );
};
/**
 * Handler for when a user initiates the /status start command
 * Calls the getStatus handler to see for existing status in the guild
 * Passes a success and error callback with the former:
 * - Sending an information embed with context depending on status existence
 * - Sending Cancel and Start buttons; disabled depened on status existence
 */
const sendStartInteraction = async ({ interaction, nessie }) => {
  await getStatus(
    interaction.guildId,
    async (status) => {
      const embedData = {
        title: 'Status | Start',
        color: 3447003,
        description: status
          ? `There's currently an existing automated map status active in:\n• <#${status.pubs_channel_id}>\n• <#${status.ranked_channel_id}>\n\nCreated at ${status.created_at} by ${status.created_by}`
          : 'By confirming below, Nessie will create a new category channel and 2 new text channels for the automated map status:\n• `Apex Map Status`\n• `#apex-pubs`\n• `#apex-ranked`\n\nNessie will use these channels to send automatic updates every 5 minutes',
      };
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('statusStart__cancelButton')
            .setLabel('Cancel')
            .setStyle('SECONDARY')
            .setDisabled(status ? true : false)
        )
        .addComponents(
          new MessageButton()
            .setCustomId('statusStart__startButton')
            .setLabel(`Let's go!`)
            .setStyle('SUCCESS')
            .setDisabled(status ? true : false)
        );

      return await interaction.editReply({ components: [row], embeds: [embedData] });
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
 * Handler for when a user initiates the /status stop command
 * Calls the getStatus handler to see for existing status in the guild
 * Passes a success and error callback with the former sending an information embed with context depending on status existence
 */
const sendStopInteraction = async ({ interaction, nessie }) => {
  await getStatus(
    interaction.guildId,
    async (status) => {
      const embedData = {
        title: 'Status | Stop',
        color: 3447003,
        description: status
          ? `By confirming below, Nessie will stop the existing map status and delete these channels:\n• <#${
              status.category_channel_id
            }>\n• <#${status.pubs_channel_id}>\n• <#${
              status.ranked_channel_id
            }>\nThis status was created on ${status.created_at} by ${
              status.created_by
            }\n\nTo re-enable the automated map status after, simply use ${codeBlock(
              '/status start'
            )} again`
          : `There's currently no active automated map status to stop`,
      };
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('statusStop__cancelButton')
            .setLabel('Cancel')
            .setStyle('SECONDARY')
            .setDisabled(status ? false : true)
        )
        .addComponents(
          new MessageButton()
            .setCustomId('statusStop__stopButton')
            .setLabel(`Stop it!`)
            .setStyle('DANGER')
            .setDisabled(status ? false : true)
        );

      return await interaction.editReply({ components: [row], embeds: [embedData] });
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Getting Status in Database (Stop)';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  );
};
//----- Status Functions/Interactions -----//
/**
 * Generates relevant embeds for the status pubs channel
 * Currently only showing battle royale and arenas
 * Might put control in after double checking if it's still up in season 13
 */
const generatePubsStatusEmbeds = (data) => {
  const battleRoyaleEmbed = generatePubsEmbed(data.battle_royale);
  const arenasEmbed = generatePubsEmbed(data.arenas, 'Arenas');
  const informationEmbed = {
    description:
      '**Updates occur every 5 minutes**. This feature is currently in beta! For feedback and bug reports, feel free to drop them in the [support server](https://discord.com/invite/47Ccgz9jA4)!',
    color: 3447003,
    timestamp: Date.now(),
    footer: {
      text: 'Last Update',
    },
  };
  return [informationEmbed, battleRoyaleEmbed, arenasEmbed];
};
/**
 * Generates relevant embeds for the status ranked channel
 * Currently only showing battle royale and arenas
 */
const generateRankedStatusEmbeds = (data) => {
  const battleRoyaleEmbed = generateRankedEmbed(data.ranked);
  const arenasEmbed = generateRankedEmbed(data.arenasRanked, 'Arenas');
  const informationEmbed = {
    description:
      '**Updates occur every 5 minutes**. This feature is currently in beta! For feedback and bug reports, feel free to drop them in the [support server](https://discord.com/invite/47Ccgz9jA4)!',
    color: 3447003,
    timestamp: Date.now(),
    footer: {
      text: 'Last Update',
    },
  };
  return [informationEmbed, battleRoyaleEmbed, arenasEmbed];
};
/**
 * Handler for initialising the process of map status
 * Gets called when a user clicks the confirm button of the /status start reply
 * Main steps upon button click:
 * - Edits initial message with a loading state
 * - Calls the API for the rotation data
 * - Create embeds for each status channel
 * - Creates a category channel and 2 new text channels under it
 * - Sends embeds to respective channels
 * - Inserts a new Status row in our database with all the relevant data
 * - Edits initial message with a success message
 * -
 * TODO: Start the auto-update scheduler
 */
const createStatusChannels = async ({ nessie, interaction }) => {
  interaction.deferUpdate();
  try {
    /**
     * Since we defer the update, discord's loading state isn't long enough to last until every promise is done
     * To solve that, we'll edit the initial message with a loading embed
     * This is so that we prevent any extra clicks from users on the buttons
     **/
    const embedLoading = {
      description: `Loading status channels...`,
      color: 16776960,
    };
    await interaction.message.edit({ embeds: [embedLoading], components: [] });

    const rotationData = await getRotationData();
    const statusPubsEmbed = generatePubsStatusEmbeds(rotationData);
    const statusRankedEmbed = generateRankedStatusEmbeds(rotationData);

    // //Creates a category channel for better readability
    const statusCategory = await interaction.guild.channels.create('Apex Legends Map Status', {
      type: 'GUILD_CATEGORY',
    });
    //Creates the status channnel for pubs and ranked
    const statusPubsChannel = await interaction.guild.channels.create('apex-pubs', {
      parent: statusCategory,
    });
    const statusRankedChannel = await interaction.guild.channels.create('apex-ranked', {
      parent: statusCategory,
    });
    const statusPubsMessage = await statusPubsChannel.send({ embeds: statusPubsEmbed }); //Sends initial pubs embed in status channel
    const statusRankedMessage = await statusRankedChannel.send({ embeds: statusRankedEmbed }); //Sends initial ranked embed in status channel

    /**
     * Creates new status data object to be inserted in our database
     * We then call the insertNewStatus handler to start insertion
     * Passes a success and error callback with the former editing the original message with a success embed
     */
    const newStatus = {
      uuid: uuidv4(),
      guildId: interaction.guildId,
      categoryChannelId: statusCategory.id,
      pubsChannelId: statusPubsChannel.id,
      rankedChannelId: statusRankedChannel.id,
      pubsMessageId: statusPubsMessage.id,
      rankedMessageId: statusRankedMessage.id,
      createdBy: interaction.user.tag,
      createdAt: format(new Date(), 'dd MMM yyyy, h:mm a'),
    };
    await insertNewStatus(
      newStatus,
      async () => {
        const embedSuccess = {
          description: `Created map status at ${statusPubsChannel} and ${statusRankedChannel}`,
          color: 3066993,
        };
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
    const type = 'Status Start Button';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.message.edit({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
/**
 * Handler for cancelling the setup of /status start
 * Gets called when a user clicks the cancel button of the /status start reply
 * Pretty straightforward; we just edit the initial message with a cancel message
 */
const cancelStatusStart = async ({ nessie, interaction }) => {
  interaction.deferUpdate();

  try {
    const embedSuccess = {
      description: 'Cancelled automated map status setup',
      color: 16711680,
    };
    await interaction.message.edit({ embeds: [embedSuccess], components: [] });
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status Start Cancel Button';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.message.edit({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
/**
 * Handler for stopping the process of map status
 * Gets called when a user clicks the confirm button of the /status stop reply
 * Main steps upon button click:
 * - Edits initial message with a loading state
 * - Calls the deleteStatus handler which returns the status data while also deleting it from the db
 * - Fetches each of the relevant discord channels with the status data
 * - Deletes each of of the discord channels
 * - Edits initial message with a success message
 * -
 * TODO: Stop the auto-update-scheduler
 */
const deleteStatusChannels = async ({ interaction, nessie }) => {
  interaction.deferUpdate();
  await deleteStatus(
    interaction.guildId,
    async (status) => {
      try {
        if (status) {
          const embedLoading = {
            description: `Deleting status channels...`,
            color: 16776960,
          };
          await interaction.message.edit({ embeds: [embedLoading], components: [] });
          const pubsStatusChannel = await nessie.channels.fetch(status.pubs_channel_id);
          const rankedStatusChannel = await nessie.channels.fetch(status.ranked_channel_id);
          const categoryStatusChannel = await nessie.channels.fetch(status.category_channel_id);

          await pubsStatusChannel.delete();
          await rankedStatusChannel.delete();
          await categoryStatusChannel.delete();

          const embedSuccess = {
            description: `Automatic map status successfully deleted!`,
            color: 3066993,
          };
          await interaction.message.edit({ embeds: [embedSuccess], components: [] });
        }
      } catch (error) {
        const uuid = uuidv4();
        const type = 'Status Stop Button';
        const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
        await interaction.message.edit({ embeds: errorEmbed, components: [] });
        await sendErrorLog({ nessie, error, interaction, type, uuid });
      }
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Getting/Deleting Status in Database (Stop Button)';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.message.edit({ embeds: errorEmbed, components: [] });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  );
};
/**
 * Handler for cancelling the wizard of /status stop
 * Gets called when a user clicks the cancel button of the /status stop reply
 * Pretty straightforward; we just edit the initial message with a cancel message similar to the start handler
 */
const cancelStatusStop = async ({ nessie, interaction }) => {
  interaction.deferUpdate();

  try {
    const embedSuccess = {
      description: 'Cancelled automated map status deletion',
      color: 16711680,
    };
    await interaction.message.edit({ embeds: [embedSuccess], components: [] });
  } catch (error) {
    const uuid = uuidv4();
    const type = 'Status Stop Cancel Button';
    const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
    await interaction.message.edit({ embeds: errorEmbed, components: [] });
    await sendErrorLog({ nessie, error, interaction, type, uuid });
  }
};
/**
 * Handler in charge in updating map data in the relevant status channels
 * Uses the Scheduler class to create a cron job that fires every 10th second of every 5 minutes (0:5:10, 0:10:10, 0:15:10, etc)
 * When the cron job is executed, we then:
 * - Call the getAllStatus handler to get every existing status in our database
 * - Upon finishing the query, we then call the API for the current rotation data
 * - If there are no existing statuses, we don't do anything
 * - If there are, we then get all the relevant channels and messages from discord for each status
 * - We then edit those messages with embeds containing the current rotation
 * - After updating all the guild statuses, we then send a log to our status-log channel in discord
 * - Currently there's 4 calls to the discord API per status; fetches messages + editing them
 *
 * TODO: Figure out how to prevent getting rate limited
 */
const initialiseStatusScheduler = (nessie) => {
  return new Scheduler('10 */5 * * * *', async () => {
    getAllStatus(
      async (allStatus) => {
        try {
          const rotationData = await getRotationData();
          const statusLogChannel = nessie.channels.cache.get('976863441526595644');
          if (allStatus) {
            allStatus.forEach(async (status) => {
              const pubsChannel = nessie.channels.cache.get(status.pubs_channel_id);
              const rankedChannel = nessie.channels.cache.get(status.ranked_channel_id);
              const pubsMessage = await pubsChannel.messages.fetch(status.pubs_message_id);
              const rankedMessage = await rankedChannel.messages.fetch(status.ranked_message_id);

              const pubsEmbed = generatePubsStatusEmbeds(rotationData);
              const rankedEmbed = generateRankedStatusEmbeds(rotationData);

              await pubsMessage.edit({ embeds: pubsEmbed });
              await rankedMessage.edit({ embeds: rankedEmbed });
              //Figure out rate limiting prevention here
              //Docs say normal requests is 50 per second but idk if this falls into a special route case
              //Probably just take a risk and try to send 40 requests (10 servers) and then add a timeout of 1 second?
            });
          }
          const statusLogEmbed = {
            title: 'Nessie | Auto Map Status Log',
            description: 'Requested data from API and checked database',
            timestamp: Date.now(),
            color: 3066993,
            fields: [
              {
                name: 'Auto Map Status Count:',
                value: allStatus ? `${allStatus.length}` : '0',
                inline: true,
              },
            ],
          };
          await statusLogChannel.send({ embeds: [statusLogEmbed] });
        } catch (error) {
          const uuid = uuidv4();
          const type = 'Status Scheduler (Editing)';
          await sendErrorLog({ nessie, error, type, uuid, ping: true });
        }
      },
      async (error) => {
        const uuid = uuidv4();
        const type = 'Status Scheduler (Database)';
        await sendErrorLog({ nessie, error, type, uuid, ping: true });
      }
    );
  });
};
module.exports = {
  /**
   * Creates Status application command with relevant subcommands
   * Apparently when you create a subcommand under a base command, the base command will no longer be called
   * I.e /status becomes void and only '/status xyz' can be used as commands
   * I'm not sure why Discord did it this way but their explanation is the base command now becomes a folder of sorts
   * Was initially planning to have /status, /status start and /status stop with the former showing the command information
   * Not really a problem anyway since now it's /status help
   */
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
  /**
   * Send correct reply based on the user's subcommand input
   * Since we're opting to use button components, the actual status implementation can't be placed here when an application command is called
   * This is because buttons are also interactions similar to app commands (component interactions)
   * Upon clicking a button, a new interaction is retrieved by the interactionCreate listener and would have to be treated there
   * It's honestly going to be a maze trying to link things together here but it's the price of being trailblazers I guess
   */
  async execute({ nessie, interaction, mixpanel }) {
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          return await sendHelpInteraction({ interaction, nessie });
        case 'start':
          return await sendStartInteraction({ interaction, nessie });
        case 'stop':
          return await sendStopInteraction({ interaction, nessie });
      }
    } catch (error) {
      console.log(error);
    }
  },
  createStatusChannels,
  cancelStatusStart,
  cancelStatusStop,
  deleteStatusChannels,
  generatePubsStatusEmbeds,
  generateRankedStatusEmbeds,
  initialiseStatusScheduler,
};
