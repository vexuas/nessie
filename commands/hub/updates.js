const { nessieLogo } = require('../../constants');
const { version } = require('../../package.json');

const sendUpdatesEmbed = async ({ message }) => {
  const embed = {
    title: `v${version} | 22 March 2022`,
    color: 3447003,
    description: `**New Logo, Updates Command**\nuwu what's this? A new command to stay up-to-date with Nessie's latest news? Heh tbh I feel like it'll just be me mindlessly writing random things 😂 But hey, it's good to keep things documented and I want you guys to also know what's going on so let's try this out for now!\n\nAnd you probably already have noticed 👀 Nessie has a new Logo! The old one was pretty cool and I liked the style but as Nessie continues to grow, it doesn't make sense to use a pic I snagged off from a google search. So I went ahead and made one! Not really an artist but I put effort in this so you better like it 😡😤\n\nAs for what I'm working on now, I'm in the midst of designing a website for Nessie. It's been fun learning web design and actually making the prototype. I don't have a clear deadline for it but tentatively will try to get it out in early April. And who knows, maybe the Automatic Updates will be sneaked in there too 🤷‍♂️ No promises tho heh\n\nThat's about it for now. Stay Classy, Legends\n-----\nFor a full list of previous release notes, check it out [here](https://github.com/vexuas/nessie/releases)! `,
    thumbnail: {
      url: nessieLogo,
    },
  };
  return await message.channel.send({ embeds: [embed] });
};
module.exports = {
  name: 'updates',
  description: 'Displays latest news and updates of Nessie',
  async execute({ message }) {
    sendUpdatesEmbed({ message });
  },
};
