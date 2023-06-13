import { Client } from 'discord.js';
import { Mixpanel } from 'mixpanel';
import { getApplicationCommands } from '../commands/commands';
const { sendMixpanelEvent } = require('../services/analytics');
const { sendErrorLog, codeBlock } = require('../utils/helpers');
const { v4: uuidv4 } = require('uuid');
const {
  goToConfirmStatus,
  goBackToGameModeSelection,
  _cancelStatusStart,
  createStatus,
} = require('../commands/maps/status/start');
const { _cancelStatusStop, deleteGuildStatus } = require('../commands/maps/status/stop');

const appCommands: any = getApplicationCommands(); //Get list of application commands

interface Props {
  nessie: Client;
  mixpanel: Mixpanel | null;
}
export type EventModule = {
  nessie: Client;
  appCommands?: any[];
  mixpanel?: Mixpanel | null;
};

export function registerEventHandlers({ nessie, mixpanel }: Props) {
  nessie.on('interactionCreate', async (interaction) => {
    if (!interaction.inGuild()) return; //Only respond in server channels or if it's an actual command

    if (interaction.isCommand()) {
      const { commandName, options } = interaction;
      const usedOption = options.data[0];
      const isArgument = usedOption && usedOption.type === 'STRING';
      const isSubcommand = usedOption && usedOption.type === 'SUB_COMMAND';
      await appCommands[commandName].execute({ interaction, nessie, mixpanel });
      /**
       * Send event information to mixpanel for application commands
       * This is called here so we don't have to repeatadly call them in tn their respective command handlers
       * The sendMixpanelEvent handler is defaulted to send events as commands/subcommands
       * For other interactions, we have to call them in their own handlers
       * TODO: Cleanup analytics code; right now the handler is super smart but sacrifices readability
       */
      sendMixpanelEvent({
        user: interaction.user,
        channel: interaction.channel,
        guild: interaction.guild,
        command: commandName,
        subcommand: isSubcommand ? usedOption.name : null,
        arguments: isArgument ? usedOption.value : null,
        client: mixpanel,
        isApplicationCommand: true,
      });
    }
    /**
     * Since components are also interactions, any user inputs from it go through this listener too
     * This does prove to be a hassle code readability wise as the handlers for these interactions are now detached from their own files
     * Tried to make it less ugly tho and house the implementations inside functions and call them here
     * Will still have to check the customId for each of the buttons here though
     */
    if (interaction.isButton()) {
      /**
       * Fancy handling of when the wrong user tries to use someone else's interactions
       * Fortunately discord has the original interaction attached to the current one's payload which makes this straightforward
       * We'll send the wrong user an ephemeral reply indicating that they can only use their own commands
       */
      if (
        interaction.message.interaction &&
        interaction.user.id !== interaction.message.interaction.user.id
      ) {
        const wrongUserEmbed = {
          description: `Oops looks like that interaction wasn't meant for you! Nessie can only properly interact with your own commands.\n\nTo check what Nessie can do, type ${codeBlock(
            '/help'
          )}!`,
          color: 16711680,
        };
        await interaction.deferReply({ ephemeral: true });
        sendMixpanelEvent({
          user: interaction.user,
          channel: interaction.channel,
          guild: interaction.guild,
          client: mixpanel,
          arguments: interaction.customId,
          customEventName: 'Click wrong user button',
        });
        return interaction.editReply({ embeds: [wrongUserEmbed] });
      }
      switch (interaction.customId) {
        case 'statusStart__backButton':
          return goBackToGameModeSelection({ interaction, nessie, mixpanel });
        case 'statusStart__cancelButton':
          return _cancelStatusStart({ interaction, nessie, mixpanel });
        case 'statusStop__cancelButton':
          return _cancelStatusStop({ interaction, nessie, mixpanel });
        case 'statusStop__stopButton':
          return deleteGuildStatus({ interaction, nessie, mixpanel });
        default:
          if (interaction.customId.includes('statusStart__confirmButton')) {
            return createStatus({ interaction, nessie, mixpanel });
          }
      }
    }
    if (interaction.isSelectMenu()) {
      if (
        interaction.message.interaction &&
        interaction.user.id !== interaction.message.interaction.user.id
      ) {
        const wrongUserEmbed = {
          description: `Oops looks like that interaction wasn't meant for you! Nessie can only properly interact with your own commands.\n\nTo check what Nessie can do, type ${codeBlock(
            '/help'
          )}!`,
          color: 16711680,
        };
        await interaction.deferReply({ ephemeral: true });
        sendMixpanelEvent({
          user: interaction.user,
          channel: interaction.channel,
          guild: interaction.guild,
          client: mixpanel,
          arguments: interaction.customId,
          customEventName: 'Click wrong user select menu',
        });
        return interaction.editReply({ embeds: [wrongUserEmbed] });
      }
      switch (interaction.customId) {
        case 'statusStart__gameModeDropdown':
          return goToConfirmStatus({ interaction, nessie, mixpanel });
      }
    }
  });
  nessie.on('rateLimit', async (data) => {
    const uuid = uuidv4();
    const type = 'Rate Limited';
    const error = {
      message: data
        ? `\n• Timeout: ${data.timeout}ms\n• Limit: ${data.limit}\n• Method: ${data.method}\n• Path: ${data.path}\n• Route: ${data.route}\n• Global: ${data.global}`
        : 'Unexpected rate limit error',
    };
    await sendErrorLog({ nessie, error, type, uuid, ping: true });
  });
}
