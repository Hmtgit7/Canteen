import type { Role } from '../enums/role.enum';
import type { Country } from '../enums/country.enum';

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: Role;
  country: Country;
}
