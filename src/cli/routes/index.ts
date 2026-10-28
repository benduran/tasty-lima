import type { Hono } from 'hono';
import { GET_instances } from './GET_instances';

export function bindAll(server: Hono) {
  const handlers = [GET_instances];

  for (const bind of handlers) {
    bind(server);
  }
}
