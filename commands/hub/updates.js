const { nessieLogo } = require('../../constants');
const { version } = require('../../package.json');

const sendUpdatesEmbed = async ({ message }) => {
  const embed = {
    title: `v${version} | 15 April 2022`,
    color: 3447003,
    description:
      "**Battle Royale Ranked Timer**\nJust a quick small update. With the latest release of the apex legends api, it’s now possible to directly show the current timer of battle royale ranked from it. This is a pretty cool change as I’ve opted to not have the timer before as it’s a hassle to manually change the ending dates. However, Nessie’s battle royale ranked command will now show not only the map but also the remaining time left of the split! Go see it now through `/br ranked`\n\nSorry if the updates are not as consistent. Been having a rough couple of weeks mentally and it’s honestly draining trying to get stuff done. No worries though, I’ll get myself back up and running! Had a bad 2 weeks but won’t let it shape the rest of the month/year **(ง •̀ω•́)ง.** That being said, I’ve shelfed the website for now and currently working on the automatic status. Don’t want to give any deadlines but I’ll try to get this cool new feature out by the end of April! Wish me luck :D\n\nThat's about it for now. Stay Classy, Legends\n-----\nFor a full list of previous release notes, check it out [here](https://github.com/vexuas/nessie/releases)!",
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
