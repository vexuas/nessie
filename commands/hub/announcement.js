module.exports = {
  name: 'announcement',
  description: 'Displays current important news about Nessie',
  execute({ message }) {
    message.channel.send('announcement prefix command');
  },
};
