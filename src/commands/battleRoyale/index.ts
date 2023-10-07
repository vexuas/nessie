import { SlashCommandBuilder } from 'discord.js';
import {
  getBattleRoyalePubs,
  getBattleRoyaleRanked,
  getSeasonInformation,
} from '../../services/adapters';
import {
  formatSeasonEndCountdown,
  generatePubsEmbed,
  generateRankedEmbed,
  sendErrorLog,
} from '../../utils/helpers';
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
          embed = generatePubsEmbed(data);
          break;
        case 'br_ranked':
          data = await getBattleRoyaleRanked();
          const season = await getSeasonInformation();
          //TODO: Figure out formatting for different timezones eventually
          const seasonEnd = season
            ? formatSeasonEndCountdown({
                seasonEnd: season.dates.End * 1000,
                currentDate: new Date(),
              })
            : null;
          embed = generateRankedEmbed(data, 'Battle Royale', seasonEnd);
          break;
      }
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction, option: optionMode });
    }
  },
} as AppCommand;
