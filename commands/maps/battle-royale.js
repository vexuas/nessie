const { getBattleRoyalePubs, getBattleRoyaleRanked } = require('../../adapters');

const generateEmbed = ({message, dataToSend}) => {
  const embedData = {
    "title": "Battle Royale Pubs | Map Rotation",
    "description": dataToSend,
    "color": 3066993,
    "thumbnail": {
      "url": "https://cdn.discordapp.com/attachments/248430185463021569/894987994921046046/sir_nessie.jpeg"
    },
    "image": {
      "url": "https://apexlegendsstatus.com/assets/maps/Olympus.png"
    },
    "fields": [
      {
        "name": "Current Map",
        "value": "```cs\n\nOlympus```"
      },
      {
        "name": "Left",
        "value": "```fix\n\nOlympus```"
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
        const dataToSend = `Current Map: ${data.current.map}\nNext Map: ${data.next.map}`;
        const embedToSend = generateEmbed({message, dataToSend});
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
