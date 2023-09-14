import {
  ActionRowBuilder,
  APIEmbed,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  roleMention,
  SlashCommandBuilder,
} from 'discord.js';
import { checkMissingBotPermissions, getEmbedColor, sendErrorLog } from '../../utils/helpers';
import { AppCommand, AppCommandOptions } from '../commands';

export const createSpikeRole = async (interaction: ButtonInteraction) => {
  try {
    const { guild, channel } = interaction;
    await interaction.deferUpdate();
    const role = guild && (await guild.roles.create({ name: 'SpikeRole' }));
    const embed: APIEmbed = {
      description: `Created ${roleMention(role ? role.id : '')}`,
    };
    channel && (await channel.send({ embeds: [embed] }));
  } catch (error) {
    sendErrorLog({ interaction, error });
  }
};
export const assignSpikeRole = async (interaction: ButtonInteraction) => {
  try {
    await interaction.deferUpdate();
    const { guild, member } = interaction;
    const role = await guild?.roles.fetch('1151576864314363976');

    member &&
      role &&
      (await guild?.members.addRole({
        user: member.user.id,
        role: role.id,
      }));
  } catch (error) {
    sendErrorLog({ interaction, error });
  }
};
export const pingSpikeRole = async (interaction: ButtonInteraction) => {
  try {
    await interaction.deferUpdate();
    const { channel } = interaction;

    channel &&
      (await channel.send({ content: `${roleMention('1151576864314363976')} Map start!` }));
  } catch (error) {
    sendErrorLog({ interaction, error });
  }
};

export default {
  data: new SlashCommandBuilder()
    .setName('spikeroles')
    .setDescription('Spike roles necessary for map alerts'),
  async execute({ interaction }: AppCommandOptions) {
    try {
      await interaction.deferReply();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Create Role')
          .setStyle(ButtonStyle.Success)
          .setCustomId('spikeRole__createRole'),
        new ButtonBuilder()
          .setLabel('Assign Role')
          .setStyle(ButtonStyle.Primary)
          .setCustomId('spikeRole__assignRole'),
        new ButtonBuilder()
          .setLabel('Ping Role')
          .setStyle(ButtonStyle.Danger)
          .setCustomId('spikeRole__pingRole')
      );
      const {
        hasAdmin,
        hasManageChannels,
        hasManageWebhooks,
        hasSendMessages,
        hasViewChannel,
        hasManageRoles,
      } = checkMissingBotPermissions(interaction);
      const embed: APIEmbed = {
        description: `• hasAdmin: ${hasAdmin}\n• hasManageChannels: ${hasManageChannels}\n• hasManageWebhooks: ${hasManageWebhooks}\n• hasSendMessage: ${hasSendMessages}\n• hasViewChannel: ${hasViewChannel}\n• hasManageRoles: ${hasManageRoles}`,
        color: getEmbedColor(),
      };
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      sendErrorLog({ error, interaction });
    }
  },
} as AppCommand;
