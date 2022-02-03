const generateAnnouncementEmbed = () => {
  const embed = {
    title: 'Announcement',
    color: 16776960,
    description: 'Announcement here',
    thumbnail: {
      url: 'https://cdn.discordapp.com/attachments/889134541615292459/896698383593517066/sir_nessie.png',
    },
  };
  return [embed];
};

module.exports = {
  name: 'announcement',
  description: 'Displays current important news about Nessie',
  async execute({ message }) {
    const embed = generateAnnouncementEmbed();
    await message.channel.send({ embeds: embed });
  },
};
