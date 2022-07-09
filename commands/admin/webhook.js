const { SlashCommandBuilder } = require('@discordjs/builders');
const { WebhookClient } = require('discord.js');
const { getBattleRoyalePubs } = require('../../adapters');
const { testWebhook } = require('../../config/nessie.json');
const { generatePubsEmbed } = require('../../helpers');
const { nessieLogo } = require('../../constants');
const Scheduler = require('../../scheduler');

let messageObject;
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
      subCommand.setName('status').setDescription('Test Webhook Status')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('delete').setDescription('Delete Webhook Message')
    ),
  async execute({ nessie, interaction }) {
    const statusOption = interaction.options.getSubcommand();
    const webhook = await nessie.fetchWebhook(testWebhook.id);

    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'send':
          const data = await getBattleRoyalePubs();
          const embed = generatePubsEmbed(data);
          await new WebhookClient({
            id: webhook.id,
            token: webhook.token,
          }).send({
            username: 'Nessie Automatic Status',
            avatarURL: nessieLogo,
            embeds: [embed],
          });
          await interaction.editReply({ content: 'Sent Webhook' });
          break;
        case 'status':
          const dataBr = await getBattleRoyalePubs();
          const embedBr = generatePubsEmbed(dataBr);
          messageObject = await new WebhookClient({
            id: webhook.id,
            token: webhook.token,
          }).send({
            username: 'Nessie Automatic Status',
            avatarURL: nessieLogo,
            embeds: [embedBr],
          });
          await interaction.editReply({ content: 'Status Webhook' });

          const schedule = new Scheduler('10 */1 * * * *', async () => {
            const dataBrNew = await getBattleRoyalePubs();
            const embedNew = generatePubsEmbed(dataBrNew);
            const webhookNew = await nessie.fetchWebhook(testWebhook.id);
            const webhookClient = new WebhookClient({
              id: webhookNew.id,
              token: webhookNew.token,
            });
            await webhookClient.deleteMessage(messageObject.id);
            messageObject = await webhookClient.send({
              username: 'Nessie Automatic Status',
              avatarURL: nessieLogo,
              embeds: [embedNew],
            });
          });
          schedule.start();
          break;
        case 'delete':
          await webhook.deleteMessage('989556889429880932');
          await interaction.editReply({ content: 'Delete Webhook' });
      }
    } catch (error) {}
  },
};
