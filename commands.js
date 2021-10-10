/**
 * Command list of nessie
 * Ceating this extra file for easier readability of commands
 */
module.exports = {
  //Maps
  br: require('./commands/maps/battle-royale'),
  arenas: require('./commands/maps/arenas'),
  //Hub
  info: require('./commands/hub/info'),
  help: require('./commands/hub/help'),
  prefix: require('./commands/hub/prefix'),
  invite: require('./commands/hub/invite')
}
