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

Cool links regarding the status command:
- [Design Prototypes](https://www.figma.com/file/Zw83AgLQpObLpPlSoeEWjq/Automatic-Status-Prototype?node-id=144%3A4675)
- [Adventures in Discord's Rate Limits](https://shizuka.notion.site/Adventures-in-Discord-s-Rate-Limits-4ef7fa20481f4e3b8a388d9cdb1021e7)
- [Spike on Time Taken for Status Cycles](https://shizuka.notion.site/Spike-on-Status-Time-Taken-0c26284152f04a169c546fe7b582a658)
- [Edge Cases](https://shizuka.notion.site/Status-Command-Edge-Cases-c89b37cff26b4626a2c14adb86f88f3c)

## TODO
Full list [here](https://shizuka.notion.site/To-dos-and-Nice-to-Have-s-4946e00c731d44839ad76bb1c72c0328). Kinda exhausted myself working on Nessie so most of these would probably only get picked up after October 2022; gonna be working on other projects in the meantime
- Add installation guide to this readme
- Create alternative branch to make Nessie easily self hosted
- Create contribution guide
- Restructure non-command files
- Make command files object-oriented
- Migrate to Typescript
- Make error handling a reusable component
- Use webhooks instead of manually sending logs through messages
- Research multithreading
- CircleCi Integration
- Metabase Integration
- Datadog Integration

## Tech Stack

- [Discord.js](https://discord.js.org/#/) - Node.js module to interact easier with Discord's API
- [PostgreSQL](https://www.postgresql.org/) | [DigitalOcean](https://www.digitalocean.com/products/managed-databases)  - Managed database to store server data
- [Mixpanel](https://mixpanel.com/) - user analytics tracker
