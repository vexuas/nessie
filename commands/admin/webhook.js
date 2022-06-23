const { SlashCommandBuilder } = require('@discordjs/builders');
const { WebhookClient } = require('discord.js');
const { getBattleRoyalePubs } = require('../../adapters');
const { testWebhook } = require('../../config/nessie.json');
const { generatePubsEmbed } = require('../../helpers');
const { nessieLogo } = require('../../constants');

module.exports = {
  isAdmin: true,
  data: new SlashCommandBuilder()
    .setName('webhook')
    .setDescription('Testing Webhooks')
    .addSubcommand((subCommand) =>
      subCommand.setName('send').setDescription('Send Webhook Message')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('edit').setDescription('Edit Webhook Message')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('delete').setDescription('Delete Webhook Message')
    ),
  async execute({ nessie, interaction }) {
    const statusOption = interaction.options.getSubcommand();
    const webhook = new WebhookClient({
      id: testWebhook.id,
      token: testWebhook.token,
    });
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'send':
          const data = await getBattleRoyalePubs();
          const embed = generatePubsEmbed(data);
          await webhook.send({
            username: 'Nessie Map Status',
            avatarURL: nessieLogo,
            embeds: [embed],
          });
          await interaction.editReply({ content: 'Sent Webhook' });
          break;
        case 'edit':
          await webhook.editMessage('', {
            content: 'Edit Message',
            embeds: [],
          });
          await interaction.editReply({ content: 'Edit Webhook' });
          break;
        case 'delete':
          await webhook.deleteMessage('989556889429880932');
          await interaction.editReply({ content: 'Delete Webhook' });
      }
    } catch (error) {}
  },
};
