const { SlashCommandBuilder } = require('@discordjs/builders');
const { WebhookClient } = require('discord.js');
const { getBattleRoyalePubs } = require('../../adapters');
const { testWebhook } = require('../../config/nessie.json');
const { generatePubsEmbed } = require('../../helpers');
const { nessieLogo } = require('../../constants');

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
      const data = await getBattleRoyalePubs();
      const embed = generatePubsEmbed(data);
      await webhook.send({
        username: 'Nessie Map Status',
        avatarURL: nessieLogo,
        embeds: [embed],
      });
      await interaction.editReply({ content: 'Sent Webhook' });
    } catch (error) {}
  },
};
