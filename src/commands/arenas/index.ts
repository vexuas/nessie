import { SlashCommandBuilder } from '@discordjs/builders';
import { getArenasPubs, getArenasRanked } from '../../services/adapters';
import {
  generateErrorEmbed,
  generatePubsEmbed,
  generateRankedEmbed,
  sendErrorLog,
} from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';
import { v4 as uuidV4 } from 'uuid';

export default {
  commandType: 'Maps',
  data: new SlashCommandBuilder()
    .setName('arenas')
    .setDescription('Shows current map rotation for arenas')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Game Mode')
        .setRequired(true)
        .addChoice('pubs', 'arenas_pubs')
        .addChoice('ranked', 'arenas_ranked')
    ),
  async execute({ interaction, app }: AppCommandOptions) {
    let data;
    let embed;
    try {
      await interaction.deferReply();
      const optionMode = interaction.options.getString('mode');
      switch (optionMode) {
        case 'arenas_pubs':
          data = await getArenasPubs();
          embed = generatePubsEmbed(data, 'Arenas');
          break;
        case 'arenas_ranked':
          data = await getArenasRanked();
          embed = generateRankedEmbed(data, 'Arenas');
          break;
      }
      await interaction.editReply({ embeds: [embed] });
      // sendMixpanelEvent(
      //   interaction.user,
      //   interaction.channel,
      //   interaction.guild,
      //   'arenas',
      //   mixpanel,
      //   optionMode,
      //   true
      // );
    } catch (error) {
      const uuid = uuidV4();
      const type = 'Arenas';
      const errorEmbed = await generateErrorEmbed(error, uuid, app);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie: app, error, type, interaction, uuid });
    }
  },
} as AppCommand;
