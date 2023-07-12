import { REST, Routes } from 'discord.js';
import { AppCommand } from '../../commands/commands';
import { scheduleStatus } from '../../commands/status/start';
import { BOT_ID, BOT_TOKEN, DATABASE_CONFIG, ENV, GUILD_ID } from '../../config/environment';
import { getBattleRoyalePubs } from '../../services/adapters';
import { createGuildTable, createStatusTable, populateGuilds } from '../../services/database';
import { sendBootNotification, sendErrorLog } from '../../utils/helpers';
import { EventModule } from '../events';

const rest = new REST({ version: '9' }).setToken(BOT_TOKEN);

const registerApplicationCommands = async (commands?: AppCommand[]) => {
  if (!commands) return;
  const commandList = commands.map((command) => command.data.toJSON());

  try {
    if (ENV === 'dev') {
      if (GUILD_ID) {
        //Registering guild-only commands to the bot i.e. only specified servers will see commands; I like to use a different bot when in development
        await rest.put(Routes.applicationGuildCommands(BOT_ID, GUILD_ID), {
          body: commandList,
        });
        console.log('Successfully registered guild application commands');
      }
    } else {
      //Registering global commands for the bot i.e. every server bot is in will see commands; use this in production
      await rest.put(Routes.applicationCommands(BOT_ID), { body: commandList });
      console.log('Successfully registered global application commands');
    }
  } catch (error) {
    sendErrorLog({ error });
  }
};

const setCurrentMapStatus = (data: any, nessie: any) => {
  const fiveSecondsBuffer = 5000;
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
      currentTimer = updatedBrPubsData.current.remainingSecs * 1000 + fiveSecondsBuffer;
      nessie.user.setActivity(updatedBrPubsData.current.map);
      setTimeout(intervalRequest, currentTimer);
    } catch (error) {
      sendErrorLog({ error });
    }
  };
  setTimeout(intervalRequest, currentTimer); //Start initial timer
};

export default function ({ app, appCommands }: EventModule) {
  app.once('ready', async () => {
    try {
      await registerApplicationCommands(appCommands);
      if (DATABASE_CONFIG) {
        await createGuildTable();
        await populateGuilds(app.guilds.cache);
        await createStatusTable();
      }
      await sendBootNotification(app);

      const brPubsData = await getBattleRoyalePubs();
      app.user && app.user.setActivity(brPubsData.current.map);
      setCurrentMapStatus(brPubsData, app);

      const statusSchedule = scheduleStatus(app);
      statusSchedule.start();
    } catch (error) {
      sendErrorLog({ error });
    }
  });
}
