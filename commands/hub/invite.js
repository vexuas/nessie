const { generateAnnouncementMessage } = require('../../helpers');

module.exports = {
  name: 'invite',
  description: 'Generates an invite link for Nessie',
  execute({ message, nessiePrefix }) {
    const embed = {
      description:
        generateAnnouncementMessage(nessiePrefix) +
        `${message.author} | [Add me to your servers! (◕ᴗ◕✿)](https://tinyurl.com/nessie-invite-v021)`,
      color: 3447003,
    };
    message.channel.send({ embeds: [embed] });
  },
};
