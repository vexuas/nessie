/**
 * Command list of nessie
 * Creating this extra file for easier readability of commands
 * TODO: Instead of importing individually, auto import whatever is under the commands folder
 */
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
    control: require('./commands/maps/_control'),
  };
};
