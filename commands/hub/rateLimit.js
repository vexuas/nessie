const { SlashCommandBuilder } = require('@discordjs/builders');
const { sendErrorLog, generatePubsEmbed, generateRankedEmbed } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const { getRotationData } = require('../../adapters');

module.exports = {
  data: new SlashCommandBuilder().setName('ratelimit').setDescription('Testing rate limiting'),
  async execute({ nessie, interaction }) {
    try {
      await interaction.deferReply();
      const brAnnouncement = nessie.channels.cache.get('981566881993490453');
      const arenasAnnouncement = nessie.channels.cache.get('981594277593374821');
      const rotationData = await getRotationData();
      const battleRoyalePubs = generatePubsEmbed(rotationData.battle_royale);
      const battleRoyaleRanked = generateRankedEmbed(rotationData.ranked);
      const arenasPubs = generatePubsEmbed(rotationData.arenas, 'Arenas');
      const arenasRanked = generateRankedEmbed(rotationData.arenasRanked, 'Arenas');

      const informationEmbed = {
        description:
          '**Updates occur every X minutes**. This feature is currently in beta! For feedback and bug reports, feel free to drop them in the [support server](https://discord.com/invite/47Ccgz9jA4)!',
        color: 3447003,
        timestamp: Date.now(),
        footer: {
          text: 'Last Update',
        },
      };
      const brMessage = await brAnnouncement.send({
        embeds: [informationEmbed, battleRoyaleRanked, battleRoyalePubs],
      });
      const arenasMessage = await arenasAnnouncement.send({
        embeds: [informationEmbed, arenasRanked, arenasPubs],
      });

      await brMessage.crosspost();
      await arenasMessage.crosspost();
      await interaction.editReply('Testing Announcements');
    } catch (data) {
      console.log(data);
      const uuid = uuidv4();
      await interaction.editReply('Oops got rate limited');
      const type = 'Rate Limited';
      const error = {
        message: data
          ? `\n• Timeout: ${data.timeout}ms\n• Limit: ${data.limit}\n• Method: ${data.method}\n• Path: ${data.path}\n• Route: ${data.route}\n• Global: ${data.global}`
          : 'Unexpected rate limit error',
      };
      await sendErrorLog({ nessie, error, type, uuid, ping: true });
    }
  },
};
