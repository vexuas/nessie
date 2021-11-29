//Reminder to add custom prefix before v3
const { defaultPrefix } = require('../../config/nessie.json');
const {codeBlock} = require('../../helpers');
const { Permissions } = require('discord.js');
const sqlite = require('sqlite3').verbose();

const generateInfoEmbed = (prefix) => {
  const embed = {
    color: 3447003,
    title: 'Custom Prefix',
    description: 'To set a new prefix, add your new prefix between ``\n\nNote:\n1. Only users with Admin privileges can set a new custom prefix.\n2. Custom prefix cannot be empty.',
    fields: [{
      name: 'Example',
      value: '```fix\n\n' + `${prefix}setprefix` +' `newPrefixHere`\n' + '```'
    }],
  };
  return [embed];
};
const generateSuccessEmbed = (newPrefix) => {
  const embed = {
    color: 3066993,
    title: 'Yay!',
    description: 'New prefix successfully set!',
    fields: [{
      name: 'Current Prefix',
      value: codeBlock(newPrefix)
    },
    {
      name: 'Example Usage',
      value: codeBlock(`${newPrefix}br`)
    }
  ]
  }
  return [embed];
}
const generateErrorEmbed = (type, prefix) => {
  let embed = {
    color: 16711680,
    title: 'Whoops!',
    description: '',
    fields: [
      {
        name: 'Example',
        value: '```fix\n\n' + `${prefix}setprefix` +' `newPrefixHere`\n' + '```'
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
      return message.channel.send({embeds: generateInfoEmbed(nessiePrefix)});
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
        let database = new sqlite.Database('./database/nessie.db', sqlite.OPEN_READWRITE);

        database.run(`UPDATE Guild SET prefix = "${newPrefix}" WHERE uuid = ${message.guildId}`, err => {
          if(err){
            console.log(err);
          }
          return message.channel.send({embeds: generateSuccessEmbed(newPrefix)});
        });
      }
    } else {
      return message.channel.send({embeds: generateErrorEmbed('incorrect', nessiePrefix)})
    }
  }
};
