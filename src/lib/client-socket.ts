import { apiRoutes } from '../shared/routes.ts';
import type { WebSocketMessage } from '../shared/types.ts';
import { WebSocketMessageCodec } from '../shared/types.ts';

function fullWebsocketUrl() {
  const { host, protocol } = window.location;
  const wsProtocol = `ws${protocol.endsWith('s') ? 's' : ''}://`;

  return `${wsProtocol}${host}${apiRoutes.websocket()}`;
}

type HandlerEntry = {
  handler: (data: WebSocketMessage) => void;
  type: WebSocketMessage['type'];
};

type PendingRequest = {
  reject: (reason: unknown) => void;
  resolve: (data: WebSocketMessage) => void;
};

export class ClientSocket {
  private ws: WebSocket;
  private handlers: HandlerEntry[] = [];
  private onceHandlers: HandlerEntry[] = [];
  private pendingRequests = new Map<string, PendingRequest>();

  constructor() {
    this.ws = new WebSocket(fullWebsocketUrl());
    this.bind();
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

  send(msg: WebSocketMessage) {
    const sendNow = () => this.ws.send(WebSocketMessageCodec.encode(msg));
    // a request racing the handshake would otherwise throw InvalidStateError
    if (this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.addEventListener('open', sendNow, { once: true });
      return;
    }
    sendNow();
  }

  on<E extends WebSocketMessage['type']>(
    type: E,
    handler: (data: Extract<WebSocketMessage, E>) => void,
  ) {
    // @ts-expect-error - whatever, typescript
    this.handlers.push({ handler, type });
  }

  once<E extends WebSocketMessage['type']>(
    type: E,
    handler: (data: Extract<WebSocketMessage, E>) => void,
  ) {
    // @ts-expect-error - whatever, typescript
    this.onceHandlers.push({ handler, type });
  }

  private bind() {
    this.ws.addEventListener('message', this.receive);
    this.on('pulse', ({ requestId }) => {
      this.send({ requestId, sender: 'client', type: 'heartbeat' });
    });
    this.ws.addEventListener('close', () => {
      this.rejectPending(
        'websocket connection closed before a response arrived',
      );
    });
    this.ws.addEventListener('error', () => {
      this.rejectPending(
        'websocket connection errored before a response arrived',
      );
    });
  }

  /** rejects every in-flight request, since its response can no longer arrive */
  private rejectPending(reason: string) {
    for (const pending of this.pendingRequests.values()) {
      pending.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }

  private receive = (evt: MessageEvent) => {
    let data: WebSocketMessage;
    try {
      data = WebSocketMessageCodec.decode(
        typeof evt.data === 'string' ? evt.data : String(evt.data),
      );
    } catch (unknown) {
      // there is no requestId to reject against in a malformed message, and
      // the browser has no logger, so console is the only channel here
      // biome-ignore lint/suspicious/noConsole: no client-side logger exists
      return console.warn('dropping a malformed websocket message', unknown);
    }

    const pending = this.pendingRequests.get(data.requestId);
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

let socket: ClientSocket | undefined;

/** one connection, shared by every fetch in the app */
export function getSocket(): ClientSocket {
  socket ??= new ClientSocket();
  return socket;
}
