const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { getBattleRoyalePubs, getBattleRoyaleRanked } = require('../../adapters');

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
const sendStopInteraction = async (interaction) => {
  const embedData = {
    title: 'Status | Stop',
    color: 3447003,
    description:
      'By confirming below, Nessie will stop the existing map status and delete these channels:\n• Apex Map Status\n• #apex-pubs\n• #apex-ranked\n\nTo re-enable the automated map status after, simply use `/status start` again',
  };
  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('statusStop__cancelButton')
        .setLabel('Cancel')
        .setStyle('SECONDARY')
    )
    .addComponents(
      new MessageButton()
        .setCustomId('statusStop__stopButton')
        .setLabel(`Stop it!`)
        .setStyle('DANGER')
    );

  return await interaction.editReply({ components: [row], embeds: [embedData] });
};
/**
 * Gets url link image for each br map
 * Using custom images as the image links sent by API are desaturated for some reason
 * Currently hosted scuffly in discord itself; might want to think of hosting it in cloudfront in the future
 */
const getMapUrl = (map) => {
  switch (map) {
    case 'kings_canyon_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544176815099954/kings_canyon.jpg';
    case 'Kings Canyon':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544176815099954/kings_canyon.jpg';
    case 'worlds_edge_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544195488129034/worlds_edge.jpg';
    case `World's Edge`:
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544195488129034/worlds_edge.jpg';
    case 'olympus_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544165163323402/olympus_nessie.jpg';
    case 'Olympus':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544165163323402/olympus_nessie.jpg';
    case 'Storm Point':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/911631835300237332/storm_point_nessie.jpg';
    case 'storm_point_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/911631835300237332/storm_point_nessie.jpg';
    default:
      return '';
  }
};
/**
 * Display the time left in a more aethestically manner
 * API returns in the form hr:min:sec (01:02:03)
 * Function returns hr hrs min mins sec secs (01 hrs 02 mins 03 secs);
 * Might want to think of using the number of remaining seconds instead of splitting the timer string in the future
 */
const getCountdown = (timer) => {
  const countdown = timer.split(':');
  const isOverAnHour = countdown[0] && countdown[0] !== '00';
  const isOverADay = countdown[0] && parseInt(countdown[0]) >= 24;

  //Since ranked br is usually one map for the whole split, good to show days as well rather than just the usual hours
  if (isOverADay) {
    const countdownDays = parseInt(countdown[0]) / 24;
    const countdownHours = parseInt(countdown[0]) % 24;
    return `${Math.floor(countdownDays)} days ${countdownHours} hrs ${countdown[1]} mins`;
  }
  return `${isOverAnHour ? `${countdown[0]} hr ` : ''}${countdown[1]} mins ${countdown[2]} secs`;
};
const generatePubsEmbed = (data) => {
  const embedData = {
    title: 'Battle Royale | Pubs',
    color: 3066993,
    image: {
      url: getMapUrl(data.current.code),
    },
    timestamp: Date.now() + data.current.remainingSecs * 1000,
    footer: {
      text: `Next Map: ${data.next.map}`,
    },
    fields: [
      {
        name: 'Current map',
        value: '```fix\n\n' + data.current.map + '```',
        inline: true,
      },
      {
        name: 'Time left',
        value: '```xl\n\n' + getCountdown(data.current.remainingTimer) + '```',
        inline: true,
      },
    ],
  };
  return [embedData];
};
const generateRankedEmbed = (data) => {
  const embedData = {
    title: 'Battle Royale | Ranked',
    color: 7419530,
    image: {
      url: getMapUrl(data.current.map),
    },
    fields: [
      {
        name: 'Current map',
        value: '```fix\n\n' + data.current.map + '```',
        inline: true,
      },
      {
        name: 'Time left',
        value: '```xl\n\n' + getCountdown(data.current.remainingTimer) + '```',
        inline: true,
      },
    ],
  };
  return [embedData];
};
const createStatusChannel = async (interaction) => {
  interaction.deferUpdate();
  const embedLoading = {
    description: `Loading status channels...`,
    color: 16776960,
  };
  await interaction.message.edit({ embeds: [embedLoading], components: [] }); //Sends success message in channel where command got instantiated
  const pubsData = await getBattleRoyalePubs();
  const rankedData = await getBattleRoyaleRanked();
  const pubsEmbed = generatePubsEmbed(pubsData);
  const rankedEmbed = generateRankedEmbed(rankedData);
  // //Creates a category channel for better readability
  const statusCategory = await interaction.guild.channels.create('Apex Legends Map Status', {
    type: 'GUILD_CATEGORY',
  });
  //Creates the status channnel for br
  const statusPubsChannel = await interaction.guild.channels.create('apex-pubs', {
    parent: statusCategory,
  });
  const statusRankedChannel = await interaction.guild.channels.create('apex-ranked', {
    parent: statusCategory,
  });
  const statusPubsMessage = await statusPubsChannel.send({ embeds: pubsEmbed }); //Sends initial br embed in status channel
  const statusRankedMessage = await statusRankedChannel.send({ embeds: rankedEmbed });
  const embedSuccess = {
    description: `Created map status at ${statusPubsChannel} and ${statusRankedChannel}`,
    color: 3066993,
  };
  await interaction.message.edit({ embeds: [embedSuccess], components: [] }); //Sends success message in channel where command got instantiated
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
          return await sendHelpInteraction(interaction);
          break;
        case 'start':
          return await sendStartInteraction(interaction);
        case 'stop':
          return await sendStopInteraction(interaction);
      }
    } catch (error) {
      console.log(error);
    }
  },
  createStatusChannel,
};
