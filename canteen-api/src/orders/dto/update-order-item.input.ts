import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

@InputType()
export class UpdateOrderItemInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  orderItemId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  quantity!: number;
}
