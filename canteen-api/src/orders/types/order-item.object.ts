import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { MenuItemObject } from '../../restaurants/types/menu-item.object';

@ObjectType()
export class OrderItemObject {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Float)
  unitPrice!: number;

  @Field(() => Float)
  subtotal!: number;

  @Field(() => String)
  menuItemId!: string;

  @Field(() => String)
  orderId!: string;

  @Field(() => MenuItemObject, { nullable: true })
  menuItem?: MenuItemObject;
}
