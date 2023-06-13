/**
 * Command list of nessie
 * Creating this extra file for easier readability of commands
 * TODO: Instead of importing individually, auto import whatever is under the commands folder
 */
export const getApplicationCommands = () => {
  return {
    //Hub
    about: require('./hub/about'),
    help: require('./hub/help'),
    invite: require('./hub/invite'),
    updates: require('./hub/updates'),
    // Maps
    br: require('./maps/battleRoyale'),
    arenas: require('./maps/arenas'),
    ltm: require('./maps/ltm'),
    status: require('./maps/status'),
    //Admin
    announcement: require('./admin/announcement'),
  };
};
