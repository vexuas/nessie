import { Guild, GuildTextBasedChannel, User } from 'discord.js';
import { Mixpanel } from 'mixpanel';

//TODO: Check if sub commands are being tracked correctly
type AnalyticsEvent = {
  client: Mixpanel;
  user: User;
  channel: GuildTextBasedChannel | null;
  guild: Guild | null;
  eventName: string;
  command?: string;
  subCommand?: string | null;
  options?: string | number | boolean | null;
  properties?: object;
};
type UserProfile = {
  client: Mixpanel;
  user: User;
  channel: GuildTextBasedChannel | null;
  guild: Guild | null;
  command?: string;
};

function setUserProfile({ client, user, channel, guild, command }: UserProfile) {
  client.people.set(user.id, {
    $name: user.username,
    $created: user.createdAt.toISOString(),
    tag: user.tag,
    guild: guild ? guild.name : 'N/A',
    guild_id: guild ? guild.id : 'N/A',
  });
  client.people.set_once(user.id, {
    first_used: new Date().toISOString(),
    first_command: command,
    first_used_in_guild: guild ? guild.name : 'N/A',
    first_used_in_channel: channel ? channel.name : 'N/A',
  });
}
export function sendAnalyticsEvent({
  user,
  channel,
  guild,
  eventName,
  command,
  subCommand,
  client,
  options,
  properties,
}: AnalyticsEvent) {
  setUserProfile({ client, user, guild, channel, command });

  client.track(eventName, {
    command,
    distinct_id: user.id,
    user: user.tag,
    user_name: user.username,
    channel: channel ? channel.name : 'N/A',
    channel_id: channel ? channel.id : 'N/A',
    guild: guild ? guild.name : 'N/A',
    guild_id: guild ? guild.id : 'N/A',
    arguments: options ? options : 'none',
    sub_command: subCommand,
    ...properties,
  });
}
