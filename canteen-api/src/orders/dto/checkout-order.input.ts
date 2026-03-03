import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CheckoutOrderInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  paymentMethodId!: string;
}
