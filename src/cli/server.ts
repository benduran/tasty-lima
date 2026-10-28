import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from './logger.ts';
import { bindAll } from './routes/index.ts';
import type { CLIArgs } from './schema.ts';

// TODO: need to actually do something with the no UI flag, eventually
export function startServer({ hostname, noUI: _, port }: CLIArgs) {
  const server = new Hono();

  bindAll(server);

  serve(
    {
      ...server,
      hostname,
      port,
    },
    info => logger.info(`listening on ${info.address}:${info.port}`),
  );

  return server;
}
