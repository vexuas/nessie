const { SlashCommandBuilder } = require('@discordjs/builders');
const { getControlPubs } = require('../../adapters');
const { sendErrorLog, generateErrorEmbed } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const { sendMixpanelEvent } = require('../../analytics');

/**
 * TODO: Figure out a system to show custom map images for map commands
 * Aside from br, the rest of the modes rely on the assets return by the API
 * These assets don't look good however I've decided to use them for now as it's direct
 * Manually wiring them up to our images isn't scalable either
 * I'll just leave this comment so I get reminded about it in the future
 */
const getCountdown = (timer) => {
  const countdown = timer.split(':');
  const isOverAnHour = countdown[0] && countdown[0] !== '00';
  return `${isOverAnHour ? `${countdown[0]} hr ` : ''}${countdown[1]} mins ${countdown[2]} secs`;
};

const generatePubsEmbed = (data) => {
  const embedData = {
    title: 'Control | Pubs',
    color: 3066993,
    image: {
      url: data.current.asset, //Using the scuffed saturated images as it'll be a chore adding custom images for each control map(some use areas of br maps)
    },
    timestamp: Date.now() + data.current.remainingSecs * 1000,
    footer: {
      text: `Next Map: ${data.next.map}`,
    },
    fields: [
      {
        name: 'Current map',
        value: '```fix\n\n' + data.current.map + '```',
        inline: true,
      },
      {
        name: 'Time left',
        value: '```xl\n\n' + getCountdown(data.current.remainingTimer) + '```',
        inline: true,
      },
    ],
  };
  return [embedData];
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('control')
    .setDescription('Shows current map rotation for control')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Game Mode')
        .setRequired(true)
        .addChoice('pubs', 'control_pubs')
    ),
  async execute({ nessie, interaction, mixpanel }) {
    let data;
    let embed;
    try {
      await interaction.deferReply();
      const optionMode = interaction.options.getString('mode');
      switch (optionMode) {
        case 'control_pubs':
          data = await getControlPubs();
          embed = generatePubsEmbed(data);
          break;
      }
      await interaction.editReply({ embeds: embed });
      sendMixpanelEvent(
        interaction.user,
        interaction.channel,
        interaction.guild,
        'control',
        mixpanel,
        optionMode,
        true
      );
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Control';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  },
};
