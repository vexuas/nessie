/**
 * Command list of nessie
 * Creating this extra file for easier readability of commands
 * Currently we support prefix commands and application commands
 * After discord rolls the priviliged message intent at the end of April, verified bots will no longer be able to read messages normally
 * TODO: Deprecate prefix commands before that happens
 * TODO: Instead of importing individually, auto import whatever is under the commands folder
 */
exports.getPrefixCommands = () => {
  return {
    //Maps
    br: require('./commands/maps/battle-royale'),
    arenas: require('./commands/maps/arenas'),
    // status: require('./commands/maps/status'),
    //Hub
    about: require('./commands/hub/about'),
    help: require('./commands/hub/help'),
    prefix: require('./commands/hub/prefix'),
    setprefix: require('./commands/hub/setPrefix'),
    invite: require('./commands/hub/invite'),
    announcement: require('./commands/hub/announcement'),
    updates: require('./commands/hub/updates'),
  };
};
exports.getApplicationCommands = () => {
  return {
    //Hub
    about: require('./commands/hub/_about'),
    help: require('./commands/hub/_help'),
    invite: require('./commands/hub/_invite'),
    updates: require('./commands/hub/_updates'),
    // Maps
    br: require('./commands/maps/_battle-royale'),
    arenas: require('./commands/maps/_arenas'),
  };
};
