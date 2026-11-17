import type { WebSocketServerLike } from '@hono/node-server';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import open from 'open';
import { WebSocketServer } from 'ws';
import { logger } from './logger.ts';
import { bindAll } from './routes/index.ts';
import type { CLIArgs } from './schema.ts';

export async function startServer({ hostname, noUI, noOpen, port }: CLIArgs) {
  const server = new Hono();

  await bindAll(server, { noUI });

  const wss = new WebSocketServer({ noServer: true });

  serve(
    {
      ...server,
      hostname,
      port,
      websocket: { server: wss as unknown as WebSocketServerLike },
    },
    info => {
      logger.info(`listening on ${info.address}:${info.port}`);
      if (!noOpen) {
        const u = new URL(`${hostname}:${port}`);
        const url = u.toString();
        open(url).catch(err =>
          logger.error(
            `failed to open ${url}: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
      }
    },
  );

  return server;
}
