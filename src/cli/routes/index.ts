import type { Hono } from 'hono';
import { GET_instances } from './GET_instances.ts';
import { GET_machineInfo } from './GET_machineInfo.ts';

export function bindAll(server: Hono) {
  const handlers = [GET_instances, GET_machineInfo];

  for (const bind of handlers) {
    bind(server);
  }
}
