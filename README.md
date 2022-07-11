<div align="center">
  <img src="https://cdn.discordapp.com/attachments/248430185463021569/955497690735738900/Nessie_Logo_v2.png" width=120px/>
</div>

# nessie | v1.9.0 <br>Apex Legends Discord Bot | Map Status

Simple discord bot that provides an easy way to get status updates of map rotations in the game Apex Legends. Data extracted from https://apexlegendsapi.com/

<img width="900" alt="image" src="https://user-images.githubusercontent.com/42207245/163541135-2cd5f86e-8a63-4982-9557-7eceb6164f7c.png">


## Command list

Instead of prefixes, Nessie uses Discord's new [Slash Commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ) `/`
- `br`: map rotation for battle royale
- `arenas`: map rotation for arenas
- `control`: map rotation for control
- `status`: information on how to get automatic map updates
- `about`: information hub of Nessie
- `help`: list of commands and how to use them
- `invite`: generates Nessie's invite link
- `updates`: shows the latest news and current update of Nessie

Currently there's an announcement command that does automatic map status while publishing those updates in an announcement channel. This is done temporarily as it's impossible to directly show this in individual server messages on a large scale due to [rate limits](https://shizuka.notion.site/Adventures-in-Discord-s-Rate-Limits-4ef7fa20481f4e3b8a388d9cdb1021e7). Made this solution so that people can use it for now while I work on an alternative approach with webhooks; something I have limited experience with hence longer development

## TODO
- Automatic Map Status Updates
- Add installation guide to this readme
- Restructure non-command files
- Make command files object-oriented
- Migrate to Typescript
- Make error handling a reusable component

## Tech Stack

- [Discord.js](https://discord.js.org/#/) - Node.js module to interact easier with Discord's API
- [PostgreSQL](https://www.postgresql.org/) | [DigitalOcean](https://www.digitalocean.com/products/managed-databases)  - Managed database to store server data
- [Mixpanel](https://mixpanel.com/) - user analytics tracker
