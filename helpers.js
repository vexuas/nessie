const { format } = require('date-fns');

//----------
/**
 * Function to send health status so that I can monitor how the status update for br pub maps is doing
 * @data - br data object
 * @channel - log channel in Nessie's Canyon (#health: 899620845436141609)
 * @isAccurate - whether the data received is up-to-date
 */
const sendHealthLog = (data, channel, isAccurate) => {
  const utcStart = new Date(data.current.readableDate_start);
  const sgtStart = new Date(utcStart.getTime() + 28800000);
  const utcEnd = new Date(data.current.readableDate_end);
  const sgtEnd = new Date(utcEnd.getTime() + 28800000);

  const embed = {
    title: 'Nessie | Status Health Log',
    description: 'Requested data from API',
    color: isAccurate ? 3066993 : 16776960,
    thumbnail: {
      url: 'https://cdn.discordapp.com/attachments/889134541615292459/896698383593517066/sir_nessie.png',
    },
    fields: [
      {
        name: 'Current Map',
        value: `${codeBlock(data.current.map)} - ${codeBlock(format(sgtStart, 'hh:mm:ss aa'))}`,
      },
      {
        name: 'Next Map',
        value: `${codeBlock(data.next.map)} - ${codeBlock(format(sgtEnd, 'hh:mm:ss aa'))}`,
      },
      {
        name: 'Time left',
        value: codeBlock(`${data.current.remainingTimer} | ${data.current.remainingSecs} secs`),
      },
      {
        name: 'Requested At',
        value: codeBlock(format(new Date(), 'hh:mm:ss aa, dd MMM yyyy')),
      },
      {
        name: 'Accurate',
        value: isAccurate ? 'Yes' : 'No',
      },
    ],
  };
  isAccurate
    ? channel.send({ embeds: [embed] })
    : channel.send({ content: '<@183444648360935424>', embeds: [embed] });
};
//----------
/**
 * Function to create a text into a discord code block
 * @param text - text to transform
 */
const codeBlock = (text) => {
  return '`' + text + '`';
};
//----------
/**
 * Server Embed for when bot joining and leaving a server
 * Add iconURL logic to always return a png extension
 */
const serverEmbed = async (client, guild, status) => {
  let embedTitle;
  let embedColor;
  const defaultIcon =
    'https://cdn.discordapp.com/attachments/248430185463021569/614789995596742656/Wallpaper2.png';
  if (status === 'join') {
    embedTitle = 'Joined a new server';
    embedColor = 55296;
  } else if (status === 'leave') {
    embedTitle = 'Left a server';
    embedColor = 16711680;
  }

  const embed = {
    title: embedTitle,
    description: `I'm now in **${client.guilds.cache.size}** servers!`, //Removed users for now
    color: embedColor,
    thumbnail: {
      url: guild.icon ? guild.iconURL().replace(/jpeg|jpg/gi, 'png') : defaultIcon,
    },
    fields: [
      {
        name: 'Name',
        value: guild.name,
        inline: true,
      },
      {
        name: 'Owner',
        value:
          status === 'join'
            ? await guild.members.fetch(guild.ownerId).then((guildMember) => guildMember.user.tag)
            : '-',
        inline: true,
      },
      {
        name: 'Members',
        value: `${guild.memberCount}`,
        inline: true,
      },
    ],
  };
  return [embed];
};
//----------
/**
 * Sends a notification embed message to a specific channel
 * 889212328539725824: bot-development channel for Lochness development
 * 896710863459844136: servers channel for Nessie real guild data tracker
 * @param client - initialising discord client
 * @param guild  - guild data
 */
const sendGuildUpdateNotification = async (client, guild, type) => {
  const embed = await serverEmbed(client, guild, type);
  const channelId = checkIfInDevelopment(client) ? '889212328539725824' : '896710863459844136';
  const channelToSend = client.channels.cache.get(channelId);

  channelToSend.send({ embeds: embed });
  if (!checkIfInDevelopment(client)) {
    channelToSend.setTopic(`Servers: ${client.guilds.cache.size}`);
  }
};
//----------
/**
 * As I use Lochness for development and testing of new features, it is a bit annoying to clear testing notifications from channels that Nessie stores data in
 * This comes from hardcoding channels to log data in the event handlers.
 * To avoid dirtying the data and cluttering production channels, this function determines if the client is Bisolen and is being used for development
 * *** Updating to use Shizuka Test for all bot development needs ***
 * Lochness ID - 889208189017538572
 * Nessie ID - 889135055430111252
 * Shizuka Test ID - 929421200797626388
 */
const checkIfInDevelopment = (client) => {
  return client.user.id === '929421200797626388'; //Lochnesss' id (Development Bot)
};
//---------
/**
 * Generates an error embed to be replied to the user when an error occurs with a command
 * Mainly used for failed promises
 * @param message - error description/message
 * @param uuid - error uuid
 */
const generateErrorEmbed = (message, uuid) => {
  const embed = {
    description: `${message}\n\nError ID: ${uuid}\nAlternatively, you can also report issue through the [support server](https://discord.com/invite/47Ccgz9jA4)`,
    color: 16711680,
  };
  return [embed];
};
//----------
/**
 * Send error log with relevant information to the error-logs channel in the support server
 * Mainly used for failed promises
 * Probably think of a more efficient way of handling these errors; right now it does the job but looks to be cluttered
 * @param nessie - client
 * @param error - error object
 * @param message - discord message object
 * @param interaction - discord interaction object
 * @param type - which command the error originated from
 * @param uuid - error uuid
 */
const sendErrorLog = async ({ nessie, error, message, interaction, type, uuid }) => {
  const errorChannel = nessie.channels.cache.get('938441853542465548');
  const embed = {
    title: message ? `Error | ${type} Prefix Command` : `Error | ${type} Application Command`,
    color: 16711680,
    description: `uuid: ${uuid}\nError: ${error.message ? error.message : 'Unexpected Error'}`,
    fields: [
      {
        name: 'User',
        value: message ? message.author.username : interaction.user.username,
        inline: true,
      },
      {
        name: 'User ID',
        value: message ? message.author.id : interaction.user.id,
        inline: true,
      },
      {
        name: 'Channel',
        value: message ? message.channel.name : interaction.channel.name,
        inline: true,
      },
      {
        name: 'Channel ID',
        value: message ? message.channel.id : interaction.channelId,
        inline: true,
      },
      {
        name: 'Guild',
        value: message ? message.guild.name : interaction.guild.name,
        inline: true,
      },
      {
        name: 'Guild ID',
        value: message ? message.guild.id : interaction.guildId,
        inline: true,
      },
    ],
  };
  return await errorChannel.send({ embeds: [embed] });
};
const generateAnnouncementMessage = (prefix) => {
  return (
    '```diff\n' +
    `- Prefix commands will no longer be supported\n- Full information: ${prefix}announcement` +
    '```\n'
  );
};
//---------
module.exports = {
  checkIfInDevelopment,
  sendGuildUpdateNotification,
  serverEmbed,
  codeBlock,
  sendHealthLog,
  sendErrorLog,
  generateErrorEmbed,
  generateAnnouncementMessage,
};
