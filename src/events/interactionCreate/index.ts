import { StringSelectMenuInteraction, ApplicationCommandOptionType } from 'discord.js';
import { createSpikeRole } from '../../commands/spikeRoles';
import { showStatusHelpMessage } from '../../commands/status/help';
import {
  createStatus,
  goBackToGameModeSelection,
  _cancelStatusStart,
  goToConfirmStatus,
} from '../../commands/status/start';
import { deleteGuildStatus, _cancelStatusStop } from '../../commands/status/stop';
import { sendAnalyticsEvent } from '../../services/analytics';
import { sendErrorLog, sendWrongUserWarning } from '../../utils/helpers';
import { EventModule } from '../events';

export default function ({ app, mixpanel, appCommands }: EventModule) {
  app.on('interactionCreate', async (interaction) => {
    try {
      if (!interaction.inGuild() || !appCommands) return;

      if (interaction.isChatInputCommand()) {
        const { commandName, options } = interaction;
        const hasArgument =
          options.data[0] && options.data[0].type === ApplicationCommandOptionType.String;
        const subCommand = interaction.options.getSubcommand(false);
        const command = appCommands.find((command) => command.data.name === commandName);
        command && (await command.execute({ interaction, app, appCommands }));

        const eventName = `Use ${commandName}${subCommand ? ` ${subCommand}` : ''} command`;
        mixpanel &&
          sendAnalyticsEvent({
            user: interaction.user,
            channel: interaction.channel,
            guild: interaction.guild,
            command: commandName,
            client: mixpanel,
            options: hasArgument ? options.data[0].value : null,
            eventName,
            subCommand,
          });
      }
      if (interaction.isButton() || interaction.isAnySelectMenu()) {
        if (
          interaction.message.interaction &&
          interaction.user.id !== interaction.message.interaction.user.id
        ) {
          sendWrongUserWarning({ interaction, mixpanel });
          return;
        }
      }
      if (interaction.isButton()) {
        switch (interaction.customId) {
          case 'statusStart__backButton':
            goBackToGameModeSelection({ interaction, mixpanel });
            break;
          case 'statusStart__cancelButton':
            _cancelStatusStart({ interaction, mixpanel });
            break;
          case 'statusStop__cancelButton':
            _cancelStatusStop({ interaction, mixpanel });
            break;
          case 'statusStop__stopButton':
            deleteGuildStatus({ interaction, nessie: app, mixpanel });
            break;
          case 'spikeRole__createRole':
            createSpikeRole(interaction);
            break;
          default:
            if (interaction.customId.includes('statusStart__confirmButton')) {
              createStatus({ interaction, nessie: app, mixpanel });
              return;
            }
        }
      }
      if (interaction.isAnySelectMenu()) {
        await interaction.deferUpdate();
        switch (interaction.customId) {
          case 'statusStart__gameModeDropdown':
            await goToConfirmStatus({
              interaction: interaction as StringSelectMenuInteraction,
              mixpanel,
            });
            break;
          case 'statusHelp__sectionDropdown':
            await showStatusHelpMessage({
              interaction: interaction as StringSelectMenuInteraction,
            });
            break;
        }
      }
    } catch (error) {
      sendErrorLog({ error });
    }
  });
}
