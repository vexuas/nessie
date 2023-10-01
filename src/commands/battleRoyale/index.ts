import { SlashCommandBuilder } from 'discord.js';
import {
  getBattleRoyalePubs,
  getBattleRoyaleRanked,
  getSeasonInformation,
} from '../../services/adapters';
import { generatePubsEmbed, generateRankedEmbed, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export default {
  commandType: 'Maps',
  data: new SlashCommandBuilder()
    .setName('br')
    .setDescription('Shows current map rotation for battle royale')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Game Mode')
        .setRequired(true)
        .addChoices({ name: 'pubs', value: 'br_pubs' }, { name: 'ranked', value: 'br_ranked' })
    ),
  async execute({ interaction }: AppCommandOptions) {
    let data;
    let embed;
    const optionMode = interaction.options.getString('mode');
    try {
      await interaction.deferReply();
      switch (optionMode) {
        case 'br_pubs':
          data = await getBattleRoyalePubs();
          embed = generatePubsEmbed(data, 'Battle Royale');
          break;
        case 'br_ranked':
          data = await getBattleRoyaleRanked();
          const season = await getSeasonInformation();
          embed = generateRankedEmbed(data, 'Battle Royale', season);
          break;
      }
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction, option: optionMode });
    }
  },
} as AppCommand;
