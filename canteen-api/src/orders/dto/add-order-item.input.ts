import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

@InputType()
export class AddOrderItemInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  menuItemId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity!: number;
}
