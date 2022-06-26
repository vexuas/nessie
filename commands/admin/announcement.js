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

/**
 * Most of the functions here were from the status command so some of the code might be referencing status
 * Pivoted temporarily to become announcements as we can't scale due to Discord limitations
 * Instead of updating every guild with a message, we're just gonna update announcement channels in Nessie's Discord server
 * Temporary as I want to still get the updates on people's own servers
 * More reading her:L https://shizuka.notion.site/Adventures-in-Discord-s-Rate-Limits-4ef7fa20481f4e3b8a388d9cdb1021e7
 **/
//-------------
/**
 * Handler for when a user initiates the /announcement start command
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
        title: 'Announcement | Start',
        color: 3447003,
        description: status
          ? `There's currently an existing automated map status active in:\n• <#${status.br_channel_id}>\n• <#${status.arenas_channel_id}>\n\nCreated at ${status.created_at} by ${status.created_by}`
          : 'By confirming below, Nessie will create a new category channel and 2 new announcement channels for the automated map status:\n• `Apex Legends Map Status`\n• `#apex-battle-royale`\n• `#apex-arenas`\n\nNessie will use these channels to send automatic updates every 15 minutes',
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
 * Handler for when a user initiates the /announcement stop command
 * Calls the getStatus handler to see for existing status in the guild
 * Passes a success and error callback with the former sending an information embed with context depending on status existence
 */
