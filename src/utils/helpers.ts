import { format } from 'date-fns';
import {
  AnySelectMenuInteraction,
  APIEmbed,
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  Guild,
  GuildChannel,
  WebhookClient,
  PermissionFlagsBits,
  ButtonInteraction,
  GuildMember,
  StringSelectMenuInteraction,
} from 'discord.js';
import {
  BOOT_NOTIFICATION_CHANNEL_ID,
  ERROR_NOTIFICATION_WEBHOOK_URL,
} from '../config/environment';
import { nessieLogo } from './constants';
import { isEmpty } from 'lodash';
import { v4 as uuidV4 } from 'uuid';
import { inlineCode } from '@discordjs/builders';
import { capitalize } from 'lodash';
import { StatusRecord } from '../services/database';
import {
  MapRotationArenasRankedSchema,
  MapRotationArenasSchema,
  MapRotationBattleRoyaleSchema,
  MapRotationRankedSchema,
} from '../schemas/mapRotation';
import { Mixpanel } from 'mixpanel';
import { sendAnalyticsEvent } from '../services/analytics';

export const serverNotificationEmbed = async ({
  app,
  guild,
  type,
}: {
  app: Client;
  guild: Guild;
  type: 'join' | 'leave';
}): Promise<APIEmbed> => {
  const defaultIcon =
    'https://cdn.discordapp.com/attachments/248430185463021569/614789995596742656/Wallpaper2.png';
  const guildIcon = guild.icon && guild.iconURL();
  const guildOwner =
    type === 'join'
      ? await guild.members.fetch(guild.ownerId).then((guildMember) => guildMember.user.tag)
      : '-';

  const embed = {
    title: type === 'join' ? 'Joined a new server' : 'Left a server',
    description: `I'm now in **${app.guilds.cache.size}** servers!`,
    color: getEmbedColor(type === 'join' ? '#33FF33' : '#FF0000'),
    thumbnail: {
      url: guildIcon ? guildIcon.replace(/jpeg|jpg/gi, 'png') : defaultIcon,
    },
    fields: [
      {
        name: 'Name',
        value: guild.name,
        inline: true,
      },
      {
        name: 'Owner',
        value: guildOwner,
        inline: true,
      },
      {
        name: 'Members',
        value: guild.memberCount.toString(),
        inline: true,
      },
    ],
  };
  return embed;
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
 * TODO: Revisit if this is necessary
 */
export const generateErrorEmbed = async (
  error: any,
  uuid: any,
  nessie: any
): Promise<APIEmbed[]> => {
  //To get a specific message, we need to get the channel it's in before fetching it
  const alertChannel = nessie.channels.cache.get('973977422699573258');
  const messageObject = await alertChannel.messages.fetch('973981539731922946');
  const errorMessage = messageObject.content;
  //Since the message is inside a code block we want to trim everything outside of it; made a hack of wrapping it between [] to make it easier to trim
  const errorAlert = errorMessage.substring(
    errorMessage.indexOf('[') + 4,
    errorMessage.lastIndexOf(']') - 3
  );

  const missingAccessAlert =
    'Oops looks like Nessie has missing access! This sometimes happens in servers where there are permission overwrites for default roles. An example of these are `View Channel` and `Send Messages` permissions that might not be enabled by default for new users/bots.\n\nTo grant access and use automatic map status, enable the `View Channels` and `Send Messages` permissions for Nessie through Server Settings -> Roles';

  const embed = {
    description: `${
      error.message.includes('Missing Access') ? missingAccessAlert : errorAlert
    }\n\nError: ${
      error.message ? inlineCode(error.message) : inlineCode('Unexpected Error')
    }\nError ID: ${inlineCode(
      uuid
    )}\nAlternatively, you can also report issue through the [support server](https://discord.gg/FyxVrAbRAd)`,
    color: 16711680,
  };
  return [embed];
};
export const sendErrorLog = async ({
  error,
  interaction,
  option,
  subCommand,
  customTitle,
}: {
  error: any;
  interaction?: ChatInputCommandInteraction | AnySelectMenuInteraction | ButtonInteraction;
  option?: string | null;
  subCommand?: string;
  customTitle?: string;
}) => {
  console.error(error);
  const errorID = uuidV4();
  if (interaction) {
    const errorEmbed = {
      description: `Oops something went wrong! D:\n\nError: ${
        error.message ? inlineCode(error.message) : inlineCode('Unexpected Error')
      }\nError ID: ${inlineCode(errorID)}`,
      color: getEmbedColor('#FF0000'),
    };
    await interaction.editReply({ embeds: [errorEmbed], components: [] });
  }
  if (ERROR_NOTIFICATION_WEBHOOK_URL && !isEmpty(ERROR_NOTIFICATION_WEBHOOK_URL)) {
    const interactionChannel = interaction?.channel as GuildChannel | undefined;
    const notificationEmbed: APIEmbed = {
      title: customTitle
        ? `Error | ${customTitle}`
        : interaction
        ? `Error | ${interaction.isCommand() ? capitalize(interaction.commandName) : ''}${
            subCommand ? ` ${capitalize(subCommand)}` : ''
          } Command`
        : 'Error',
      color: getEmbedColor('#FF0000'),
      description: `uuid: ${errorID}\nError: ${
        error.message ? error.message : 'Unexpected Error'
      }\n${option ? `Option: ${option}` : ''}`,
      fields: interaction
        ? [
            {
              name: 'User',
              value: interaction.user.username,
              inline: true,
            },
            {
              name: 'User ID',
              value: interaction.user.id,
              inline: true,
            },
            {
              name: 'Channel',
              value: interactionChannel ? interactionChannel.name : '-',
              inline: true,
            },
            {
              name: 'Channel ID',
              value: interaction.channelId,
              inline: true,
            },
            {
              name: 'Guild',
              value: interaction.guild ? interaction.guild.name : '-',
              inline: true,
            },
            {
              name: 'Guild ID',
              value: interaction.guildId ? interaction.guildId : '-',
              inline: true,
            },
          ]
        : undefined,
    };
    const notificationWebhook = new WebhookClient({ url: ERROR_NOTIFICATION_WEBHOOK_URL });
    await notificationWebhook.send({
      embeds: [notificationEmbed],
      username: 'Nessie Error Notification',
      avatarURL: nessieLogo,
    });
  }
};
/**
 * Handler for errors concerning status cycles
 * Same as above, only difference is the embed content
 * TODO: Revisit if this is necessary
 */
export const sendStatusErrorLog = async ({
  nessie,
  uuid,
  error,
  status,
}: {
  nessie: Client;
  uuid: string;
  error: any;
  status: StatusRecord;
}) => {
  const errorGuild = nessie.guilds.cache.get(status.guild_id);
  const errorEmbed = {
    title: 'Error | Status Scheduler Cycle',
    color: 16711680,
    description: `uuid: ${uuid}\nError: ${inlineCode(error.message)}`,
    fields: [
      {
        name: 'Status ID',
        value: status.uuid,
      },
      {
        name: 'Guild',
        value: errorGuild ? errorGuild.name : '-',
      },
      {
        name: 'Created By',
        value: status.created_by,
      },
      {
        name: 'Game Modes',
        value: status.game_mode_selected,
      },
      {
        name: 'Timestamp',
        value: format(new Date(), 'dd MMM yyyy, h:mm:ss a'),
      },
    ],
  };
  if (ERROR_NOTIFICATION_WEBHOOK_URL && !isEmpty(ERROR_NOTIFICATION_WEBHOOK_URL)) {
    const notificationWebhook = new WebhookClient({ url: ERROR_NOTIFICATION_WEBHOOK_URL });
    await notificationWebhook.send({
      content: error.message === 'Internal Server Error' ? '' : '<@183444648360935424>',
      embeds: [errorEmbed],
      username: 'Nessie Error Notification',
      avatarURL: nessieLogo,
    });
  }
};
export const generateAnnouncementMessage = (prefix: string) => {
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
 * TODO: Revisit if this is necessary
 */
export const getMapUrl = (map: string) => {
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
    case 'broken_moon_rotation':
      return 'https://cdn.discordapp.com/attachments/896544134813319168/1064934640739164240/broken_moon.jpg';
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
export const getCountdown = (timer: string) => {
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
export const generatePubsEmbed = (
  data: MapRotationBattleRoyaleSchema | MapRotationArenasSchema,
  type = 'Battle Royale'
): APIEmbed => {
  const embedData: APIEmbed = {
    title: `${type} | Pubs`,
    color: 3066993,
    image: {
      url: type === 'Battle Royale' ? getMapUrl(data.current.code) : data.current.asset,
    },
    timestamp: new Date(Date.now() + data.current.remainingSecs * 1000).toISOString(),
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
export const generateRankedEmbed = (
  data: MapRotationRankedSchema | MapRotationArenasRankedSchema,
  type = 'Battle Royale'
) => {
  const embedData: any = {
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
    embedData.timestamp = new Date(Date.now() + data.current.remainingSecs * 1000).toISOString();
    embedData.footer = {
      text: `Next Map: ${data.next.map}`,
    };
  }
  return embedData;
};
//TODO: Refactor this someday
export const checkMissingBotPermissions = (
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction
) => {
  const { guild } = interaction;

  const hasAdmin =
    guild &&
    guild.members.me &&
    guild.members.me.permissions.has(PermissionFlagsBits.Administrator);
  const hasManageChannels =
    guild &&
    guild.members.me &&
    guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels, false);
  const hasViewChannel =
    guild &&
    guild.members.me &&
    guild.members.me.permissions.has(PermissionFlagsBits.ViewChannel, false);
  const hasManageWebhooks =
    guild &&
    guild.members.me &&
    guild.members.me.permissions.has(PermissionFlagsBits.ManageWebhooks, false);
  const hasSendMessages =
    guild &&
    guild.members.me &&
    guild.members.me.permissions.has(PermissionFlagsBits.SendMessages, false);
  const hasManageRoles =
    guild &&
    guild.members.me &&
    guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles, false);

  const hasMissingPermissions =
    (!hasManageChannels ||
      !hasViewChannel ||
      !hasManageWebhooks ||
      !hasSendMessages ||
      !hasManageRoles) &&
    !hasAdmin; //Overrides missing permissions if nessie has Admin

  return {
    hasAdmin,
    hasManageChannels,
    hasManageWebhooks,
    hasSendMessages,
    hasViewChannel,
    hasMissingPermissions,
    hasManageRoles,
  };
};
export const checkIfUserHasManageServer = (
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction
) => {
  return (
    interaction.member &&
    interaction.member instanceof GuildMember &&
    interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
  ); //Checks if user who initiated command has the Manage Server/Guild permission
};
export const sendMissingBotPermissionsError = async ({
  interaction,
  title,
}: {
  interaction: ChatInputCommandInteraction;
  title: string;
}) => {
  const embed = {
    title,
    description: `Oops looks like Nessie is missing some permissions D:\n\nThese bot permissions are required to create/stop automatic map updates:\n• Manage Channels\n• Manage Webhooks\n• View Channels\n• Send Messages\n\nFor more details, use ${inlineCode(
      '/status help'
    )}`,
    color: 16711680,
  };
  await interaction.editReply({ embeds: [embed], components: [] });
};
export const sendMissingUserPermissionError = async ({
  interaction,
  title,
}: {
  interaction: ChatInputCommandInteraction;
  title: string;
}) => {
  const embed = {
    title,
    description: `Oops only users with the ${inlineCode(
      'Manage Server'
    )} permission can create/stop automatic map updates D:\n\nRequired User Permissions:\n• Manage Server\n\nFor more details, use ${inlineCode(
      '/status help'
    )}`,
    color: 16711680,
  };
  interaction.editReply({ embeds: [embed], components: [] });
};
export const sendMissingAllPermissionsError = async ({
  interaction,
  title,
}: {
  interaction: ChatInputCommandInteraction;
  title: string;
}) => {
  const embed = {
    title,
    description: `Oops looks there are some issues to resolve before you're able to create automatic map updates D:\n\nRequired Bot Permissions\n• Manage Channels\n• Manage Webhooks\n• View Channels\n• Send Messages\n\nRequired User Permissions:\n• Manage Server\n\nFor more details, use ${inlineCode(
      '/status help'
    )}`,
    color: 16711680,
  };
  await interaction.editReply({ embeds: [embed], components: [] });
};

export const sendBootNotification = async (app: Client) => {
  console.log("I'm booting up! (◕ᴗ◕✿)");
  const bootNotificationChannel: Channel | undefined =
    BOOT_NOTIFICATION_CHANNEL_ID && !isEmpty(BOOT_NOTIFICATION_CHANNEL_ID)
      ? app.channels.cache.get(BOOT_NOTIFICATION_CHANNEL_ID)
      : undefined;
  bootNotificationChannel &&
    bootNotificationChannel.type === ChannelType.GuildText &&
    (await bootNotificationChannel.send("I'm booting up! (◕ᴗ◕✿)"));
};

//Helper to pass in a hexadecimal string color that converts it to a number code that discord accepts
//Returns a default color if no argument is passed
export const getEmbedColor = (color?: string): number => {
  return parseInt(color ? color.replace('#', '0x') : '#3399FF'.replace('#', '0x'));
};

export const sendWrongUserWarning = async ({
  interaction,
  mixpanel,
}: {
  interaction: ButtonInteraction | AnySelectMenuInteraction;
  mixpanel?: Mixpanel | null;
}) => {
  const wrongUserEmbed = {
    description: `Oops looks like that interaction wasn't meant for you! Nessie can only properly interact with your own commands.\n\nTo check what Nessie can do, type ${inlineCode(
      '/help'
    )}!`,
    color: getEmbedColor('#FF0000'),
  };
  await interaction.deferReply({ ephemeral: true });
  mixpanel &&
    sendAnalyticsEvent({
      user: interaction.user,
      channel: interaction.inGuild() ? interaction.channel : null,
      guild: interaction.guild,
      client: mixpanel,
      options: interaction.customId,
      eventName: 'Click wrong user button',
    });
  interaction.editReply({ embeds: [wrongUserEmbed] });
};
