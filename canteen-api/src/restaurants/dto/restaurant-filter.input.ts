import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Country } from '../../common/enums/country.enum';

@InputType()
export class RestaurantFilterInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field(() => Country, { nullable: true })
  @IsEnum(Country)
  @IsOptional()
  country?: Country;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  cuisine?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  pageSize?: number;
}
