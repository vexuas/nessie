<div align="center">
  <img src="https://cdn.discordapp.com/attachments/889134541615292459/896698383593517066/sir_nessie.png" width=120px/>
</div>

# nessie | v1.2.0 <br>Apex Legends Discord Bot | Map Status

Simple discord bot that provides an easy way to get status updates of map rotations in the game Apex Legends. Data extracted from https://apexlegendsapi.com/

![image](https://user-images.githubusercontent.com/42207245/153250580-5a34d8a2-6e5a-4fb2-b14a-7db7a6238aa7.png)

## Command list

Instead of prefixes, Nessie uses Discord's new [Slash Commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ) `/`
- `br`: map rotation for battle royale
- `arenas`: map rotation for arenas
- `about`: information hub of Nessie
- `help`: list of commands and how to use them
- `invite`: generates Nessie's invite link

## TODO
- Automatic Map Status Updates
- Add installation guide to this readme

## Tech Stack

- [Discord.js](https://discord.js.org/#/) - Node.js module to interact easier with Discord's API
- [PostgreSQL](https://www.postgresql.org/) | [DigitalOcean](https://www.digitalocean.com/products/managed-databases)  - Managed database to store server data
- [Mixpanel](https://mixpanel.com/) - user analytics tracker
