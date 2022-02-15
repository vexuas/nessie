const { codeBlock, generateAnnouncementMessage } = require('../../helpers');
const { Permissions } = require('discord.js');
const { setCustomPrefix } = require('../../database/handler');
const sqlite = require('sqlite3').verbose();

//Embed to show when sending information about setprefix
const generateInfoEmbed = (prefix) => {
  const embed = {
    color: 3447003,
    title: 'Custom Prefix',
    description:
      generateAnnouncementMessage(prefix) +
      'To set a new prefix, add your new prefix between ``\n\nNote:\n1. Only users with Admin privileges can set a new custom prefix.\n2. Custom prefix cannot be empty.',
    fields: [
      {
        name: 'Example',
        value: '```fix\n\n' + `${prefix}setprefix` + ' `newPrefixHere`\n' + '```',
      },
    ],
  };
  return [embed];
};
//Embed to show after setting new custom prefix
const generateSuccessEmbed = (newPrefix) => {
  const embed = {
    color: 3066993,
    title: 'Yay!',
    description: 'New prefix successfully set!',
    fields: [
      {
        name: 'Current Prefix',
        value: codeBlock(newPrefix),
      },
      {
        name: 'Example Usage',
        value: codeBlock(`${newPrefix}br`),
      },
    ],
  };
  return [embed];
};
/**
 * Embeds to show when user wrongly uses the command
 * 'empty': when setting a new prefix is empty ``
 * 'incorrect': when setting a new prefix without ``
 * 'admin': when setting a new prefix when user is not an admin
 */
const generateErrorEmbed = (type, prefix) => {
  let embed = {
    color: 16711680,
    title: 'Whoops!',
    description: '',
    fields: [
      {
        name: 'Example',
        value: '```fix\n\n' + `${prefix}setprefix` + ' `newPrefixHere`\n' + '```',
      },
    ],
  };
  switch (type) {
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
};
const generateDeprecationEmbed = (prefix) => {
  const embed = {
    color: 16711680,
    description:
      'Whoops! This command is no longer supported\n\n' + generateAnnouncementMessage(prefix),
  };
  return [embed];
};
module.exports = {
  name: 'setprefix',
  description: "Sets nessie's prefix to a custom one",
  hasArguments: true,
  execute({ message, arguments, nessiePrefix }) {
    // Temporary check; to ease the transition we don't want to support custom prefix for prefix users that have never used it before
    if (nessiePrefix === '$nes-') {
      return message.channel.send({ embeds: generateDeprecationEmbed(nessiePrefix) });
    }
    //When user only types setprefix; shows information about command
    if (!arguments) {
      return message.channel.send({ embeds: generateInfoEmbed(nessiePrefix) });
    }
    //When user is not an admin; shows admin error message
    if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      return message.channel.send({ embeds: generateErrorEmbed('admin', nessiePrefix) });
    }
    /**
     * If user sets the new prefix correctly with ``
     * - if the number of arguments are exactly 2, send error empty message
     * - if the number of arguments are more than 2, parse out grave accents and update guild prefix with new prefix in our database
     * Else send incorrect error message
     */
    if (arguments.startsWith('`') && arguments.endsWith('`') && arguments.length >= 2) {
      if (arguments.length === 2) {
        return message.channel.send({ embeds: generateErrorEmbed('empty', nessiePrefix) });
      }
      if (arguments.length > 2) {
        const newPrefix = arguments.replace(/\`/g, '');
        const successEmbed = generateSuccessEmbed(newPrefix);
        setCustomPrefix(message, newPrefix, successEmbed);
      }
    } else {
      return message.channel.send({ embeds: generateErrorEmbed('incorrect', nessiePrefix) });
    }
  },
};
