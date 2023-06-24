import { StringSelectMenuInteraction, ApplicationCommandOptionType } from 'discord.js';
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
      if (interaction.isButton()) {
        if (
          interaction.message.interaction &&
          interaction.user.id !== interaction.message.interaction.user.id
        ) {
          await sendWrongUserWarning({ interaction, mixpanel });
        } else {
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
            case 'statusStart__confirmButton':
              createStatus({ interaction, nessie: app, mixpanel });
              break;
          }
        }
      }
      if (interaction.isAnySelectMenu()) {
        if (
          interaction.message.interaction &&
          interaction.user.id !== interaction.message.interaction.user.id
        ) {
          sendWrongUserWarning({ interaction, mixpanel });
        } else {
          switch (interaction.customId) {
            case 'statusStart__gameModeDropdown':
              goToConfirmStatus({
                interaction: interaction as StringSelectMenuInteraction,
                mixpanel,
              });
              break;
          }
        }
      }
    } catch (error) {
      sendErrorLog({ error });
    }
  });
}
