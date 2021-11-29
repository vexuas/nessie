const generateEmbed = (prefix) => {
  const embed = {
    color: 3447003,
    fields: [
      {
        name: 'Current Prefix',
        value: prefix,
        inline: true
      },
      {
        name: 'Usage Example',
        value: `${prefix}help`,
        inline: true
      }
    ]
  };
  return [embed];
};

module.exports = {
  name: 'prefix',
  description: 'Shows current prefix',
  hasArguments: false,
  execute({message, nessiePrefix}) {
    const currentPrefix = nessiePrefix;
    const embed = generateEmbed(currentPrefix);
    message.channel.send({ embeds: embed });
  }
};
