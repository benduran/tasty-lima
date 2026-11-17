import { randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import os from 'node:os';
import type { WebSocketServerLike } from '@hono/node-server';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import open from 'open';
import { WebSocketServer } from 'ws';
import {
  API_TOKEN_PARAM,
  API_WEBSOCKET_PROTOCOL,
} from '../shared/constants.ts';
import type { Nullish } from '../shared/types.ts';
import { isNullOrUndefined } from '../shared/util.ts';
import { logger } from './logger.ts';
import { bindAll } from './routes/index.ts';
import type { CLIArgs } from './schema.ts';

function isLoopbackHostname(hostname: string) {
  if (hostname === 'localhost' || hostname === '::1') return true;
  return isIP(hostname) === 4 && hostname.startsWith('127.');
}

export async function startServer({
  allowOrigin,
  hostname,
  noUI,
  noOpen,
  port,
}: CLIArgs) {
  const server = new Hono();
  const token = randomBytes(32).toString('base64url');
  const baseUrl = new URL(`http://${hostname}:${port}`);
  const allowedOrigins = [baseUrl.origin];
  let uiOrigin = baseUrl.origin;

  if (!isNullOrUndefined(allowOrigin)) {
    const extraOrigin = new URL(allowOrigin).origin;
    allowedOrigins.push(extraOrigin);
    if (noUI) uiOrigin = extraOrigin;
  }

  let expectedHost: Nullish<string> = baseUrl.host;

  if (!isLoopbackHostname(hostname)) {
    expectedHost = null;
    logger.warn(
      `!!! SECURITY WARNING !!! tasty-lima is listening on ${hostname}, which is not a loopback address. Anything that can reach ${baseUrl.host} over the network, including your VMs, can talk to this server. The Host header check is off, so the access token is the only protection, and it travels unencrypted. Use --hostname 127.0.0.1 unless you really mean this.`,
    );
  }

  await bindAll(server, {
    auth: { allowedOrigins, expectedHost, token },
    noUI,
  });

  const wss = new WebSocketServer({
    handleProtocols: offered =>
      offered.has(API_WEBSOCKET_PROTOCOL) ? API_WEBSOCKET_PROTOCOL : false,
    noServer: true,
  });

  serve(
    {
      ...server,
      hostname,
      port,
      websocket: { server: wss as unknown as WebSocketServerLike },
    },
    info => {
      logger.info(`listening on ${info.address}:${info.port}`);
      const u = new URL(uiOrigin);
      u.hash = `#${API_TOKEN_PARAM}=${token}`;
      const url = u.toString();
      process.stdout.write(
        `${os.EOL}open tasty-lima at (this link carries your access token, keep it private):${os.EOL}  ${url}${os.EOL}${os.EOL}`,
      );
      if (!noOpen) {
        void open(url).catch(err =>
          logger.error(
            `failed to open ${uiOrigin}: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
      }
    },
  );

  return server;
}
