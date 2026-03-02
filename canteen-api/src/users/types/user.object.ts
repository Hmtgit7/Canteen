// src/users/types/user.object.ts
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Role } from '../../common/enums/role.enum';
import { Country } from '../../common/enums/country.enum';

registerEnumType(Role, { name: 'Role', description: 'User roles' });
registerEnumType(Country, {
  name: 'Country',
  description: 'Supported countries',
});

@ObjectType()
export class UserObject {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field(() => Role)
  role!: Role;

  @Field(() => Country)
  country!: Country;

  @Field({ nullable: true })
  avatar?: string | null;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
