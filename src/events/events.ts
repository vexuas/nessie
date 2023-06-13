import { Client } from 'discord.js';
import { Mixpanel } from 'mixpanel';
import { getApplicationCommands } from '../commands/commands';

const appCommands: any = getApplicationCommands(); //Get list of application commands
console.log(appCommands);
interface Props {
  nessie: Client;
  mixpanel: Mixpanel | null;
}
export type EventModule = {
  nessie: Client;
  appCommands?: any[];
  mixpanel?: Mixpanel | null;
};

export function registerEventHandlers({}: Props) {}
