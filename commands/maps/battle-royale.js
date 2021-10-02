const { getBattleRoyalePubs, getBattleRoyaleRanked } = require('../../adapters');

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
        return message.channel.send(dataToSend);
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
