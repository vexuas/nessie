//Reminder to add custom prefix before v3
const { defaultPrefix } = require('../../config/nessie.json');
const {codeBlock} = require('../../helpers');
const { Permissions } = require('discord.js');

const generateEmbed = (prefix) => {
  const embed = {
    color: 3447003,
    fields: [
      {
        name: 'Current Prefix',
        value: prefix,
        inline: true
      },
      {
        name: 'Usage Example',
        value: `${prefix}help`,
        inline: true
      }
    ]
  };
  return [embed];
};
const generateErrorEmbed = (type, prefix) => {
  let embed = {
    color: 16711680,
    title: 'Whoops!',
    description: '',
    fields: [
      {
        name: 'Example',
        value: '```fix\n\n' + `${prefix}setprefix` +' `newPrefix`\n' + '```'
      }
    ]
  }
  switch(type){
    case 'empty':
     embed.description = 'New prefix cannot be empty!';
    break;
    case 'incorrect':
      embed.description = 'To set a new prefix, make sure to add your new prefix between ``';
    break;
    case 'admin': 
      embed.description = 'Only users with Admin privileges can set a new custom prefix';
      embed.fields = undefined;
    break;
  }
  return [embed];
}
module.exports = {
  name: 'setprefix',
  description: "Sets nessie's prefix to a custom one",
  hasArguments: true,
  execute({message, arguments, nessiePrefix}) {
    
    if(!arguments){
      return message.channel.send('help embed go here');
    }
    if(!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)){
      return message.channel.send({ embeds: generateErrorEmbed('admin', nessiePrefix)})
    }
    if(arguments.startsWith("`") && arguments.endsWith("`") && arguments.length >= 2){
      if(arguments.length === 2){
        return message.channel.send({embeds: generateErrorEmbed('empty', nessiePrefix)});
      }
      if(arguments.length > 2){
        const newPrefix = arguments.replace(/\`/g, '');
        return message.channel.send('New prefix successfully set!' + ` ${codeBlock(newPrefix)}`);
      }
    } else {
      return message.channel.send({embeds: generateErrorEmbed('incorrect', nessiePrefix)})
    }
  }
};
