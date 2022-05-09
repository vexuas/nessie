const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const { getBattleRoyalePubs, getBattleRoyaleRanked } = require('../../adapters');
const { nessieLogo } = require('../../constants');
const Scheduler = require('../../scheduler');

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
const getCountdown = (timer) => {
  const countdown = timer.split(':');
  const isOverAnHour = countdown[0] && countdown[0] !== '00';
  return `${isOverAnHour ? `${countdown[0]} hr ` : ''}${countdown[1]} mins ${countdown[2]} secs`;
};
const generateHelpEmbed = () => {
  const embedData = {
    title: 'Status | Help',
    description:
      'This command will send automatic updates of Apex Legends Maps in 2 new channels: *apex-pubs* and *apex-ranked*\n\nUpdates occur **every 15 minutes**\n\nRequires:\n• Manage Channel Permissions\n• Send Message Permissions\n• Only Admins can enable automatic status',
    color: 3447003,
  };
  return [embedData];
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

  await interaction.editReply({ components: [row], embeds: [embedData] });
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
module.exports = {
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

  async execute({ nessie, interaction, mixpanel }) {
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          const embedToSend = generateHelpEmbed();
          await interaction.editReply({ embeds: embedToSend });
          break;
        case 'start':
          await sendStartInteraction(interaction);
          // const pubsData = await getBattleRoyalePubs();
          // const rankedData = await getBattleRoyaleRanked();
          // const pubsEmbed = generatePubsEmbed(pubsData);
          // const rankedEmbed = generateRankedEmbed(rankedData);
          // // //Creates a category channel for better readability
          // const statusCategory = await interaction.guild.channels.create(
          //   'Apex Legends Map Status',
          //   {
          //     type: 'GUILD_CATEGORY',
          //   }
          // );
          // //Creates the status channnel for br
          // const statusPubsChannel = await interaction.guild.channels.create('apex-pubs', {
          //   parent: statusCategory,
          // });
          // const statusRankedChannel = await interaction.guild.channels.create('apex-ranked', {
          //   parent: statusCategory,
          // });
          // const statusPubsMessage = await statusPubsChannel.send({ embeds: pubsEmbed }); //Sends initial br embed in status channel
          // const statusRankedMessage = await statusRankedChannel.send({ embeds: rankedEmbed });
          // await interaction.editReply(
          //   `Created map status at ${statusPubsChannel} and ${statusRankedChannel}`
          // ); //Sends success message in channel where command got instantiated
          break;
        case 'stop':
          await interaction.editReply('Status Stop Command');
          break;
      }
    } catch (error) {
      console.log(error);
    }
  },
};
