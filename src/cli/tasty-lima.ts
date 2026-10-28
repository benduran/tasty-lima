import createCLI from 'yargs';
import { SERVER_PORT_DEV } from '@/shared/constants.ts';
import { ensureLimaCtl } from './limactl/index.ts';
import { CLIArgsSchema } from './schema.ts';
import { startServer } from './server.ts';

async function setup() {
  const yargs = createCLI(process.argv.slice(2));

  const { _, ...rest } = await yargs
    .option('hostname', {
      default: '127.0.0.1',
      description:
        'the hostname on which the local tasty-lima helper will listen',
      type: 'string',
    })
    .option('noUI', {
      default: false,
      description:
        'if true, will NOT host the UI from the tasty-lima helper server. you probably will not need this (it is a utility for working on tasty-lima)',
      type: 'boolean',
    })
    .option('port', {
      alias: 'p',
      default: SERVER_PORT_DEV,
      description: 'the port on which the local tasty-lima helper will listen',
      type: 'number',
    })
    .help()
    .showHelpOnFail(false).argv;

  const args = CLIArgsSchema.parse(rest);

  await ensureLimaCtl();
  startServer(args);
}

void setup();
