import { Guild, GuildTextBasedChannel, TextBasedChannels, User } from 'discord.js';
import { Mixpanel } from 'mixpanel';
import { capitalize } from 'lodash';

//TODO: Check if sub commands are being tracked correctly
type CommandEvent = {
  client: Mixpanel;
  user: User;
  channel: TextBasedChannels | null;
  guild: Guild | null;
  command: string;
  options?: string;
  properties?: object;
};
type UserProfile = {
  client: Mixpanel;
  user: User;
  channel: TextBasedChannels | null;
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
export function sendCommandEvent({
  user,
  channel,
  guild,
  command,
  client,
  options,
  properties,
}: CommandEvent) {
  setUserProfile({ client, user, guild, channel, command });
  const eventName = `Use ${capitalize(command)} Command`;

  client.track(eventName, {
    distinct_id: user.id,
    user: user.tag,
    user_name: user.username,
    channel: channel ? channel.name : 'N/A',
    channel_id: channel ? channel.id : 'N/A',
    guild: guild ? guild.name : 'N/A',
    guild_id: guild ? guild.id : 'N/A',
    command: command,
    arguments: options ? options : 'none',
    ...properties,
  });
}
