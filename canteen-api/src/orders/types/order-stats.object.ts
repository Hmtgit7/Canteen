// src/orders/types/order-stats.object.ts
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class OrderStatusCount {
  @Field(() => String)
  status!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class OrderStatsObject {
  @Field(() => Int)
  totalOrders!: number;

  @Field(() => Float)
  totalRevenue!: number;

  @Field(() => Int)
  activeOrders!: number;

  @Field(() => Float)
  averageOrderValue!: number;

  @Field(() => [OrderStatusCount])
  byStatus!: OrderStatusCount[];
}
