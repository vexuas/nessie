const { SlashCommandBuilder } = require('@discordjs/builders');
const { getControlPubs } = require('../../adapters');
const { sendErrorLog, generateErrorEmbed, generatePubsEmbed, codeBlock } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const { sendMixpanelEvent } = require('../../analytics');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('control')
    .setDescription('Shows current map rotation for control')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Game Mode')
        .setRequired(true)
        .addChoice('pubs', 'control_pubs')
    ),
  async execute({ nessie, interaction, mixpanel }) {
    let data;
    let embed;
    try {
      await interaction.deferReply();
      const optionMode = interaction.options.getString('mode');
      switch (optionMode) {
        case 'control_pubs':
          data = await getControlPubs();
          embed = generatePubsEmbed(data, 'Control');
          break;
      }
      await interaction.editReply({ embeds: [embed] });
      sendMixpanelEvent(
        interaction.user,
        interaction.channel,
        interaction.guild,
        'control',
        mixpanel,
        optionMode,
        true
      );
    } catch (error) {
      const uuid = uuidv4();
      const alertChannel = nessie.channels.cache.get('973977422699573258');
      const messageObject = await alertChannel.messages.fetch('989197310502260736');
      const errorMessage = messageObject.content;
      const errorAlert = errorMessage.substring(
        errorMessage.indexOf('[') + 4,
        errorMessage.lastIndexOf(']') - 3
      );
      const errorEmbed = {
        description: `${errorAlert}\n\nError: ${
          error.message ? codeBlock(error.message) : codeBlock('Unexpected Error')
        }\nError ID: ${codeBlock(
          uuid
        )}\nAlternatively, you can also report issue through the [support server](https://discord.gg/FyxVrAbRAd)`,
        color: 16711680,
      };
      const type = 'Control';
      await interaction.editReply({ embeds: [errorEmbed] });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  },
};
