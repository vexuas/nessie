import { SlashCommandBuilder } from '@discordjs/builders';
import { AppCommand, AppCommandOptions } from '../commands';
import { sendHelpInteraction } from './help';
import { sendStartInteraction } from './start';
import { sendStopInteraction } from './stop';
import { v4 as uuidV4 } from 'uuid';
import { generateErrorEmbed, sendErrorLog } from '../../utils/helpers';

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
    const statusOption = interaction.options.getSubcommand();
    try {
      await interaction.deferReply();
      switch (statusOption) {
        case 'help':
          return sendHelpInteraction({ interaction, nessie: app });
        case 'start':
          return sendStartInteraction({ interaction, nessie: app });
        case 'stop':
          return sendStopInteraction({ interaction, nessie: app });
      }
    } catch (error) {
      const uuid = uuidV4();
      const type = 'Status Generic';
      const errorEmbed = await generateErrorEmbed(error, uuid, app);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie: app, error, interaction, type, uuid });
    }
  },
} as AppCommand;