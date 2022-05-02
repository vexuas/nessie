const { SlashCommandBuilder } = require('@discordjs/builders');
const { getArenasPubs, getArenasRanked } = require('../../adapters');
const { sendErrorLog, generateErrorEmbed } = require('../../helpers');
const { v4: uuidv4 } = require('uuid');
const { sendMixpanelEvent } = require('../../analytics');

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
const generatePubsEmbed = (data) => {
  const embedData = {
    title: 'Arenas | Pubs',
    color: 3066993,
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
const generateRankedEmbed = (data) => {
  const embedData = {
    title: 'Arenas | Ranked',
    color: 7419530,
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
  data: new SlashCommandBuilder()
    .setName('arenas')
    .setDescription('Shows current map rotation for arenas')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Game Mode')
        .setRequired(true)
        .addChoice('pubs', 'arenas_pubs')
        .addChoice('ranked', 'arenas_ranked')
    ),
  /**
   * Send correct game mode map information based on user option
   * We want to defer interaction as discord invalidates token after 3 seconds and we're retrieving our data through the api
   * This is pretty cool as discord will treat it as a normal response and we can do whatever we want with it within 15 minutes
   * which is editing the reply with the relevant information after the promise resolves
   **/
  async execute({ nessie, interaction, mixpanel }) {
    let data;
    let embed;
    try {
      await interaction.deferReply();
      const optionMode = interaction.options.getString('mode');
      switch (optionMode) {
        case 'arenas_pubs':
          data = await getArenasPubs();
          embed = generatePubsEmbed(data);
          break;
        case 'arenas_ranked':
          data = await getArenasRanked();
          embed = generateRankedEmbed(data);
          break;
      }
      await interaction.editReply({ embeds: embed });
      sendMixpanelEvent(
        interaction.user,
        interaction.channel,
        interaction.guild,
        'arenas',
        mixpanel,
        optionMode,
        true
      );
    } catch (error) {
      const uuid = uuidv4();
      const type = 'Battle Royale';
      const errorEmbed = generateErrorEmbed(
        'Oops something went wrong! D: Try again in a bit!',
        uuid
      );
      await interaction.editReply({ embeds: errorEmbed });
      await sendErrorLog({ nessie, error, type, interaction, uuid });
    }
  },
};
