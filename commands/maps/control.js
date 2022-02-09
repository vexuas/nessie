const { getControlPubs } = require('../../adapters');

module.exports = {
  name: 'control',
  description: 'Shows current map rotation for control mode',
  async execute({ nessie, message, nessiePrefix }) {
    message.channel.sendTyping();
    try {
      const data = await getControlPubs();
      console.log(data);
    } catch (error) {}
  },
};
