// src/payments/types/payment-method.object.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PaymentType } from '../../common/enums/graphql-enums';

@ObjectType()
export class PaymentMethodObject {
  @Field(() => ID)
  id!: string;

  @Field(() => PaymentType)
  type!: PaymentType;

  @Field(() => String)
  label!: string;

  @Field(() => String, { nullable: true })
  last4?: string | null;

  @Field(() => Boolean)
  isDefault!: boolean;

  @Field(() => String)
  userId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
