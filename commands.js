/**
 * Command list of nessie
 * Creating this extra file for easier readability of commands
 * TODO: Instead of importing individually, auto import whatever is under the commands folder
 */
exports.getApplicationCommands = () => {
  return {
    //Hub
    about: require('./commands/hub/about'),
    help: require('./commands/hub/help'),
    invite: require('./commands/hub/invite'),
    updates: require('./commands/hub/updates'),
    // Maps
    br: require('./commands/maps/battle-royale'),
    arenas: require('./commands/maps/arenas'),
    // control: require('./commands/maps/control'), //Commenting this out so it's easy to switch when control eventually comes back again
    status: require('./commands/maps/status'),
    //Admin
    announcement: require('./commands/admin/announcement'),
  };
};
