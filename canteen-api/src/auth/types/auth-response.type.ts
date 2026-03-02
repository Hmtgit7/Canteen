import { ObjectType, Field } from '@nestjs/graphql';
import { UserObject } from '../../users/types/user.object';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken!: string;

  @Field(() => UserObject)
  user!: UserObject;
}
