import { v4 as uuid } from 'uuid';
import type { z } from 'zod';
import type { ClientSocket } from '../lib/client-socket.ts';
import type { WsRequestMessage, WsRequestMessageBody } from './types.ts';

export class WebSocketFetchError extends Error {
  constructor(message: string) {
    super(`websocket request failed: ${message}`);
  }
}

type WebsocketFetchOpts<S extends z.ZodType> = {
  body: WsRequestMessageBody;
  schema: S;
  socket: ClientSocket;
};

/**
 * fetch-like request over a websocket
 */
export async function websocketFetch<S extends z.ZodType>({
  body,
  schema,
  socket,
}: WebsocketFetchOpts<S>): Promise<z.output<S>> {
  const requestId = uuid();
  const response = await socket.request({
    ...body,
    requestId,
  } as WsRequestMessage);
  if (response.type === 'response-error') {
    throw new WebSocketFetchError(response.message);
  }
  if (!('data' in response)) {
    throw new WebSocketFetchError(
      `a ${response.type} message is missing its response payload`,
    );
  }
  return schema.parse(response.data);
}
