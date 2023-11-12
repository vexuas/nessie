import { SlashCommandBuilder } from 'discord.js';
import { SeasonAPISchema } from '../../schemas/season';
import {
  getBattleRoyalePubs,
  getBattleRoyaleRanked,
  getSeasonInformation,
} from '../../services/adapters';
import {
  formatSeasonEndCountdown,
  formatSplitEndCountdown,
  generatePubsEmbed,
  generateRankedEmbed,
  sendErrorLog,
} from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

//Cache season data as we don't want to abuse the API as well as only needing the end date anyway
//Isn't the best way storing this in a variable but didn't want to overengineer and having it in the database for now
let cachedSeason: SeasonAPISchema | null = null;

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
          const season = cachedSeason ?? (await getSeasonInformation());
          if (!cachedSeason) cachedSeason = season;
          //TODO: Figure out formatting for different timezones eventually
          const seasonEnd = formatSeasonEndCountdown({
            season,
            currentDate: new Date(),
          });
          const splitEnd = formatSplitEndCountdown({
            season,
            currentDate: new Date(),
          });
          embed = generateRankedEmbed(data, 'Battle Royale', seasonEnd, splitEnd);
          break;
      }
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction, option: optionMode });
    }
  },
} as AppCommand;
