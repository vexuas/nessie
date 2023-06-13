import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types';
import { scheduleStatus } from '../../commands/maps/status/start';
import { BOT_TOKEN, ENV, GUILD_ID } from '../../config/environment';
import { getBattleRoyalePubs } from '../../services/adapters';
import { createGuildTable, createStatusTable } from '../../services/database';
import { sendHealthLog } from '../../utils/helpers';
import { EventModule } from '../events';

const rest = new REST({ version: '9' }).setToken(BOT_TOKEN);

const registerApplicationCommands = async (appCommands?: any[]) => {
  if (!appCommands) return;
  const isInDevelopment = ENV === 'dev';
  const publicCommandList = Object.keys(appCommands)
    .map((key: any) => !appCommands[key].isAdmin && appCommands[key].data)
    .filter((command) => command)
    .map((command) => command.toJSON());
  const adminCommandList = Object.keys(appCommands)
    .map((key: any) => appCommands[key].isAdmin && appCommands[key].data)
    .filter((command) => command)
    .map((command) => command.toJSON());
  const fullCommandList = Object.keys(appCommands)
    .map((key: any) => appCommands[key].data)
    .filter((command) => command)
    .map((command) => command.toJSON());

  if (isInDevelopment) {
    //Guild register
    try {
      await rest.put(Routes.applicationGuildCommands('929421200797626388', GUILD_ID), {
        body: fullCommandList,
      });
      console.log('Successfully registered guild application commands');
    } catch (e) {
      console.log(e);
    }
  } else {
    //Global Register
    //TODO: Maybe create a script one day to delete global commands for test bot
    //TODO: Make fetching of bot id dynamic as it will either use production or testing id
    try {
      await rest.put(Routes.applicationCommands('889135055430111252'), { body: publicCommandList });
      await rest.put(Routes.applicationGuildCommands('889135055430111252', GUILD_ID), {
        body: adminCommandList,
      });
      console.log('Successfully registered global application commands');
    } catch (e) {
      console.log(e);
    }
  }
};

const setCurrentMapStatus = (data: any, channel: any, nessie: any) => {
  const fiveSecondsBuffer = 5000;
  let currentBrPubsData = data;
  let currentTimer = data.current.remainingSecs * 1000 + fiveSecondsBuffer;
  const intervalRequest = async () => {
    try {
      const updatedBrPubsData = await getBattleRoyalePubs();
      /**
       * Checks to see if the data taken from API is accurate
       * Was brought to my attention that the status was displaying the wrong map at one point
       * Not sure why this is happening so just adding a notification when this happens again
       * Don't really want to add extra code for now, if it happens again then i'll fix it
       */
      const isAccurate = currentBrPubsData.next.code === updatedBrPubsData.current.code;
      currentBrPubsData = updatedBrPubsData;
      currentTimer = updatedBrPubsData.current.remainingSecs * 1000 + fiveSecondsBuffer;
      nessie.user.setActivity(updatedBrPubsData.current.map);
      sendHealthLog(updatedBrPubsData, channel, isAccurate);
      setTimeout(intervalRequest, currentTimer);
    } catch (e) {
      console.log(e);
      channel.send('<@183444648360935424> WHOOPS SOMETHING WENT WRONG');
    }
  };
  setTimeout(intervalRequest, currentTimer); //Start initial timer
};

export default function ({ nessie, appCommands }: EventModule) {
  nessie.once('ready', async () => {
    await registerApplicationCommands(appCommands);
    try {
      const testChannel = nessie.channels.cache.get('889212328539725824');
      const logChannel = nessie.channels.cache.get('899620845436141609');
      testChannel && testChannel.isText() && testChannel.send("I'm booting up! (◕ᴗ◕✿)"); //Sends to test bot channel in nessie's canyon

      createGuildTable(nessie.guilds.cache, nessie);
      createStatusTable();

      const brPubsData = await getBattleRoyalePubs();
      nessie.user && nessie.user.setActivity(brPubsData.current.map);
      sendHealthLog(brPubsData, logChannel, true);
      setCurrentMapStatus(brPubsData, logChannel, nessie);

      const statusSchedule = scheduleStatus(nessie);
      statusSchedule.start();
    } catch (e) {
      console.log(e); //Add proper error handling
    }
  });
}
