import { InputType, Field } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PaymentType } from '../../common/enums/graphql-enums';

@InputType()
export class CreatePaymentMethodInput {
  @Field(() => PaymentType)
  @IsEnum(PaymentType)
  type!: PaymentType;

  @Field()
  @IsString()
  @IsNotEmpty()
  label!: string;

  @Field({ nullable: true })
  @IsString()
  @Length(4, 4, { message: 'last4 must be exactly 4 digits' })
  @IsOptional()
  last4?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
