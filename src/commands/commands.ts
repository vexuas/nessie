import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Client } from 'discord.js';
import fs from 'fs';
import path from 'path';

export type AppCommand = {
  data: SlashCommandBuilder;
  commandType?: string;
  execute: (data: AppCommandOptions) => Promise<void>;
};
export type AppCommandOptions = {
  interaction: ChatInputCommandInteraction;
  app: Client;
  appCommands?: AppCommand[];
};
type ExportedAppCommand = {
  default: AppCommand;
};
export function getApplicationCommands(): AppCommand[] {
  const appCommands: AppCommand[] = [];

  const loadModules = (directoryPath: string) => {
    const files = fs.readdirSync(directoryPath, { withFileTypes: true });
    files.forEach((file) => {
      const filePath = path.join(directoryPath, file.name);
      const nestingOccurence = filePath.match(new RegExp(/\//g) || [])?.length;
      if (nestingOccurence && nestingOccurence >= 4) return;
      if (file.isDirectory()) {
        return loadModules(filePath);
      }
      if (file.name === 'index.js') {
        const modulePath = `./${filePath.replace('dist/commands/', '')}`;
        const currentModule = require(modulePath) as ExportedAppCommand;
        appCommands.push(currentModule.default);
      }
    });
  };
  loadModules('./dist/commands');
  return appCommands;
}
