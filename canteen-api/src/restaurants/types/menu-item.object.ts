import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class MenuItemObject {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field(() => Float)
  price!: number;

  @Field({ nullable: true })
  imageUrl?: string | null;

  @Field()
  category!: string;

  @Field()
  isAvailable!: boolean;

  @Field()
  isVeg!: boolean;

  @Field(() => Int, { nullable: true })
  calories?: number | null;

  @Field()
  restaurantId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
