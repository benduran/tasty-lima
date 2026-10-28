import { apiRoutes } from '@/shared/routes';
import { listInstances } from '../limactl';
import { createApiRouteHandler } from './util';

export const GET_instances = createApiRouteHandler(
  apiRoutes.instances(),
  'get',
  async ctx => {
    return ctx.json(await listInstances());
  },
);
