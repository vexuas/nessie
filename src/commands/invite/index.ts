import { AppCommand, AppCommandOptions } from '../commands';
import { getEmbedColor, sendErrorLog } from '../../utils/helpers';
import { hyperlink, SlashCommandBuilder } from '@discordjs/builders';

//TODO: Add typing after upgrading to djs v14
export const generateInviteEmbed = () => {
  const embed = {
    description: hyperlink(
      'Add me to your servers! (◕ᴗ◕✿)',
      'https://discord.com/api/oauth2/authorize?client_id=889135055430111252&permissions=536874000&scope=applications.commands%20bot'
    ),
    color: getEmbedColor(),
  };
  return embed;
};

export default {
  commandType: 'Information',
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Generates an invite link for Nessie'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      const embed = generateInviteEmbed();
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
