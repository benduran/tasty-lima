import type { WebSocketLike } from '@hono/node-server';
import type { WSContext, WSMessageReceive } from 'hono/ws';
import { errorToString } from '../../shared/error-to-string.ts';
import type { LogLine, WebSocketMessage } from '../../shared/types.ts';
import {
  RequestIdSchema,
  responseNameOf,
  WebSocketMessageCodec,
} from '../../shared/types.ts';
import {
  createInstance,
  listInstances,
  listTemplates,
} from '../limactl/index.ts';
import {
  bootInstance,
  deleteInstance,
  shutdownInstance,
} from '../limactl/limaExec.ts';
import { getMachineInfo } from '../machine/get-info.ts';

function requestIdOf(text: string) {
  try {
    return RequestIdSchema.safeParse(JSON.parse(text)?.requestId).data;
  } catch {
    return undefined;
  }
}

export function enrichWebsocket(ws: WSContext<WebSocketLike>) {
  function send(msg: WebSocketMessage) {
    ws.send(WebSocketMessageCodec.encode(msg));
  }

  function streamLogsFor(name: string, requestId: string) {
    return (lines: LogLine[]) =>
      send({
        data: { lines, name },
        requestId,
        sender: 'server',
        type: 'stream-instance-logs',
      });
  }

  function decode(text: string) {
    try {
      return WebSocketMessageCodec.decode(text);
    } catch (error) {
      const requestId = requestIdOf(text);
      if (requestId) {
        send({
          message: `the server could not read this request: ${errorToString(error)}`,
          requestId,
          sender: 'server',
          type: 'response-error',
        });
      }
      throw error;
    }
  }

  async function receive(body: WSMessageReceive) {
    const parsed = decode(body.toString());
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
            data: await createInstance(
              parsed.data,
              streamLogsFor(parsed.data.name, requestId),
            ),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-boot-instance':
          return send({
            data: await bootInstance(
              parsed.data.name,
              streamLogsFor(parsed.data.name, requestId),
            ),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-shutdown-instance':
          return send({
            data: {
              name: await shutdownInstance(
                parsed.data.name,
                streamLogsFor(parsed.data.name, requestId),
              ),
            },
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });

        case 'request-delete-instance':
          return send({
            data: { name: await deleteInstance(parsed.data.name) },
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
