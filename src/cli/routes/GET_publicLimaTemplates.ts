import { apiRoutes } from '../../shared/routes.ts';
import { listTemplates } from '../limactl/index.ts';
import { createApiRouteHandler } from './util.ts';

export const GET_publicLimaTemplates = createApiRouteHandler(
  apiRoutes.publicLimaTemplates(),
  'get',
  async ctx => ctx.json(await listTemplates()),
);
