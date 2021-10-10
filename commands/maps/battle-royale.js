const { getBattleRoyalePubs, getBattleRoyaleRanked } = require('../../adapters');
const { MessageAttachment, MessageEmbed } = require('discord.js');

const getMapUrl = (map) => {
  switch(map){
    case 'kings_canyon_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544176815099954/kings_canyon.jpg';
    case 'worlds_edge_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544195488129034/worlds_edge.jpg';
    case 'olympus_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544165163323402/olympus_nessie.jpg';
    default:
      return '';
  }
}
const getCountdown = (timer) => {
  const countdown = timer.split(':');
  const isOverAnHour = countdown[0] && countdown[0] !== '00';
  return `${isOverAnHour ? `${countdown[0]} hrs ` : ''}${countdown[1]} mins ${countdown[2]} secs`;
}
const generateEmbed = ({message, data}) => {
  const embedData = {
    // title : "Battle Royale Pubs | Map Rotation",
    // title : "Map Rotation | Battle Royale Pubs",
    title : "Battle Royale Pubs",
    // title : "Map Rotation",
    // description: `${message.author} **| Battle Royale Pubs**`,
    color : 3066993,
    // thumbnail: {
    //   url: "https://cdn.discordapp.com/attachments/248430185463021569/894987994921046046/sir_nessie.jpeg"
    // },
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
      // {
      //   name: 'Next map',
      //   value: "```\n\n" + data.next.map + "```"
      //   // inline: true
      // }
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
        const embedToSend = generateEmbed({message, data});
        console.log(embedToSend);
        return message.channel.send({ embeds: embedToSend });
      } else{
        if(arguments === 'ranked'){
          const data = await getBattleRoyaleRanked();
          const dataToSend = `Current Map: ${data.current.map}\nNext Map: ${data.next.map}`;
          return message.channel.send(dataToSend);
        }
        return message.channel.send("I don't understand that argument （・□・；）");
      }
    } catch(e){
      console.log(e); //Add proper error handling someday
    }
  }
}
