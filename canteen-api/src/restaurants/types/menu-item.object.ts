import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class MenuItemObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Float)
  price!: number;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Field(() => String)
  category!: string;

  @Field(() => Boolean)
  isAvailable!: boolean;

  @Field(() => Boolean)
  isVeg!: boolean;

  @Field(() => Int, { nullable: true })
  calories?: number | null;

  @Field(() => String)
  restaurantId!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
