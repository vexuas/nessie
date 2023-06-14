import { SlashCommandBuilder } from '@discordjs/builders';
import { getBattleRoyalePubs, getBattleRoyaleRanked } from '../../services/adapters';
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
  async execute({ interaction, app }: AppCommandOptions) {
    let data;
    let embed;
    try {
      await interaction.deferReply();
      const optionMode = interaction.options.getString('mode');
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
      const uuid = uuidV4();
      const type = 'Battle Royale';
      const errorEmbed = await generateErrorEmbed(error, uuid, app);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie: app, error, interaction, type, uuid });
    }
  },
} as AppCommand;
