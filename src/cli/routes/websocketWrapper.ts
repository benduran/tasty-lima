import type { WebSocketLike } from '@hono/node-server';
import type { WSContext, WSMessageReceive } from 'hono/ws';
import { errorToString } from '../../shared/error-to-string.ts';
import type { WebSocketMessage } from '../../shared/types.ts';
import { responseNameOf, WebSocketMessageCodec } from '../../shared/types.ts';
import {
  createInstance,
  listInstances,
  listTemplates,
} from '../limactl/index.ts';
import { getMachineInfo } from '../machine/get-info.ts';

export function enrichWebsocket(ws: WSContext<WebSocketLike>) {
  function send(msg: WebSocketMessage) {
    ws.send(WebSocketMessageCodec.encode(msg));
  }

  async function receive(body: WSMessageReceive) {
    const parsed = WebSocketMessageCodec.decode(body.toString());
    if (parsed.sender === 'server') return;
    const { requestId } = parsed;
    try {
      switch (parsed.type) {
        case 'request-heartbeat':
          return send({
            requestId,
            sender: 'server',
            type: 'response-heartbeat',
          });
        case 'request-create-instance':
          return send({
            data: await createInstance(parsed.createLimaVM),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-query-instances':
          return send({
            data: await listInstances(),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-query-machine-info':
          return send({
            data: await getMachineInfo(),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-query-public-templates':
          return send({
            data: await listTemplates(),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
      }
    } catch (error) {
      return send({
        message: errorToString(error),
        requestId,
        sender: 'server',
        type: 'response-error',
      });
    }
  }
  return { ...ws, receive, send };
}
