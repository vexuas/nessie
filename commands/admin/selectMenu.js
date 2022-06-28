const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');

const mapOptions = {
  selectMenu__brValue: 'Battle Royale',
  selectMenu__arenasValue: 'Arenas',
};
const selectMenuReply = async ({ interaction }) => {
  let selectedValues = '';
  interaction.values.forEach((value, index) => {
    selectedValues += `${index > 0 ? ', ' : ''}${mapOptions[value]}`;
  });
  try {
    await interaction.deferUpdate();
    const embed = {
      title: 'Step 2 | Status Confirmation',
      description: `Selected ${selectedValues}\n\nChannels, webhooks to create yada yada`,
      color: 3447003,
    };
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setLabel('Back')
          .setStyle('SECONDARY')
          .setDisabled(true)
          .setCustomId('backTest')
      )
      .addComponents(
        new MessageButton()
          .setLabel('Cancel')
          .setStyle('DANGER')
          .setDisabled(true)
          .setCustomId('cancelTest')
      )
      .addComponents(
        new MessageButton()
          .setLabel('Confirm')
          .setStyle('SUCCESS')
          .setDisabled(true)
          .setCustomId('confirmTest')
      );
    await interaction.message.edit({ embeds: [embed], components: [row] });
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  isAdmin: true,
  data: new SlashCommandBuilder().setName('selectmenu').setDescription('Testing select menus'),
  async execute({ interaction }) {
    try {
      await interaction.deferReply();
      const row = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId('selectMenu__mapOptions')
          .setPlaceholder("I'm a select menu")
          .setMinValues(1)
          .setMaxValues(2)
          .addOptions([
            {
              label: 'Battle Royale',
              description: 'Battle Royale Map Rotation',
              value: 'selectMenu__brValue',
            },
            {
              label: 'Arenas',
              description: 'Arenas Map Rotation',
              value: 'selectMenu__arenasValue',
            },
          ])
      );
      const embed = {
        title: `Step 1 | Game Mode Selection`,
        description: 'Choose which game modes to receive automatic updates',
        color: 3447003,
      };
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {}
  },
  selectMenuReply,
};
