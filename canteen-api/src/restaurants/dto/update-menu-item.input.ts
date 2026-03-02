import { InputType, Field, Float, Int, ID } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

@InputType()
export class UpdateMenuItemInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isVeg?: boolean;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsPositive()
  @IsOptional()
  calories?: number;
}
