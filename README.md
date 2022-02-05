# nessie | Apex Legends Discord Bot | Map Rotation | v1.0.0

Simple discord bot that provides an easy way to get status updates of map rotations in the game Apex Legends. Data extracted from https://apexlegendsapi.com/

![image](https://user-images.githubusercontent.com/42207245/152630117-01733e31-ea27-4aae-bcb7-d886538a8b8e.png)

## Command list

Instead of prefixes, Nessie uses Discord's new [Slash Commands](https://support.discord.com/hc/en-us/articles/1500000368501-Slash-Commands-FAQ) `/`
- `br`: map rotation for battle royale pubs
- `arenas`: map rotation for arenas pubs
- `info`: information hub of Nessie
- `help`: list of commands and how to use them
- `invite`: generates Nessie's invite link

## TODO
- Automatic Map Status Updates
- Add installation guide to this readme

## Tech Stack

- [Discord.js](https://discord.js.org/#/) - Node.js module to interact easier with Discord's API
- [Sqlite3](https://www.sqlite.org/index.html) - lightweight database to store server and user data
- [Mixpanel](https://mixpanel.com/) - user analytics tracker
