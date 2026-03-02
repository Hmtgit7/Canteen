import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { JwtUserPayload } from '../types/jwt-payload.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtUserPayload => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: { user: JwtUserPayload } }>().req.user;
  },
);
