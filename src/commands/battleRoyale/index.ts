import { SlashCommandBuilder } from '@discordjs/builders';
import { getBattleRoyalePubs, getBattleRoyaleRanked } from '../../services/adapters';
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
        .addChoice('pubs', 'br_pubs')
        .addChoice('ranked', 'br_ranked')
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
          embed = generateRankedEmbed(data);
          break;
      }
      await interaction.editReply({ embeds: [embed] });
      // sendMixpanelEvent(
      //   interaction.user,
      //   interaction.channel,
      //   interaction.guild,
      //   'br',
      //   mixpanel,
      //   optionMode,
      //   true
      // );
    } catch (error) {
      sendErrorLog({ error, interaction, option: optionMode });
    }
  },
} as AppCommand;
