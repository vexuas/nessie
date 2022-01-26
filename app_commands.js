/**
 * Application Command list of nessie
 * Creating this extra file for easier readability of commands
 * Currently we support prefix commands and application commands
 * After discord rolls the priviliged message intent at the end of April, verified bots will no longer be able to read messages normally
 * TODO: Deprecate prefix commands before that happens
 */
module.exports = {
  //Hub
  about: require('./app_commands/hub/about'),
};
