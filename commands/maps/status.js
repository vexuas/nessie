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
  name: 'status',
  description: 'Creates a channel to automatically show current map status',
  hasArguments: false,
  async execute({ nessie, message }) {
    //EXPERIMENTAL FOR NOW; Just wanted to see how feasible it is to do automated updates
    message.channel.sendTyping();
    try {
      const data = await getBattleRoyalePubs();
      const embedToSend = generatePubsEmbed(data);
      //Creates a category channel for better readability
      const statusCategory = await message.guild.channels.create(
        'Apex Legends Map Status [Nessie]',
        {
          type: 'GUILD_CATEGORY',
        }
      );
      //Creates the status channnel for br
      const statusChannel = await message.guild.channels.create('battle-royale', {
        parent: statusCategory,
      });
      const statusMessage = await statusChannel.send({ embeds: embedToSend }); //Sends initial br embed in status channel
      await message.channel.send(`Created map status at ${statusChannel}`); //Sends success message in channel where command got instantiated

      /**
       * Creates a new scheduler instance that will fire the callback every minute from 0:00
       * Callback:
       * - Gets current data from API
       * - Edits the status message with the updated embed data
       */
      const statusUpdate = new Scheduler('0 */1 * * * *', async () => {
        const updatedData = await getBattleRoyalePubs();
        const updatedEmbed = generatePubsEmbed(updatedData);
        await statusMessage.edit({ embeds: updatedEmbed });
      });
      statusUpdate.start(); //Starts the scheduler
    } catch (error) {
      console.log(error);
    }
  },
};
