//Reminder to add custom prefix before v3
const { defaultPrefix } = require('../../config/nessie.json');

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

module.exports = {
  name: 'setprefix',
  description: "Sets nessie's prefix to a custom one",
  hasArguments: true,
  execute({message, arguments}) {
    
    if(!arguments){
      return message.channel.send('help embed go here');
    }
    if(arguments.startsWith("`") && arguments.endsWith("`") && arguments.length >= 2){
      if(arguments.length === 2){
        return message.channel.send('New prefix cannot be empty');
      }
      if(arguments.length > 2){
        return message.channel.send('New prefix successfully set!');
      }
    } else {
      return message.channel.send('To set a new prefix, make sure to add your new prefix between ``')
    }
  }
};
