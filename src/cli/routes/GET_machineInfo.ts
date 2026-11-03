import { apiRoutes } from '../../shared/routes.ts';
import { getMachineInfo } from '../machine/get-info.ts';
import { createApiRouteHandler } from './util.ts';

export const GET_machineInfo = createApiRouteHandler(
  apiRoutes.machineInfo(),
  'get',
  async ctx => ctx.json(await getMachineInfo()),
);
