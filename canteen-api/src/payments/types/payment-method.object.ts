import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PaymentType } from '../../common/enums/graphql-enums';

@ObjectType()
export class PaymentMethodObject {
  @Field(() => ID)
  id!: string;

  @Field(() => PaymentType)
  type!: PaymentType;

  @Field()
  label!: string;

  @Field({ nullable: true })
  last4?: string | null;

  @Field()
  isDefault!: boolean;

  @Field()
  userId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
