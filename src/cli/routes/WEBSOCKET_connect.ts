import { upgradeWebSocket } from '@hono/node-server';
import type { Hono } from 'hono';
import { errorToString } from '../../shared/error-to-string.ts';
import { apiRoutes } from '../../shared/routes.ts';
import { logger } from '../logger.ts';
import { addClient, removeClient } from './websocket-clients.ts';
import { enrichWebsocket } from './websocketWrapper.ts';

export function WEBSOCKET_connect(server: Hono) {
  server.get(
    apiRoutes.websocket(),
    upgradeWebSocket(() => ({
      onClose: (_, ws) => {
        removeClient(ws);
        logger.info('websocket disconnected');
      },
      onMessage(evt, ws) {
        const ews = enrichWebsocket(ws);
        ews.receive(evt.data).catch(error => {
          logger.warn('failed handling a websocket message', {
            error: errorToString(error),
          });
        });
      },
      onOpen: (_, ws) => {
        addClient(ws);
        logger.info('websocket connected');
      },
    })),
  );
}
