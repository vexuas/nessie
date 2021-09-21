module.exports = {
  name: 'br',
  description: 'Shows currrent map rotation for battle royale mode',
  hasArguments: true,
  async execute({message, arguments}){
    if(arguments === 'ranked'){
      return await message.channel.send('Battle Royale Ranked map command');
    }
    return message.channel.send('Battle Royale map command!');
  }
}
