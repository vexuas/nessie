const { SlashCommandBuilder } = require('@discordjs/builders');
const { WebhookClient } = require('discord.js');
const { getBattleRoyalePubs } = require('../../adapters');
const { testWebhook } = require('../../config/nessie.json');
const { generatePubsEmbed } = require('../../helpers');
const { nessieLogo } = require('../../constants');

/**
 * Temporary command to test how to use webhooks
 * Tbh after testing this and realising how straightforward it is, makes me wonder why I even bothered making announcements kek
 * Either way, pretty good to know to have this. Got a good feeling this will make auto updates a reality
 * Things to consider during the user mapping/prototype iteration:
 * - Webhooks rate limit
 * - Storing webhook data
 * - Create + delete, create or edit?
 * - 1 channel or 2
 * - Control?
 * - Creating a webhook during status initialisation
 *
 * Useful documentation:
 * https://discordjs.guide/popular-topics/webhooks.html#sending-messages
 * https://discord.com/developers/docs/resources/webhook#execute-webhook
 */
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
