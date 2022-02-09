const { getControlPubs } = require('../../adapters');
const { sendErrorLog, generateErrorEmbed, generateAnnouncementMessage } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');

const getCountdown = (timer) => {
  const countdown = timer.split(':');
  const isOverAnHour = countdown[0] && countdown[0] !== '00';
  return `${isOverAnHour ? `${countdown[0]} hr ` : ''}${countdown[1]} mins ${countdown[2]} secs`;
};

const generatePubsEmbed = (data, prefix) => {
  const embedData = {
    title: 'Control | Pubs',
    color: 3066993,
    description: generateAnnouncementMessage(prefix),
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
  name: 'control',
  description: 'Shows current map rotation for control mode',
  async execute({ nessie, message, nessiePrefix }) {
    message.channel.sendTyping();
    try {
      const data = await getControlPubs();
      const embedToSend = generatePubsEmbed(data, nessiePrefix);
      return await message.channel.send({ embeds: embedToSend });
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Control';
      const errorEmbed = generateErrorEmbed(
        'Oops something went wrong! D: Try again in a bit!',
        uuid
      );
      await message.channel.send({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, type, message, uuid });
    }
  },
};
