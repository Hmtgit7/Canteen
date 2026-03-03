import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}
