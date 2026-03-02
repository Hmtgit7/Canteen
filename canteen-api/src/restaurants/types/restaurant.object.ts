import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { Country } from '../../common/enums/country.enum';
import { MenuItemObject } from './menu-item.object';

@ObjectType()
export class RestaurantObject {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field({ nullable: true })
  imageUrl?: string | null;

  @Field()
  cuisine!: string;

  @Field(() => Country)
  country!: Country;

  @Field()
  city!: string;

  @Field()
  address!: string;

  @Field(() => Float)
  rating!: number;

  @Field(() => Int)
  reviewCount!: number;

  @Field()
  isActive!: boolean;

  @Field()
  openTime!: string;

  @Field()
  closeTime!: string;

  @Field(() => [MenuItemObject], { nullable: true })
  menuItems?: MenuItemObject[];

  @Field()
  isFavorited!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
