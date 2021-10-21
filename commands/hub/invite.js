module.exports = {
  name: 'invite',
  description: 'Generates an invite link for Nessie',
  execute({message}) {
    const embed = {
      description: `${
        message.author
      } | [Add me to your servers! (◕ᴗ◕✿)](https://tinyurl.com/nessie-invite-v021)`,
      color: 3447003
    }
    message.channel.send({ embeds: [embed] });
  }
};
