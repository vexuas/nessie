const { SlashCommandBuilder } = require('@discordjs/builders');
const { sendErrorLog } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const { format } = require('date-fns');

module.exports = {
  data: new SlashCommandBuilder().setName('ratelimit').setDescription('Testing rate limiting'),
  async execute({ nessie, interaction }) {
    try {
      await interaction.deferReply();
      const testAnnouncement = nessie.channels.cache.get('981566881993490453');

      await testAnnouncement.send('Test');

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
