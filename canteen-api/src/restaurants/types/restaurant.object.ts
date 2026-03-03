import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { Country } from '../../common/enums/country.enum';
import { MenuItemObject } from './menu-item.object';

@ObjectType()
export class RestaurantObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Field(() => String)
  cuisine!: string;

  @Field(() => Country)
  country!: Country;

  @Field(() => String)
  city!: string;

  @Field(() => String)
  address!: string;

  @Field(() => Float)
  rating!: number;

  @Field(() => Int)
  reviewCount!: number;

  @Field(() => Boolean)
  isActive!: boolean;

  @Field(() => String)
  openTime!: string;

  @Field(() => String)
  closeTime!: string;

  @Field(() => [MenuItemObject], { nullable: true })
  menuItems?: MenuItemObject[];

  @Field(() => Boolean)
  isFavorited!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
