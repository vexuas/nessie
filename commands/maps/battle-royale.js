const { getCurrentMapRotations } = require('../../adapters');

module.exports = {
  name: 'br',
  description: 'Shows currrent map rotation for battle royale mode',
  hasArguments: true,
  async execute({message, arguments}){
    message.channel.sendTyping();
    try {
      const data = await getCurrentMapRotations();
      const pubsData = data.battle_royale;
      const dataToSend = `Current Map: ${pubsData.current.map}\nNext Map: ${pubsData.next.map}`;
      if(arguments === 'ranked'){
        return message.channel.send('Battle Royale Ranked map command');
      }
      return message.channel.send(dataToSend);
    } catch(e){
      console.log(e); //Add proper error handling someday
    }
  }
}
