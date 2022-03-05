module.exports = {
  name: 'status',
  description: 'Creates a channel to automatically show current map status',
  hasArguments: false,
  async execute({ nessie, message, nessiePrefix }) {
    message.channel.sendTyping();
    try {
      const statusCategory = await message.guild.channels.create(
        'Apex Legends Map Status [Nessie]',
        {
          type: 'GUILD_CATEGORY',
        }
      );
      const statusChannel = await message.guild.channels.create('battle-royale', {
        parent: statusCategory,
      });
      await message.channel.send(`Created map status at ${statusChannel}`);
    } catch (error) {
      console.log(error);
    }
  },
};
