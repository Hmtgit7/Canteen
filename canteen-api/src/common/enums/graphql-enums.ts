// src/common/enums/graphql-enums.ts
import { registerEnumType } from '@nestjs/graphql';
import { Role } from './role.enum';
import { Country } from './country.enum';

export enum OrderStatus {
  CART = 'CART',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentType {
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

registerEnumType(Role, { name: 'Role', description: 'User roles' });
registerEnumType(Country, {
  name: 'Country',
  description: 'Supported countries',
});
registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Order lifecycle status',
});
registerEnumType(PaymentType, {
  name: 'PaymentType',
  description: 'Payment method types',
});
