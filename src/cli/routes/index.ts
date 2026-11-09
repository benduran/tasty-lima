import type { Hono } from 'hono';
import { GET_instances } from './GET_instances.ts';
import { GET_machineInfo } from './GET_machineInfo.ts';
import { GET_publicLimaTemplates } from './GET_publicLimaTemplates.ts';
import { POST_createInstance } from './POST_createInstance.ts';
import { WEBSOCKET_connect } from './WEBSOCKET_connect.ts';

export function bindAll(server: Hono) {
  const handlers = [
    GET_instances,
    GET_machineInfo,
    GET_publicLimaTemplates,
    POST_createInstance,
    WEBSOCKET_connect,
  ];

  for (const bind of handlers) {
    bind(server);
  }
}
