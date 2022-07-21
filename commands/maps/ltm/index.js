const { SlashCommandBuilder } = require('@discordjs/builders');
const { v4: uuidv4 } = require('uuid');
const { getLimitedTimeEvent } = require('../../../adapters');
const { generateErrorEmbed, getMapUrl, getCountdown, sendErrorLog } = require('../../../helpers');

const generateLimitedTimeEventEmbed = (data) => {
  const embedData = {
    title: data.current.eventName,
    description: '',
    color: 15105570,
    image: {
      url:
        getMapUrl(data.current.code).length > 0 ? getMapUrl(data.current.code) : data.current.asset,
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
  return embedData;
};
/**
 * Handler for limited time events
 * Tbh I'm not so sure what I want to do with this currently
 * Since it's definitely not scalable to be updating and releasing everytime an event ends
 * Maybe make it so that it'll always exist as a command and return a specific error if there's no ltm?
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ltm')
    .setDescription('Shows current limited event map rotation'),
  async execute({ nessie, interaction }) {
    try {
      await interaction.deferReply();
      const data = await getLimitedTimeEvent();
      const embed = generateLimitedTimeEventEmbed(data);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Limited Time Event';
      const errorEmbed = await generateErrorEmbed(error, uuid, nessie);
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, interaction, type, uuid });
    }
  },
};