const sendStopInteraction = async ({ interaction, nessie }) => {
  await getStatus(
    interaction.guildId,
    async (status) => {
      const embedData = {
        title: 'Announcement | Stop',
        color: 3447003,
        description: status
          ? `By confirming below, Nessie will stop the existing map status and delete these channels:\n• <#${
              status.category_channel_id
            }>\n• <#${status.br_channel_id}>\n• <#${
              status.arenas_channel_id
            }>\nThis status was created on ${status.created_at} by ${
              status.created_by
            }\n\nTo re-enable the automated map status after, simply use ${codeBlock(
              '/announcement start'
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
 * Handler for initialising the process of map status
 * Gets called when a user clicks the confirm button of the /announcement start reply
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
    const statusBattleRoyaleEmbed = generateBattleRoyaleStatusEmbeds(rotationData);
    const statusArenasEmbed = generateArenasStatusEmbeds(rotationData);
    /**
     * Gets the @everyone role of the guild
     * This is very important as users who are able to send messages in the announcement channel won't be able to follow it
     * Quite a weird bug, or maybe intentional by Discord? I think it's a bug tho
     * To fix this, we have to set the created channels with permission overwrites of not being able to send messages
     */
    const everyoneRole = interaction.guild.roles.cache.find((role) => role.name === '@everyone');

    // //Creates a category channel for better readability
    const statusCategory = await interaction.guild.channels.create('Apex Legends Map Status', {
      type: 'GUILD_CATEGORY',
    });
    //Creates the status channnel for pubs and ranked
    const statusBattleRoyaleChannel = await interaction.guild.channels.create(
      'apex-battle-royale',
      {
        parent: statusCategory,
        type: 'GUILD_NEWS',
        permissionOverwrites: [
          {
            id: everyoneRole.id,
            deny: ['SEND_MESSAGES'],
          },
        ],
      }
    );
    const statusArenasChannel = await interaction.guild.channels.create('apex-arenas', {
      parent: statusCategory,
      type: 'GUILD_NEWS',
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          deny: ['SEND_MESSAGES'],
        },
      ],
    });
    const statusBattleRoyaleMessage = await statusBattleRoyaleChannel.send({
      embeds: statusBattleRoyaleEmbed,
    }); //Sends initial pubs embed in status channel
    const statusArenasMessage = await statusArenasChannel.send({ embeds: statusArenasEmbed }); //Sends initial ranked embed in status channel

    await statusBattleRoyaleMessage.crosspost();
    await statusArenasMessage.crosspost();
    /**
     * Creates new status data object to be inserted in our database
     * We then call the insertNewStatus handler to start insertion
     * Passes a success and error callback with the former editing the original message with a success embed
     */
    const newStatus = {
      uuid: uuidv4(),
      guildId: interaction.guildId,
      categoryChannelId: statusCategory.id,
      battleRoyaleChannelId: statusBattleRoyaleChannel.id,
      arenasChannelId: statusArenasChannel.id,
      battleRoyaleMessageId: statusBattleRoyaleMessage.id,
      arenasMessageId: statusArenasMessage.id,
      createdBy: interaction.user.tag,
      createdAt: format(new Date(), 'dd MMM yyyy, h:mm a'),
    };
    await insertNewStatus(
      newStatus,
      async () => {
        const embedSuccess = {
          description: `Created map status at ${statusBattleRoyaleChannel} and ${statusArenasChannel}`,
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
 * Handler for cancelling the setup of /announcement start
 * Gets called when a user clicks the cancel button of the /announcement start reply
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
 * Gets called when a user clicks the confirm button of the /announcement stop reply
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
          const battleRoyaleStatusChannel = await nessie.channels.fetch(status.br_channel_id);
          const arenasStatusChannel = await nessie.channels.fetch(status.arenas_channel_id);
          const categoryStatusChannel = await nessie.channels.fetch(status.category_channel_id);

          await battleRoyaleStatusChannel.delete();
          await arenasStatusChannel.delete();
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
 * Handler for cancelling the wizard of /announcement stop
 * Gets called when a user clicks the cancel button of the /announcement stop reply
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
 *
 * Update 4 June 2022:
 * Keeping the above comment for context
 * After looking into rate limits, it's not possible to do status this way in a large scale
 * Temporarily pivoting to making it update through announcement channels
 * Users will have to join Nessie's discord server and follow the channel but this makes it easier for us as we only have to update 1 set of status
 * Since the functionalitiy is more or less the same, I'm opting to use the same function with some additions
 *
 * Current flow:
 * - Call the getAllStatus handler to get every existing status in our database
 * - Upon finishing the query, we then call the API for the current rotation data
 * - If there are no existing statuses, we don't do anything
 * - If there are, we then get all the relevant channels and messages from discord for the first status
 * - We then delete those messages
 * - We then send new messages to the relevant channels with an updated embed of rotation data
 * - After sending the messages, we then update the status in our database with the new message ids
 * - After the update query, we then publish the messages
 * - Finally we send a log to our status-log channel in discord
 */
const initialiseStatusScheduler = (nessie) => {
  return new Scheduler('10 */15 * * * *', async () => {
    getAllStatus(
      async (allStatus, client) => {
        try {
          const rotationData = await getRotationData();
          const statusLogChannel = nessie.channels.cache.get('976863441526595644');
          if (allStatus) {
            const status = allStatus[0];
            const battleRoyaleChannel = nessie.channels.cache.get(status.br_channel_id);
            const arenasChannel = nessie.channels.cache.get(status.arenas_channel_id);
            const battleRoyaleMessage = await battleRoyaleChannel.messages.fetch(
              status.br_message_id
            );
            const arenasMessage = await arenasChannel.messages.fetch(status.arenas_message_id);

            const battleRoyaleEmbed = generateBattleRoyaleStatusEmbeds(rotationData);
            const arenasEmbed = generateArenasStatusEmbeds(rotationData);

            await battleRoyaleMessage.delete();
            await arenasMessage.delete();

            const newBattleRoyaleMessage = await battleRoyaleChannel.send({
              embeds: battleRoyaleEmbed,
            });
            const newArenasMessage = await arenasChannel.send({ embeds: arenasEmbed });

            /**
             * Tbh I'm a bit worried about having this query here
             * It seems to be working during development but I'm not sure if it's actually firing only after the message promises are done
             * Probably still not confident with database stuff; I'll just keep my fingers crossed heh
             */
            client.query(
              'UPDATE Status SET br_message_id = ($1), arenas_message_id = ($2) WHERE uuid = ($3)',
              [`${newBattleRoyaleMessage.id}`, `${newArenasMessage.id}`, `${status.uuid}`],
              (err, res) => {
                client.query('COMMIT', async () => {
                  await newBattleRoyaleMessage.crosspost();
                  await newArenasMessage.crosspost();
                });
              }
            );
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
          const type = 'Status Scheduler Config';
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
const sendRestartInteraction = ({ interaction, type }) => {
  getStatus(
    interaction.guildId,
    async (status) => {
      const embedData = {
        title: `Announcement | Restart ${type}`,
        color: 3447003,
        description: status
          ? `This will restart: ${codeBlock(type)} on\n• <#${status.br_channel_id}>\n• <#${
              status.arenas_channel_id
            }>\n`
          : `There's currently no active map status to stop`,
      };
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('statusRestart__cancelButton')
            .setLabel('Cancel')
            .setStyle('SECONDARY')
            .setDisabled(!status ? true : false)
        )
        .addComponents(
          new MessageButton()
            .setCustomId(`statusRestart__${type}Button`)
            .setLabel('Restart')
            .setStyle('SUCCESS')
            .setDisabled(!status ? true : false)
        );
      return await interaction.editReply({ components: [row], embeds: [embedData] });
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Getting Status in Database (Restart)';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  );
};
const restartStatus = ({ interaction, nessie, restartId }) => {
  console.log(restartId);
  return getAllStatus(
    async (allStatus, client) => {
      try {
        const rotationData = await getRotationData();
        const statusLogChannel = nessie.channels.cache.get('976863441526595644');
        if (allStatus) {
          const status = allStatus[0];
          const battleRoyaleChannel = nessie.channels.cache.get(status.br_channel_id);
          const arenasChannel = nessie.channels.cache.get(status.arenas_channel_id);
          const battleRoyaleMessage = await battleRoyaleChannel.messages.fetch(
            status.br_message_id
          );
          const arenasMessage = await arenasChannel.messages.fetch(status.arenas_message_id);

          const battleRoyaleEmbed = generateBattleRoyaleStatusEmbeds(rotationData);
          const arenasEmbed = generateArenasStatusEmbeds(rotationData);

          await battleRoyaleMessage.delete();
          await arenasMessage.delete();

          const newBattleRoyaleMessage = await battleRoyaleChannel.send({
            embeds: battleRoyaleEmbed,
          });
          const newArenasMessage = await arenasChannel.send({ embeds: arenasEmbed });

          /**
           * Tbh I'm a bit worried about having this query here
           * It seems to be working during development but I'm not sure if it's actually firing only after the message promises are done
           * Probably still not confident with database stuff; I'll just keep my fingers crossed heh
           */
          client.query(
            'UPDATE Status SET br_message_id = ($1), arenas_message_id = ($2) WHERE uuid = ($3)',
            [`${newBattleRoyaleMessage.id}`, `${newArenasMessage.id}`, `${status.uuid}`],
            (err, res) => {
              client.query('COMMIT', async () => {
                // await newBattleRoyaleMessage.crosspost();
                // await newArenasMessage.crosspost();
              });
            }
          );
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
        const embedSuccess = {
          description: `Successfully restarted map status`,
          color: 3066993,
        };
        await interaction.message.edit({ embeds: [embedSuccess], components: [] });
      } catch (error) {
        const uuid = uuidv4();
        const type = 'Status Restart';
        const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
        await interaction.message.edit({ embeds: errorEmbed, components: [] });
        await sendErrorLog({ nessie, error, type, uuid, ping: true });
      }
    },
    async (error) => {
      const uuid = uuidv4();
      const type = 'Status Restart (Database)';
      await sendErrorLog({ nessie, error, type, uuid, ping: true });
    }
  );
};
module.exports = {
  /**
   * Creates Status application command with relevant subcommands
   * Apparently when you create a subcommand under a base command, the base command will no longer be called
   * I.e /status becomes void and only '/status xyz' can be used as commands
   * I'm not sure why Discord did it this way but their explanation is the base command now becomes a folder of sorts
   * Was initially planning to have /status, /status start and /status stop with the former showing the command information
   * Not really a problem anyway since now it's /status help
   *
   * TODO: Check if it's possible to have default permissions when creating commands
   * Alternative is to manaully set it inside the guild settings
   */
  isAdmin: true,
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription("Sets automated map updates on Nessie's announcement channels")
    .addSubcommand((subCommand) =>
      subCommand.setName('start').setDescription('Starts the automated map status')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('stop').setDescription('Stops an existing automated status')
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName('restart')
        .setDescription('Restarts automated status')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Restart Type')
            .setRequired(true)
            .addChoice('All', 'all')
            .addChoice('All Missing', 'allMissing')
            .addChoice('Br Missing', 'brMissing')
            .addChoice('Arenas Missing', 'arenasMissing')
        )
    ),
  /**
   * Send correct reply based on the user's subcommand input
   * Since we're opting to use button components, the actual status implementation can't be placed here when an application command is called
   * This is because buttons are also interactions similar to app commands (component interactions)
   * Upon clicking a button, a new interaction is retrieved by the interactionCreate listener and would have to be treated there
   * It's honestly going to be a maze trying to link things together here but it's the price of being trailblazers I guess
   */
  async execute({ nessie, interaction }) {
    const statusOption = interaction.options.getSubcommand();
    const optionType = interaction.options.getString('type');
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'start':
          return await sendStartInteraction({ interaction, nessie });
        case 'stop':
          return await sendStopInteraction({ interaction, nessie });
        case 'restart':
          return sendRestartInteraction({ interaction, type: optionType });
      }
    } catch (error) {
      console.log(error);
    }
  },
  cancelStatusStart,
  cancelStatusStop,
  createStatusChannels,
  deleteStatusChannels,
  initialiseStatusScheduler,
  restartStatus,
};
