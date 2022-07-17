/**
 * User and event tracking for Nessie using Mixpanel
 * Learning from past mistakes so adding this pre-launch
 * For reference: https://developer.mixpanel.com/docs/nodejs
 */
const sendMixpanelEvent = ({
  user,
  channel,
  guild,
  command,
  subcommand,
  client,
  arguments,
  isApplicationCommand,
}) => {
  const eventToSend = !subcommand
    ? `Use ${command} command`
    : `Use ${command} ${subcommand} command`; //Name of event; string interpolated with command as best to write an event as an action a user is doing
  /**
   * Creates and updates a user profile
   * Sets properties everytime event is called and overrides if they're different
   */
  client.people.set(user.id, {
    $name: user.username,
    $created: user.createdAt.toISOString(),
    tag: user.tag,
    guild: guild.name,
    guild_id: guild.id,
  });
  if (channel.type !== 'dm') {
    /**
     * Event to send to mixpanel
     * Added relevant properties along with event such as user, channel and guild
     * Important to always send `distinct_id` as mixpanel-nodejs uses this as its unique identifier
     */
    client.track(eventToSend, {
      distinct_id: user.id,
      user: user.tag,
      user_name: user.username,
      channel: channel.name,
      channel_id: channel.id,
      guild: guild.name,
      guild_id: guild.id,
      command: command,
      subcommand: subcommand ? subcommand : 'none',
      arguments: arguments ? arguments : 'none',
      isApplicationCommand: isApplicationCommand, //undefined if command is a prefix command
    });
    /**
     * Sets a user profile properties only once
     * Gets called on every event but doesn't override property if it already exists
     * Useful for first time stuff
     */
    client.people.set_once(user.id, {
      first_used: new Date().toISOString(),
      first_command: command,
      first_used_in_guild: guild.name,
      first_used_in_channel: channel.name,
    });
    // Only set the user profilce once for when they first used an application command
    isApplicationCommand &&
      client.people.set_once(user.id, {
        first_used_application_command: new Date().toISOString(),
      });
  } else {
    //Maybe look into dms someday; dropping this for now from Yagi
  }
};

module.exports = {
  sendMixpanelEvent,
};
