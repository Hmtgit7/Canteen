import { ObjectType, Field, Int } from '@nestjs/graphql';
import { RestaurantObject } from './restaurant.object';

@ObjectType()
export class PaginatedRestaurants {
  @Field(() => [RestaurantObject])
  items!: RestaurantObject[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  pageSize!: number;

  @Field()
  hasNextPage!: boolean;
}
