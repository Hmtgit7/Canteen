import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Country } from '../../common/enums/country.enum';
import { Role } from '../../common/enums/role.enum';

@InputType()
export class RegisterInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(6)
  password!: string;

  @Field(() => Country)
  @IsEnum(Country)
  country!: Country;

  @Field(() => Role, { nullable: true })
  @IsEnum(Role)
  role?: Role;
}
