const { SlashCommandBuilder } = require('@discordjs/builders');
const { nessieLogo } = require('../../constants');
const { version } = require('../../package.json');

/**
 * Send the latest news and updates of Nessie
 * Initially this was hardcoded here everytime before a release is made
 * However following the change in error handling getting an alert message from a discord message, I want to carry that over there too
 * Similar to the error handling, we get the specific message by fetching it through the channel it's in
 * With that message, we then trim the content inside the code block
 * An addition is that we also want to show the current update date so I've passed it in the message too wrapped in {}
 */
const sendUpdatesEmbed = async ({ nessie, interaction }) => {
  const alertChannel = nessie.channels.cache.get('973977422699573258');
  const messageObject = await alertChannel.messages.fetch('973978605044514826');

  const updateMessage = messageObject.content;
  const updateAlert = updateMessage.substring(
    updateMessage.indexOf('[') + 4,
    updateMessage.lastIndexOf(']') - 3
  );
  const updateDate = updateMessage.substring(
    updateMessage.indexOf('{') + 1,
    updateMessage.lastIndexOf('}')
  );
  const embed = {
    title: `v${version} | ${updateDate}`,
    color: 3447003,
    description: updateAlert,
    thumbnail: {
      url: nessieLogo,
    },
  };
  return await interaction.reply({ embeds: [embed] });
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('updates')
    .setDescription('Displays latest news and updates of Nessie'),
  async execute({ nessie, interaction }) {
    sendUpdatesEmbed({ nessie, interaction });
  },
};
