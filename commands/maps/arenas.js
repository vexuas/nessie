module.exports = {
  name: 'arenas',
  description: 'Shows currrent map rotation for arenas mode',
  hasArguments: true,
  async execute({message, arguments}){
    if(arguments === 'ranked'){
      return await message.channel.send('Arenas Ranked map command');
    }
    return await message.channel.send('Arenas map command!');
  }
}
