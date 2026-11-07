import { StatusCodes } from 'http-status-codes';
import { errorToString } from '../../shared/error-to-string.ts';
import { apiRoutes } from '../../shared/routes.ts';
import { CreateLimaVMSchema } from '../../shared/types.ts';
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
  },
);
