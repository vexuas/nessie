import {
  createStatus,
  goBackToGameModeSelection,
  _cancelStatusStart,
  goToConfirmStatus,
} from '../../commands/status/start';
import { deleteGuildStatus, _cancelStatusStop } from '../../commands/status/stop';
import { codeBlock, sendErrorLog } from '../../utils/helpers';
import { EventModule } from '../events';

export default function ({ app, mixpanel, appCommands }: EventModule) {
  app.on('interactionCreate', async (interaction) => {
    try {
      if (!interaction.inGuild() || !appCommands) return;

      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;
        const command = appCommands.find((command) => command.data.name === commandName);
        command && (await command.execute({ interaction, app, appCommands }));
        // mixpanel &&
        // 	sendCommandEvent({
        // 		user: interaction.user,
        // 		channel: interaction.channel,
        // 		guild: interaction.guild,
        // 		command: commandName,
        // 		client: mixpanel,
        // 	});
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
          // sendMixpanelEvent({
          //   user: interaction.user,
          //   channel: interaction.channel,
          //   guild: interaction.guild,
          //   client: mixpanel,
          //   arguments: interaction.customId,
          //   customEventName: 'Click wrong user button',
          // });
          interaction.editReply({ embeds: [wrongUserEmbed] });
        }
        switch (interaction.customId) {
          case 'statusStart__backButton':
            goBackToGameModeSelection({ interaction });
            return;
          case 'statusStart__cancelButton':
            _cancelStatusStart({ interaction });
            return;
          case 'statusStop__cancelButton':
            _cancelStatusStop({ interaction, app, mixpanel });
            return;
          case 'statusStop__stopButton':
            deleteGuildStatus({ interaction, nessie: app });
            return;
          default:
            if (interaction.customId.includes('statusStart__confirmButton')) {
              createStatus({ interaction, nessie: app });
              return;
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
          // sendMixpanelEvent({
          //   user: interaction.user,
          //   channel: interaction.channel,
          //   guild: interaction.guild,
          //   client: mixpanel,
          //   arguments: interaction.customId,
          //   customEventName: 'Click wrong user select menu',
          // });
          interaction.editReply({ embeds: [wrongUserEmbed] });
        }
        switch (interaction.customId) {
          case 'statusStart__gameModeDropdown':
            goToConfirmStatus({ interaction });
            return;
        }
      }
    } catch (error) {
      sendErrorLog({ error });
    }
  });
}
