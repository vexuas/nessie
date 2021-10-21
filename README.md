# Nessie

Apex Legends Discord bot

Haven't coded on any personal projects in over a month and since I've been kinda obsessed with apex
lately, had an idea to create a discord bot for it. For now current idea is to have map rotations on
automatic reminders, mainly since I'm lazy to go in and check and then be depressed that it's king's
canyon kek. Will see what other possible implementations after that's done

## current version | v0.2.1

No automatic notifications yet but nessie is now functional with commands! Nessie also displays the
current battle royale pubs map in his activity status

Prefix: `$nes-`

Command list:

- `br`: map rotation for battle royale pubs
- `br ranked`: map rotation for battle royale ranked
- `arenas`: map rotation for arenas pubs
- `arenas ranked`: map rotation for arenas ranked
- `info`: information hub of Nessie
- `help`: list of commands and how to use them
- `prefix`: shows current prefix
- `invite`: generates Nessie's invite link

## Tech Stack

- [Discord.js](https://discord.js.org/#/) - Node.js module to interact with Discord's API
- [Sqlite3](https://www.sqlite.org/index.html) - lightweight database to store server and user data
- [Mixpanel](https://mixpanel.com/) - user analytics tracker
