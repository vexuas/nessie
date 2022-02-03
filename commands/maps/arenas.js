const { getArenasPubs, getArenasRanked } = require('../../adapters');
const { sendErrorLog, generateErrorEmbed, generateAnnouncementMessage } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');

/**
 * Display the time left in a more aethestically manner
 * API returns in the form hr:min:sec (01:02:03)
 * Function returns hr hrs min mins sec secs (01 hrs 02 mins 03 secs);
 * Might want to think of using the number of remaining seconds instead of splitting the timer string in the future
 */
const getCountdown = (timer) => {
  const countdown = timer.split(':');
  const isOverAnHour = countdown[0] && countdown[0] !== '00';
  return `${isOverAnHour ? `${countdown[0]} hr ` : ''}${countdown[1]} mins ${countdown[2]} secs`;
};
/**
 * Embed design for Arenas Pubs
 * Added a hack to display the time for next map regardless of timezone
 * As discord embed has a timestamp property, I added the remianing milliseconds to the current date
 * Make reusable?
 */
const generatePubsEmbed = (data, prefix) => {
  const embedData = {
    title: 'Arenas | Pubs',
    color: 3066993,
    description: generateAnnouncementMessage(prefix),
    image: {
      url: data.current.asset, //Using the scuffed saturated images as it'll be a chore adding custom images for each arenas map(some use areas of br maps)
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
/**
 * Embed design for Arenas Ranked
 * Slighly different from BR ranked and similar to its Pubs counterpart
 * Might want to make all of these reusable, a lot of repeats
 */
const generateRankedEmbed = (data, prefix) => {
  const embedData = {
    title: 'Arenas | Ranked',
    color: 7419530,
    description: generateAnnouncementMessage(prefix),
    image: {
      url: data.current.asset, //Using the scuffed saturated images as it'll be a chore adding custom images for each arenas map(some use areas of br maps)
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
  name: 'arenas',
  description: 'Shows currrent map rotation for arenas mode',
  hasArguments: true,
  async execute({ nessie, message, arguments, nessiePrefix }) {
    message.channel.sendTyping();
    try {
      if (!arguments) {
        const data = await getArenasPubs();
        const embedToSend = generatePubsEmbed(data, nessiePrefix);
        return message.channel.send({ embeds: embedToSend });
      } else {
        if (arguments === 'ranked') {
          const data = await getArenasRanked();
          const embedToSend = generateRankedEmbed(data, nessiePrefix);
          return message.channel.send({ embeds: embedToSend });
        }
        return message.channel.send("I don't understand that argument （・□・；）");
      }
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Arenas';
      const errorEmbed = generateErrorEmbed(
        'Oops something went wrong! D: Try again in a bit!',
        uuid
      );
      await message.channel.send({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, type, message, uuid });
    }
  },
};
