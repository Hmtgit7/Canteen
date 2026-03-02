import { InputType, Field, Float, Int, ID } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

@InputType()
export class CreateMenuItemInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  price!: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  category!: string;

  @Field({ nullable: true, defaultValue: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @Field({ nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isVeg?: boolean;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsPositive()
  @IsOptional()
  calories?: number;
}
