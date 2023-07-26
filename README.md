<div align="center">
  <img src="https://cdn.discordapp.com/attachments/248430185463021569/955497690735738900/Nessie_Logo_v2.png" width=120px/>
</div>

# nessie <br>Apex Legends Map Status Discord Bot

Simple discord bot that provides an easy way to get status updates of map rotations in the game Apex Legends. Data extracted from https://apexlegendsapi.com/

<img width="900" alt="image" src="https://user-images.githubusercontent.com/42207245/163541135-2cd5f86e-8a63-4982-9557-7eceb6164f7c.png">
<div>
  <img width="450" alt="image" src="https://github.com/vexuas/nessie/assets/42207245/5b366cba-2362-4a87-af08-1a2a2fea5b99">
  <img align="top" width="450" alt="image" src="https://github.com/vexuas/nessie/assets/42207245/c1018e89-1a66-4364-967a-b26a29e9355f">
</div>

## Prerequisites
If you want to use Nessie for your own projects, you would need the following before getting started:

- Have a Discord Application created from the [Discord Dev Portal](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
- Have the Discord Application [invited to a Discord Server](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links)
- [Node](https://heynode.com/tutorial/install-nodejs-locally-nvm/) with a version of at least v16.13.0
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)
- An API key generated from https://apexlegendsapi.com/

## Installation
1. Clone this repository and then change directly into it
    - `git clone [this repo]`
    - `cd [your new repo file]`
2. Install dependencies
    - `yarn install`
3. Add required environment variables
    - You would need the following core environment variables in order to start your Discord bot:
        - `BOT_TOKEN`
        - `BOT_ID`
        - `GUILD_ID`
        - `ALS_API_KEY`
    - Generate these configurations using:
        ```
        yarn config:init
        ```
    - Finally, fill in the required variables above with your data
        ```ts
        src/config/environment.ts
        //Bot Configuration; Required
        export const BOT_TOKEN = 'Your Discord Bot Token';
        export const BOT_ID = 'Your Discord Bot ID';
        export const GUILD_ID = 'The Discord Server ID you want the bot to register Slash Commands in';
        
        //API key to retrieve apex data
        export const ALS_API_KEY = 'Your API key from apexlegendsapi';
        ```
    - Note: You may have noticed at this point there are other environment variables generated as well. These are optional to use and is not necessary for the bot to run but they are defined to avoid typescript errors. More information on these [variables in this discord bot template here](https://github.com/vexuas/djs-typescript-template#advanced-features)
 4. Start your App
     - `yarn start`

## Command list

Nessie uses Discord's Slash Commands `/`:
- `br`: map rotation for battle royale
- `ltm`: map rotation for limited time events
- `status help`: information on how to set up automatic map updates 
- `status start`: display configuration steps to start automatic map updates
- `status stop`: display configuration steps to stop existing automatic map updates
- `about`: information hub of Nessie
- `help`: list of commands
- `invite`: generates Nessie's invite link

## Setting Up Automatic Map Status
Gonna add a detailed guide here someday but use `status help` for now! It's probably straightforward enough. Probably.

For self-hosted projects, you are required to set up a [PostgreSQL](https://www.postgresql.org/) database to make the automatic updates work. Without the database, it will create the relevant channels, webhooks and the initial status message but the functionality stops there. I should probably also set up some guides for that but here are a couple of links to get you started with it for now:
- Windows: https://www.postgresqltutorial.com/postgresql-getting-started/install-postgresql/
- Mac: https://postgresapp.com/
- Linux: https://www.postgresqltutorial.com/postgresql-getting-started/install-postgresql-linux/

After setting up the database, you would need to fill in the environment variable `DATABASE_CONFIG` with your database credentials. The typing for this is generally
```ts
type DatabaseConfig = {
  database: string;
  host: string;
  user: string;
  port: number;
  password: string;
  ssl: {
    rejectUnauthorized: boolean;
  };
};
```
A more detailed breakdown of this can be found through the [node-postgres package](https://node-postgres.com/)

With these done, give `status start` a whirl and the automatic updates *should* be working now

Some cool links regarding the status command:
- [Design Prototypes](https://www.figma.com/file/Zw83AgLQpObLpPlSoeEWjq/Automatic-Status-Prototype?node-id=144%3A4675)
- [Adventures in Discord's Rate Limits](https://shizuka.notion.site/Adventures-in-Discord-s-Rate-Limits-4ef7fa20481f4e3b8a388d9cdb1021e7)
- [Spike on Time Taken for Status Cycles](https://shizuka.notion.site/Spike-on-Status-Time-Taken-0c26284152f04a169c546fe7b582a658)
- [Edge Cases](https://shizuka.notion.site/Status-Command-Edge-Cases-c89b37cff26b4626a2c14adb86f88f3c)

## TODO
Full list [here](https://shizuka.notion.site/To-dos-and-Nice-to-Have-s-4946e00c731d44839ad76bb1c72c0328). Kinda exhausted myself working on Nessie so most of these would probably only get picked up after October 2022; gonna be working on other projects in the meantime
- ~~Add installation guide to this readme~~
- ~~Create alternative branch to make Nessie easily self hosted~~ [Not Doing]
- ~~Create contribution guide~~
- ~~Restructure non-command files~~
- Make command files object-oriented
- ~~Migrate to Typescript~~
- ~~Make error handling a reusable component~~
- ~~Use webhooks instead of manually sending logs through messages~~
- Research multithreading
- CircleCi Integration
- ~~Metabase Integration~~ [Using Trevor instead]
- Datadog Integration

## Contributing
Any contributions are greatly appreciated! If you have any suggestions that would make Nessie better, you can either create a pull request or simply open an issue!
1. Create a new branch
    - `git checkout -b your-new-branch`
2. Commit your changes
    - `git commit -a -m 'Description of the changes'`
3. Push your branch
    - `git push origin your-new-branch`
4. Open a pull request

## License
Distributed under the [MIT License](https://github.com/vexuas/djs-typescript-template/blob/feature/add-detailed-readme/LICENSE)
