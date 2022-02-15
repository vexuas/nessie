const { codeBlock } = require('../../helpers');
const generateAnnouncementEmbed = () => {
  const embed = {
    title: 'Announcement | 05 Feb 2022',
    color: 16776960,
    description: `Nessie is getting verified! Wohoooo 🎉\nBefore anything, I’d like to thank a bunch to everyone who used the bot so far! I didn't expect a project I made for myself and friends to get to this point, I really appreciate it! <3\n\n**What this means moving forward**\nAs you may or may not know, Discord is enforcing [message content to be a priviliged intent](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Privileged-Intent-for-Verified-Bots). To put it simply, verified bots will no longer be able to read messages under normal situations after April 2022. As Nessie doesn’t require any special cases in its functionality, this change will directly affect us meaning that Nessie will no longer be able to respond to prefix commands i.e ${codeBlock(
      '$nes-**'
    )}\n\nI understand that this is a big change, especially when Nessie was primarily only using prefix commands before; so to help with the transition I will keep support for prefix commands until **29th April 2022!**\n\n**Slash Commands**\nHow do I use Nessie now? Don’t worry our friends in Discord has introduced a cool new way to interact with bots! You may have seen them before in your servers: Slash (${codeBlock(
      '/'
    )}) commands!\nInstead of writing a command in chat and getting a reply, you can now directly access Nessie’s commands by writing ${codeBlock(
      '/commandHere'
    )}.\nFor example: ${codeBlock('$nes-help')} would now just be ${codeBlock(
      '/help'
    )}!\n\nMore information about Slash Commands [here](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ)\n\n**How to update Nessie**\nYou can get the latest version of Nessie by directly [re-inviting her](https://discord.com/api/oauth2/authorize?client_id=889135055430111252&permissions=3088&scope=applications.commands%20bot)! You will get access to Slash Commands and ongoing support for prefix commands.\n*Note that if you kick Nessie and invite her back, you will only have Slash Commands as I will only continue support for prefix commands for old servers*\n---\nThat’s about it! Thanks again for using Nessie and hope you continue to! If you have questions, feel free to join our [support server](https://discord.com/invite/47Ccgz9jA4) :D\n\n**TL;DR: Nessie is getting verified so prefix commands will no longer be supported after April 2022. Instead you can [reinvite](https://discord.com/api/oauth2/authorize?client_id=889135055430111252&permissions=3088&scope=applications.commands%20bot) Nessie to use Slash Commands**`,
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
