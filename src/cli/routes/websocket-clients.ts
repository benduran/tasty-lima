import type { WebSocketLike } from '@hono/node-server';
import type { WSContext } from 'hono/ws';
import { errorToString } from '../../shared/error-to-string.ts';
import type { WebSocketMessage } from '../../shared/types.ts';
import { WebSocketMessageCodec } from '../../shared/types.ts';
import { logger } from '../logger.ts';

const clients = new Set<WSContext<WebSocketLike>>();

export function addClient(ws: WSContext<WebSocketLike>) {
  clients.add(ws);
}

export function removeClient(ws: WSContext<WebSocketLike>) {
  clients.delete(ws);
}

export function broadcast(msg: WebSocketMessage) {
  const encoded = WebSocketMessageCodec.encode(msg);
  for (const client of clients) {
    try {
      client.send(encoded);
    } catch (error) {
      logger.warn('failed broadcasting to a websocket client', {
        error: errorToString(error),
      });
    }
  }
}
