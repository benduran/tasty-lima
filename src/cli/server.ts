import type { WebSocketServerLike } from '@hono/node-server';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { WebSocketServer } from 'ws';
import { logger } from './logger.ts';
import { bindAll } from './routes/index.ts';
import type { CLIArgs } from './schema.ts';

// TODO: need to actually do something with the no UI flag, eventually
export function startServer({ hostname, noUI: _, port }: CLIArgs) {
  const server = new Hono();

  bindAll(server);

  const wss = new WebSocketServer({ noServer: true });

  serve(
    {
      ...server,
      hostname,
      port,
      websocket: { server: wss as unknown as WebSocketServerLike },
    },
    info => logger.info(`listening on ${info.address}:${info.port}`),
  );

  return server;
}
