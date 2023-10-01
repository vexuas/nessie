import { SlashCommandBuilder } from 'discord.js';
import { AppCommand, AppCommandOptions } from '../commands';
import { sendStatusHelpInformationInteraction } from './help';
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
  async execute({ interaction }: AppCommandOptions) {
    const subCommand = interaction.options.getSubcommand();
    await interaction.deferReply();
    const { guild } = interaction;

    [
      '1158096220493975694',
      '1158096222570152039',
      '1158096224222720020',
      '1158096225799766037',
      '1158096227481690133',
      '1158096229285232651',
      '1158096231302692985',
      '1158096232850411550',
      '1158096234268086365',
      '1158096235811577947',
      '1158096237053100073',
      '1158096239343177749',
      '1158096240848941056',
      '1158096242514067497',
      '1158096244141477950',
      '1158096245747888228',
      '1158096247371083796',
      '1158096248826495118',
      '1158096250940444742',
      '1158096252920152136',
      '1158096255411572797',
      '1158096257051541504',
      '1158096258523725854',
      '1158096260813836399',
      '1158096262525091840',
      '1158096264475459665',
      '1158096266090254427',
      '1158096267793137796',
      '1158096275460325376',
      '1158096277150646333',
      '1158096278748676127',
      '1158096280573186109',
      '1158096282213175306',
      '1158096284457107466',
      '1158096286348750989',
      '1158096287732879422',
      '1158096290194935898',
      '1158096291717464094',
      '1158096293164503220',
      '1158096294749937674',
    ].forEach((r) => {
      guild?.roles.delete(r);
    });
    switch (subCommand) {
      case 'help':
        return sendStatusHelpInformationInteraction({ interaction, subCommand });
      // return sendHelpInteraction({ interaction, subCommand });
      case 'start':
        return sendStartInteraction({ interaction, subCommand });
      case 'stop':
        return sendStopInteraction({ interaction, subCommand });
    }
  },
} as AppCommand;
