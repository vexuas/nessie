const { generateAnnouncementMessage } = require('../../helpers');

module.exports = {
  name: 'invite',
  description: 'Generates an invite link for Nessie',
  execute({ message, nessiePrefix }) {
    const embed = {
      description:
        generateAnnouncementMessage(nessiePrefix) +
        `${message.author} | [Add me to your servers! (◕ᴗ◕✿)](https://discord.com/api/oauth2/authorize?client_id=889135055430111252&permissions=85008&scope=applications.commands%20bot)`,
      color: 3447003,
    };
    message.channel.send({ embeds: [embed] });
  },
};
