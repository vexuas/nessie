import { inlineCode, SlashCommandBuilder } from 'discord.js';
import { isEmpty, reduce, uniq } from 'lodash';
import { getEmbedColor, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export const generateHelpEmbed = (appCommands?: AppCommand[]) => {
  const commandTypes = uniq(
    appCommands?.map((command) => (command.commandType ? command.commandType : 'Others'))
  );
  const commandFields = commandTypes.map((type) => {
    const commandValues = reduce(
      appCommands,
      (accumulator, value) => {
        return `${accumulator}${isEmpty(accumulator) || value.commandType !== type ? '' : ', '}${
          value.commandType === type
            ? inlineCode(value.data.name)
            : !value.commandType && type === 'Others'
            ? inlineCode(value.data.name)
            : ''
        }`;
      },
      ''
    );
    return {
      name: type,
      value: commandValues,
      inline: false,
    };
  });
  const embed = {
    color: getEmbedColor(),
    description: 'Below you can see all the commands that I know!',
    fields: commandFields,
  };
  return embed;
};
export default {
  commandType: 'Information',
  data: new SlashCommandBuilder().setName('help').setDescription('Directory hub of commands'),
  async execute({ interaction, appCommands }: AppCommandOptions) {
    try {
      const embed = generateHelpEmbed(appCommands);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
