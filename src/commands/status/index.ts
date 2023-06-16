import { SlashCommandBuilder } from '@discordjs/builders';
import { AppCommand, AppCommandOptions } from '../commands';
import { sendHelpInteraction } from './help';
import { sendStartInteraction } from './start';
import { sendStopInteraction } from './stop';

export default {
  commandType: 'Automation',
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Get your automatic map updates here!')
    .addSubcommand((subCommand) =>
      subCommand
        .setName('help')
        .setDescription('Displays information on setting up automatic map updates')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('start').setDescription('Set up automatic map updates')
    )
    .addSubcommand((subCommand) =>
      subCommand.setName('stop').setDescription('Stops existing automatic map updates')
    ),
  async execute({ app, interaction }: AppCommandOptions) {
    const subCommand = interaction.options.getSubcommand();
    await interaction.deferReply();
    switch (subCommand) {
      case 'help':
        return sendHelpInteraction({ interaction, subCommand });
      case 'start':
        return sendStartInteraction({ interaction, nessie: app });
      case 'stop':
        return sendStopInteraction({ interaction, nessie: app });
    }
  },
} as AppCommand;
