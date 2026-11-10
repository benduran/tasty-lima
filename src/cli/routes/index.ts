import type { Hono } from 'hono';
import { WEBSOCKET_connect } from './WEBSOCKET_connect.ts';

export function bindAll(server: Hono) {
  const handlers = [WEBSOCKET_connect];

  for (const bind of handlers) {
    bind(server);
  }
}
