import {
  createStatus,
  goBackToGameModeSelection,
  _cancelStatusStart,
  goToConfirmStatus,
} from '../../commands/maps/status/start';
import { deleteGuildStatus, _cancelStatusStop } from '../../commands/maps/status/stop';
import { codeBlock } from '../../utils/helpers';
import { EventModule } from '../events';

export default function ({ nessie, mixpanel, appCommands }: EventModule) {
  nessie.on('interactionCreate', async (interaction) => {
    if (!appCommands) return;
    if (!interaction.inGuild()) return; //Only respond in server channels or if it's an actual command

    if (interaction.isCommand()) {
      const { commandName } = interaction;

      // const usedOption = options.data[0];
      // const isArgument = usedOption && usedOption.type === 'STRING';
      // const isSubcommand = usedOption && usedOption.type === 'SUB_COMMAND';
      await appCommands[commandName as any].execute({ interaction, nessie, mixpanel });

      // mixpanel &&
      //   sendCommandEvent({
      //     user: interaction.user,
      //     channel: interaction.channel,
      //     guild: interaction.guild,
      //     command: commandName,
      //     client: mixpanel,
      //   });
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
          goBackToGameModeSelection({ interaction, nessie, mixpanel });
          return;
        case 'statusStart__cancelButton':
          _cancelStatusStart({ interaction, nessie, mixpanel });
        case 'statusStop__cancelButton':
          _cancelStatusStop({ interaction, nessie, mixpanel });
        case 'statusStop__stopButton':
          deleteGuildStatus({ interaction, nessie, mixpanel });
        default:
          if (interaction.customId.includes('statusStart__confirmButton')) {
            createStatus({ interaction, nessie, mixpanel });
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
          goToConfirmStatus({ interaction, nessie, mixpanel });
      }
    }
  });
}
