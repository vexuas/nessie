const { SlashCommandBuilder } = require('@discordjs/builders');
const { codeBlock } = require('../../helpers');

module.exports = {
  isAdmin: true,
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription("Sets automated map updates on Nessie's announcement channels")
    .addSubcommand((subCommand) =>
      subCommand.setName('stop').setDescription('Stops an existing automated status')
    ),
  async execute({ nessie, interaction }) {
    try {
      await interaction.deferReply();
      const brChannel = nessie.channels.cache.get('988491755164942406');
      const arenasChannel = nessie.channels.cache.get('988491756465184918');

      const deprecationEmbed = {
        title: 'Automatic Map Updates',
        description: `This announcement channel is now no longer supported! To get automatic map updates, you can check out ${codeBlock(
          '/status help'
        )}!`,
        color: 3447003,
      };
      await brChannel.send({ embeds: [deprecationEmbed] });
      await arenasChannel.send({ embeds: [deprecationEmbed] });
      await interaction.editReply('Sent messages');
    } catch (error) {
      console.log(error);
    }
  },
};
