const { getBattleRoyalePubs, getBattleRoyaleRanked } = require('../../adapters');

/**
 * Gets url link image for each br map
 * Currently hosted scuffly in discord itself; might want to think of hosting it in cloudfront in the future
 */
const getMapUrl = (map) => {
  switch(map){
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
    default:
      return '';
  }
}
/**
 * Display the time left in a more aethestically manner
 * API returns in the form hr:min:sec (01:02:03)
 * Function returns hr hrs min mins sec secs (01 hrs 02 mins 03 secs);
 * Might want to think of using the number of remaining seconds instead of splitting the timer string in the future
 */
const getCountdown = (timer) => {
  const countdown = timer.split(':');
  const isOverAnHour = countdown[0] && countdown[0] !== '00';
  return `${isOverAnHour ? `${countdown[0]} hrs ` : ''}${countdown[1]} mins ${countdown[2]} secs`;
}
/**
 * Embed design for BR Pubs
 * Added a hack to display the time for next map regardless of timezone
 * As discord embed has a timestamp propery, I added the remianing milliseconds to the current date
 * Make reusable?
 */
const generatePubsEmbed = (data) => {
  const embedData = {
    title : "Battle Royale | Pubs",
    color : 3066993,
    image: {
      url: getMapUrl(data.current.code)
    },
    timestamp: Date.now() + data.current.remainingSecs*1000,
    footer: {
      text: `Next Map: ${data.next.map}`
    },
    fields: [
      {
        name: "Current map",
        value: "```fix\n\n" + data.current.map + "```",
        inline: true
      },
      {
        name: "Time left",
        value: "```xl\n\n" + getCountdown(data.current.remainingTimer) + "```",
        inline: true
      },
    ]
  };
  return [embedData];
}
/**
 * Embed design for BR Ranked
 * Fairly simple, don't need any fancy timers and footers
 */
 const generateRankedEmbed = (data) => {
  const embedData = {
    title : "Battle Royale | Ranked",
    color : 3066993,
    image: {
      url: getMapUrl(data.current.map)
    },
    fields: [
      {
        name: "Current map",
        value: "```fix\n\n" + data.current.map + "```",
        inline: true
      },
      {
        name: "Time left",
        value: "```xl\n\nRunning till end of split```",
        inline: true
      }
    ]
  };
  return [embedData];
}

module.exports = {
  name: 'br',
  description: 'Shows currrent map rotation for battle royale mode',
  hasArguments: true,
  async execute({message, arguments}){
    message.channel.sendTyping();
    try {
      if(!arguments){
        const data = await getBattleRoyalePubs();
        const embedToSend = generatePubsEmbed(data);
        return message.channel.send({ embeds: embedToSend });
      } else{
        if(arguments === 'ranked'){
          const data = await getBattleRoyaleRanked();
          const embedToSend = generateRankedEmbed(data);
          return message.channel.send({ embeds: embedToSend });
        }
        return message.channel.send("I don't understand that argument （・□・；）");
      }
    } catch(e){
      console.log(e); //Add proper error handling someday
    }
  }
}
