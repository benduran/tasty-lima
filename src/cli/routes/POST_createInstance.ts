import { StatusCodes } from 'http-status-codes';
import { errorToString } from '../../shared/error-to-string.ts';
import { apiRoutes } from '../../shared/routes.ts';
import { CreateLimaVMSchema } from '../../shared/types.ts';
import { createInstance } from '../limactl/index.ts';
import { createApiRouteHandler } from './util.ts';

export const POST_createInstance = createApiRouteHandler(
  apiRoutes.createInstance(),
  'post',
  async ctx => {
    const validated = CreateLimaVMSchema.safeParse(await ctx.req.json());
    if (!validated.success) {
      ctx.status(StatusCodes.BAD_REQUEST);
      return ctx.text(errorToString(validated.error));
    }

    try {
      return ctx.json(await createInstance(validated.data));
    } catch (error) {
      ctx.status(StatusCodes.INTERNAL_SERVER_ERROR);
      return ctx.text(errorToString(error));
    }
  },
);
