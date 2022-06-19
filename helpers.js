const { format } = require('date-fns');
const { nessieLogo } = require('./constants');
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
      url: nessieLogo,
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
 * Added an extra layer of complication for the sake of easy announcements
 * Ever since the disastrous outage of the API for a full day and the influx of users to the support server, I realised a generic message isn't gonna cut it
 * Although we won't be able to fix the issues of the API on our end, we can at least let users know what's going on
 * Instead of passing a message to the function, it now gets a specific message from the support server
 * With this, I can edit that message to reflect the current situation and it'll be shown along with the error message
 * @param message - error description/message
 * @param uuid - error uuid
 * @param nessie = client
 */
const generateErrorEmbed = async (error, uuid, nessie) => {
  //To get a specific message, we need to get the channel it's in before fetching it
  const alertChannel = nessie.channels.cache.get('973977422699573258');
  const messageObject = await alertChannel.messages.fetch('973981539731922946');
  const errorMessage = messageObject.content;
  //Since the message is inside a code block we want to trim everything outside of it; made a hack of wrapping it between [] to make it easier to trim
  const errorAlert = errorMessage.substring(
    errorMessage.indexOf('[') + 4,
    errorMessage.lastIndexOf(']') - 3
  );

  const embed = {
    description: `${errorAlert}\n\nError: ${
      error.message ? codeBlock(error.message) : codeBlock('Unexpected Error')
    }\nError ID: ${codeBlock(
      uuid
    )}\nAlternatively, you can also report issue through the [support server](https://discord.gg/FyxVrAbRAd`,
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
 * @param ping - whether to ping me if an error occured; default false
 */
const sendErrorLog = async ({ nessie, error, message, interaction, type, uuid, ping = false }) => {
  const errorChannel = nessie.channels.cache.get('938441853542465548');
  const embed = {
    title: message ? `Error | ${type} Prefix Command` : `Error | ${type} Application Command`,
    color: 16711680,
    description: `uuid: ${uuid}\nError: ${error.message ? error.message : 'Unexpected Error'}`,
    fields:
      message || interaction
        ? [
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
          ]
        : [],
  };
  return ping
    ? await errorChannel.send({ embeds: [embed], content: '<@183444648360935424>' })
    : await errorChannel.send({ embeds: [embed] });
};
const generateAnnouncementMessage = (prefix) => {
  return (
    '```diff\n' +
    `- Prefix commands will no longer be supported\n- Full information: ${prefix}announcement` +
    '```\n'
  );
};
/**
 * Gets url link image for each br map
 * Using custom images as the image links sent by API are desaturated for some reason
 * Currently hosted scuffly in discord itself; might want to think of hosting it in cloudfront in the future
 * TODO: Figure out a system to show custom map images for map commands
 * Aside from br, the rest of the modes rely on the assets return by the API
 * These assets don't look good however I've decided to use them for now as it's direct
 * Manually wiring them up to our images isn't scalable either
 * I'll just leave this comment so I get reminded about it in the future
 */
const getMapUrl = (map) => {
  switch (map) {
    case 'kings_canyon_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544176815099954/kings_canyon.jpg';
    case 'Kings Canyon':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544176815099954/kings_canyon.jpg';
    case 'worlds_edge_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544195488129034/worlds_edge.jpg';
    case `World's Edge`:
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544195488129034/worlds_edge.jpg';
    case 'olympus_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544165163323402/olympus_nessie.jpg';
    case 'Olympus':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/896544165163323402/olympus_nessie.jpg';
    case 'Storm Point':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/911631835300237332/storm_point_nessie.jpg';
    case 'storm_point_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/911631835300237332/storm_point_nessie.jpg';
    default:
      return '';
  }
};
/**
 * Display the time left in a more aethestically manner
 * API returns in the form hr:min:sec (01:02:03)
 * Function returns hr hrs min mins sec secs (01 hrs 02 mins 03 secs);
 * Might want to think of using the number of remaining seconds instead of splitting the timer string in the future
 */
const getCountdown = (timer) => {
  const countdown = timer.split(':');
  const isOverAnHour = countdown[0] && countdown[0] !== '00';
  const isOverADay = countdown[0] && parseInt(countdown[0]) >= 24;

  //Since ranked br is usually one map for the whole split, good to show days as well rather than just the usual hours
  if (isOverADay) {
    const countdownDays = parseInt(countdown[0]) / 24;
    const countdownHours = parseInt(countdown[0]) % 24;
    return `${Math.floor(countdownDays)} days ${countdownHours} hrs ${countdown[1]} mins`;
  }
  return `${isOverAnHour ? `${countdown[0]} hr ` : ''}${countdown[1]} mins ${countdown[2]} secs`;
};
/**
 * Embed design for any pubs map
 * Added a hack to display the time for next map regardless of timezone
 * As discord embed has a timestamp propery, I added the remianing milliseconds to the current date
 */
const generatePubsEmbed = (data, type = 'Battle Royale') => {
  const embedData = {
    title: `${type} | Pubs`,
    color: 3066993,
    image: {
      url: type === 'Battle Royale' ? getMapUrl(data.current.code) : data.current.asset,
    },
    timestamp: Date.now() + data.current.remainingSecs * 1000,
    footer: {
      text: `Next Map: ${data.next.map}`,
    },
    fields: [
      {
        name: 'Current map',
        value: '```fix\n\n' + data.current.map + '```',
        inline: true,
      },
      {
        name: 'Time left',
        value: '```xl\n\n' + getCountdown(data.current.remainingTimer) + '```',
        inline: true,
      },
    ],
  };
  return embedData;
};
/**
 * Embed design for any ranked map
 * Fairly simple, don't need any fancy timers and footers
 */
const generateRankedEmbed = (data, type = 'Battle Royale') => {
  const embedData = {
    title: `${type} | Ranked`,
    color: 7419530,
    image: {
      url: type === 'Battle Royale' ? getMapUrl(data.current.code) : data.current.asset,
    },
    fields: [
      {
        name: 'Current map',
        value: '```fix\n\n' + data.current.map + '```',
        inline: true,
      },
      {
        name: 'Time left',
        value: '```xl\n\n' + getCountdown(data.current.remainingTimer) + '```',
        inline: true,
      },
    ],
  };
  if (data.next && data.next.map) {
    embedData.timestamp = Date.now() + data.current.remainingSecs * 1000;
    embedData.footer = {
      text: `Next Map: ${data.next.map}`,
    };
  }
  return embedData;
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
  getMapUrl,
  getCountdown,
  generatePubsEmbed,
  generateRankedEmbed,
};
