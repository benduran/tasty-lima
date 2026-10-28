import { apiRoutes } from '@/shared/routes.ts';
import { listInstances } from '../limactl/index.ts';
import { createApiRouteHandler } from './util.ts';

export const GET_instances = createApiRouteHandler(
  apiRoutes.instances(),
  'get',
  async ctx => {
    return ctx.json(await listInstances());
  },
);
