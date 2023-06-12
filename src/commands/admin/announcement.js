const { SlashCommandBuilder } = require('@discordjs/builders');
const { codeBlock } = require('../../utils/helpers');

/**
 * We no longer have use for announcements with the status feature being released soon
 * I have no idea how many guilds have followed the channels but it's good to at least send one last message before we deprecate the channels completely
 * Technically I could just write the message myself but Nessie started this, I'd want Nessie to end it. Besides, I can't send embeds heh
 * This just sends the messages, I'll manually delete the old messages + publish these
 */
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
