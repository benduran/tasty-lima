import Sockette from 'sockette';
import { v4 as uuid } from 'uuid';
import { API_WEBSOCKET_PROTOCOL } from '../shared/constants.ts';
import { errorToString } from '../shared/error-to-string.ts';
import { apiRoutes } from '../shared/routes.ts';
import type { Nullish, WebSocketMessage } from '../shared/types.ts';
import {
  UnreadableResponseSchema,
  WebSocketMessageCodec,
} from '../shared/types.ts';
import { safeJsonParse } from '../shared/util.ts';
import { apiToken } from './api-token.ts';

function fullWebsocketUrl() {
  const { host, protocol } = window.location;
  const wsProtocol = `ws${protocol.endsWith('s') ? 's' : ''}://`;

  return `${wsProtocol}${host}${apiRoutes.websocket()}`;
}

function websocketProtocols() {
  const protocols: string[] = [API_WEBSOCKET_PROTOCOL];
  if (apiToken) protocols.push(apiToken);
  return protocols;
}

const NON_RECONNECTING_CLOSE_CODES = new Set([1000, 1001, 1005]);

type HandlerEntry = {
  handler: (data: WebSocketMessage) => void;
  type: WebSocketMessage['type'];
};

type PendingRequest = {
  reject: (reason: unknown) => void;
  resolve: (data: WebSocketMessage) => void;
};

export class ClientSocket {
  private ws: Sockette;
  private handlers: HandlerEntry[] = [];
  private onceHandlers: HandlerEntry[] = [];
  private pendingRequests = new Map<string, PendingRequest>();
  private heartbeatInterval: Nullish<NodeJS.Timeout> = null;
  private state: 'closed' | 'connecting' | 'connected' = 'closed';
  private sendAfterOpenedQueue: WebSocketMessage[] = [];
  private hasOpened = false;
  private reconnectListeners = new Set<() => void>();

  constructor() {
    this.ws = new Sockette(fullWebsocketUrl(), {
      onclose: this.closed,
      onerror: this.errored,
      onmessage: this.receive,
      onopen: this.opened,
      protocols: websocketProtocols(),
    });
  }

  /**
   * fetch-like behaviour, which resolves with whatever message the server answers
   * the sent message with under the same requestId
   */
  request(msg: WebSocketMessage): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(msg.requestId, { reject, resolve });
      this.send(msg);
    });
  }

  private sendNow(msg: WebSocketMessage) {
    this.ws.send(WebSocketMessageCodec.encode(msg));
  }

  send(msg: WebSocketMessage) {
    if (this.state !== 'connected') {
      return this.sendAfterOpenedQueue.push(msg);
    }
    return this.sendNow(msg);
  }

  on<E extends WebSocketMessage['type']>(
    type: E,
    handler: (data: Extract<WebSocketMessage, { type: E }>) => void,
  ) {
    // @ts-expect-error - whatever, typescript
    this.handlers.push({ handler, type });
  }
  off<E extends WebSocketMessage['type']>(
    type: E,
    handler: (data: Extract<WebSocketMessage, { type: E }>) => void,
  ) {
    this.handlers = this.handlers.filter(
      h => h.type !== type || h.handler !== handler,
    );
  }

  once<E extends WebSocketMessage['type']>(
    type: E,
    handler: (data: Extract<WebSocketMessage, { type: E }>) => void,
  ) {
    // @ts-expect-error - whatever, typescript
    this.onceHandlers.push({ handler, type });
  }

  onReconnect(listener: () => void) {
    this.reconnectListeners.add(listener);
    return () => {
      this.reconnectListeners.delete(listener);
    };
  }

  killHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = null;
  }

  startHeartbeat() {
    this.killHeartbeat();
    const sendPulse = () =>
      this.send({
        requestId: uuid(),
        sender: 'client',
        type: 'request-heartbeat',
      });
    sendPulse();

    this.heartbeatInterval = setInterval(sendPulse, 5000);
  }

  /** rejects every in-flight request, since its response can no longer arrive */
  private rejectPending(reason: string) {
    for (const pending of this.pendingRequests.values()) {
      pending.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }

  private closed = (evt: CloseEvent) => {
    this.state = 'closed';
    this.killHeartbeat();
    this.rejectPending('WebSocket connection was closed');
    if (NON_RECONNECTING_CLOSE_CODES.has(evt.code)) {
      this.ws.reconnect();
    }
  };

  private errored = () => {
    this.rejectPending('WebSocket encountered an error');
  };

  private opened = () => {
    this.state = 'connected';
    for (const enqueued of this.sendAfterOpenedQueue) {
      this.sendNow(enqueued);
    }
    this.sendAfterOpenedQueue = [];
    this.startHeartbeat();
    if (this.hasOpened) {
      for (const listener of this.reconnectListeners) listener();
    }
    this.hasOpened = true;
  };

  private receive = (evt: MessageEvent) => {
    const text = typeof evt.data === 'string' ? evt.data : String(evt.data);
    let data: WebSocketMessage;
    try {
      data = WebSocketMessageCodec.decode(text);
    } catch (error) {
      const unreadable = UnreadableResponseSchema.safeParse(
        safeJsonParse(text),
      ).data;
      const pending =
        unreadable && this.pendingRequests.get(unreadable.requestId);
      if (unreadable && pending) {
        this.pendingRequests.delete(unreadable.requestId);
        pending.reject(
          new Error(
            `the server sent a ${unreadable.type} this client could not read: ${errorToString(error)}`,
          ),
        );
        return;
      }
      // biome-ignore lint/suspicious/noConsole: no client-side logger exists
      return console.warn('dropping a malformed websocket message', error);
    }

    const pending = data.type.startsWith('response-')
      ? this.pendingRequests.get(data.requestId)
      : undefined;
    if (pending) {
      this.pendingRequests.delete(data.requestId);
      pending.resolve(data);
      return;
    }

    for (const onceHandler of this.onceHandlers) {
      if (onceHandler.type === data.type) {
        onceHandler.handler(data);
        this.onceHandlers = this.onceHandlers.filter(
          ({ handler }) => handler !== onceHandler.handler,
        );
      }
    }

    for (const handler of this.handlers) {
      if (handler.type === data.type) {
        handler.handler(data);
      }
    }
  };
}
