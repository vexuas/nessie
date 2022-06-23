const { SlashCommandBuilder } = require('@discordjs/builders');
const { WebhookClient } = require('discord.js');
const { testWebhook } = require('../../config/nessie.json');

module.exports = {
  isAdmin: true,
  data: new SlashCommandBuilder().setName('webhook').setDescription('Testing Webhooks'),
  async execute({ nessie, interaction }) {
    const webhook = new WebhookClient({
      id: testWebhook.id,
      token: testWebhook.token,
    });
    try {
      await interaction.deferReply();
      await webhook.send({ content: 'test' });
      await interaction.editReply({ content: 'Sent Webhook' });
    } catch (error) {}
  },
};
