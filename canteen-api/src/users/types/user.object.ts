import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Role } from '../../common/enums/role.enum';
import { Country } from '../../common/enums/country.enum';
import '../../common/enums/graphql-enums';

@ObjectType()
export class UserObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Role)
  role!: Role;

  @Field(() => Country)
  country!: Country;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field(() => Boolean)
  isActive!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
