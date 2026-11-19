import type { WebSocketLike } from '@hono/node-server';
import type { WSContext, WSMessageReceive } from 'hono/ws';
import { errorToString } from '../../shared/error-to-string.ts';
import type { WebSocketMessage } from '../../shared/types.ts';
import {
  RequestIdSchema,
  responseNameOf,
  WebSocketMessageCodec,
} from '../../shared/types.ts';
import {
  listInstanceOperations,
  runInstanceOperation,
} from '../instance-operations.ts';
import {
  createInstance,
  ensureLimaCtl,
  getLimaBinaryPath,
  listInstances,
  listNetworks,
  listTemplates,
} from '../limactl/index.ts';
import {
  bootInstance,
  deleteInstance,
  editInstance,
  getInstanceByName,
  readInstanceYaml,
  shutdownInstance,
} from '../limactl/limaExec.ts';
import { readInstanceConfig } from '../limactl/limaYaml.ts';
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
            data: await runInstanceOperation({
              exec: onLines => createInstance(parsed.data, onLines),
              name: parsed.data.name,
              request: parsed.type,
              requestId,
            }),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-boot-instance':
          return send({
            data: await runInstanceOperation({
              exec: onLines => bootInstance(parsed.data.name, onLines),
              name: parsed.data.name,
              request: parsed.type,
              requestId,
            }),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-shutdown-instance':
          return send({
            data: {
              name: await runInstanceOperation({
                exec: onLines => shutdownInstance(parsed.data.name, onLines),
                name: parsed.data.name,
                request: parsed.type,
                requestId,
              }),
            },
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-lima-bin':
          return send({
            data: { binPath: getLimaBinaryPath() },
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-query-instance': {
          const instance = await getInstanceByName(parsed.data.name);
          return send({
            data: {
              config: instance ? await readInstanceConfig(instance.dir) : null,
              instance,
            },
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        }
        case 'request-edit-instance':
          return send({
            data: await runInstanceOperation({
              exec: onLines => editInstance(parsed.data, onLines),
              name: parsed.data.name,
              request: parsed.type,
              requestId,
            }),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-query-instance-operations':
          return send({
            data: listInstanceOperations(),
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });
        case 'request-instance-connect-command':
          return send({
            data: {
              // ensureLimaCtl normally ran at startup; recover if it did not
              command: `"${getLimaBinaryPath() || (await ensureLimaCtl())}" shell "${parsed.data.name}"`,
            },
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });

        case 'request-instance-yaml':
          return send({
            data: { yaml: await readInstanceYaml(parsed.data.name) },
            requestId,
            sender: 'server',
            type: responseNameOf(parsed),
          });

        case 'request-delete-instance':
          return send({
            data: await runInstanceOperation({
              exec: async onLines => ({
                name: await deleteInstance(parsed.data.name, onLines),
              }),
              name: parsed.data.name,
              request: parsed.type,
              requestId,
            }),
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
        case 'request-query-networks':
          return send({
            data: await listNetworks(),
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
