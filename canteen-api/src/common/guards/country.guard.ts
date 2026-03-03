import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Country } from '../enums/country.enum';
import type { JwtUserPayload } from '../types/jwt-payload.type';

export const COUNTRY_KEY = 'country';

export const AllowedCountries = (...countries: Country[]) =>
  ({ [COUNTRY_KEY]: countries }) as Record<string, Country[]>;

@Injectable()
export class CountryGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedCountries = this.reflector.getAllAndOverride<
      Country[] | undefined
    >(COUNTRY_KEY, [context.getHandler(), context.getClass()]);

    if (!allowedCountries || allowedCountries.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext<{ req: { user: JwtUserPayload } }>().req.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!allowedCountries.includes(user.country)) {
      throw new ForbiddenException(
        `Access restricted to users in: ${allowedCountries.join(', ')}`,
      );
    }

    return true;
  }
}
