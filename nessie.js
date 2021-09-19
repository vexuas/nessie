const Discord = require('discord.js');
const nessie = new Discord.Client();
const { defaultPrefix, token } = require('./config/nessie.json');

nessie.login(token);
