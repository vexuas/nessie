const { SlashCommandBuilder } = require('@discordjs/builders');
const { getBattleRoyalePubs } = require('../../adapters');
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
    console.log(statusOption);
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          await interaction.editReply('Status Help Command');
          break;
        case 'start':
          await interaction.editReply('Status Start Command');
          // const data = await getBattleRoyalePubs();
          // const embedToSend = generatePubsEmbed(data);
          // // //Creates a category channel for better readability
          // const statusCategory = await interaction.guild.channels.create('Apex Legends Map Status', {
          //   type: 'GUILD_CATEGORY',
          // });
          // //Creates the status channnel for br
          // const statusChannel = await interaction.guild.channels.create('apex-pubs', {
          //   parent: statusCategory,
          // });
          // const statusMessage = await statusChannel.send({ embeds: embedToSend }); //Sends initial br embed in status channel
          // await interaction.editReply(`Created map status at ${statusChannel}`); //Sends success message in channel where command got instantiated
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
