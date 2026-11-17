import { createHash, timingSafeEqual } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import { StatusCodes } from 'http-status-codes';
import { API_TOKEN_HEADER } from '../../shared/constants.ts';
import type { Nullish } from '../../shared/types.ts';
import { isNullOrUndefined } from '../../shared/util.ts';
import { logger } from '../logger.ts';

export type ApiAuthOpts = {
  allowedOrigins: string[];
  expectedHost: Nullish<string>;
  token: string;
};

function sha256(value: string) {
  return createHash('sha256').update(value).digest();
}

function tokensMatch(presented: Nullish<string>, expected: string) {
  if (!presented) return false;
  return timingSafeEqual(sha256(presented), sha256(expected));
}

function offeredWebsocketProtocols(header: Nullish<string>) {
  if (!header) return [];
  return header.split(',').map(protocol => protocol.trim());
}

export function apiAuth({
  allowedOrigins,
  expectedHost,
  token,
}: ApiAuthOpts): MiddlewareHandler {
  return async (ctx, next) => {
    const reject = (
      status: StatusCodes.FORBIDDEN | StatusCodes.UNAUTHORIZED,
      reason: string,
    ) => {
      logger.warn('rejected an api request', {
        method: ctx.req.method,
        path: ctx.req.path,
        reason,
      });
      return ctx.text(reason, status);
    };

    if (
      !isNullOrUndefined(expectedHost) &&
      ctx.req.header('host') !== expectedHost
    ) {
      return reject(StatusCodes.FORBIDDEN, 'unexpected Host header');
    }

    const origin = ctx.req.header('origin');
    if (!isNullOrUndefined(origin) && !allowedOrigins.includes(origin)) {
      return reject(StatusCodes.FORBIDDEN, 'unexpected Origin header');
    }

    const providedTokens = [
      ctx.req.header(API_TOKEN_HEADER),
      ...offeredWebsocketProtocols(ctx.req.header('sec-websocket-protocol')),
    ];
    if (providedTokens.every(provided => !tokensMatch(provided, token))) {
      return reject(StatusCodes.UNAUTHORIZED, 'missing or invalid token');
    }

    return await next();
  };
}
