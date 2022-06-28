const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
  isAdmin: true,
  data: new SlashCommandBuilder().setName('selectmenu').setDescription('Testing select menus'),
  async execute({ interaction }) {
    try {
      await interaction.deferReply();
      const selectMenuRow = new MessageActionRow().addComponents(
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
      await interaction.editReply({ components: [selectMenuRow] });
    } catch (error) {}
  },
};
