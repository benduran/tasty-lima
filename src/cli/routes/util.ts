import type { Context, Hono } from 'hono';

export type ServerVariables = {
  // TODO: remove this, later
  pizza: 'fuxk yeah';
};

type RouteHandler = (
  ctx: Context<{ Variables: ServerVariables }>,
) => Promise<Response> | Response;

type HTTPMethod = keyof Pick<Hono, 'delete' | 'get' | 'put' | 'patch' | 'post'>;

export function createApiRouteHandler(
  route: string,
  method: HTTPMethod,
  handler: RouteHandler,
) {
  return (server: Hono) => server[method](route, handler);
}
