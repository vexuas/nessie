import { SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { getArenasPubs, getArenasRanked } from '../../services/adapters';
import { generatePubsEmbed, generateRankedEmbed, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export default {
  commandType: 'Maps',
  data: new SlashCommandBuilder()
    .setName('arenas')
    .setDescription('Shows current map rotation for arenas')
    .addStringOption((option: SlashCommandStringOption) =>
      option
        .setName('mode')
        .setDescription('Game Mode')
        .setRequired(true)
        .addChoices(
          { name: 'pubs', value: 'arenas_pubs' },
          { name: 'ranked', value: 'arenas_ranked' }
        )
    ),
  async execute({ interaction }: AppCommandOptions) {
    let data;
    let embed;
    const optionMode = interaction.options.getString('mode');
    try {
      await interaction.deferReply();
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
    } catch (error) {
      sendErrorLog({ error, interaction, option: optionMode });
    }
  },
} as AppCommand;
