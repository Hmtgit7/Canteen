// src/orders/types/order.object.ts
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { OrderStatus } from '../../common/enums/graphql-enums';
import { OrderItemObject } from './order-item.object';
import { UserObject } from '../../users/types/user.object';
import { RestaurantObject } from '../../restaurants/types/restaurant.object';
import { PaymentMethodObject } from '../../payments/types/payment-method.object';

@ObjectType()
export class OrderObject {
  @Field(() => ID)
  id!: string;

  @Field(() => OrderStatus)
  status!: OrderStatus;

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => String)
  userId!: string;

  @Field(() => String)
  restaurantId!: string;

  @Field(() => String, { nullable: true })
  paymentId?: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [OrderItemObject], { nullable: true })
  items?: OrderItemObject[];

  @Field(() => UserObject, { nullable: true })
  user?: UserObject;

  @Field(() => RestaurantObject, { nullable: true })
  restaurant?: RestaurantObject;

  @Field(() => PaymentMethodObject, { nullable: true })
  payment?: PaymentMethodObject | null;
}
