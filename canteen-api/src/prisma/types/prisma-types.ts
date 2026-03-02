// src/prisma/prisma-types.ts
export {
  Role as PrismaRole,
  Country as PrismaCountry,
  OrderStatus as PrismaOrderStatus,
  PaymentType as PrismaPaymentType,
} from '../../../generated/prisma/client';

export type {
  User,
  Restaurant,
  MenuItem,
  Order,
  OrderItem,
  PaymentMethod,
  Favorite,
  Review,
} from '../../../generated/prisma/client';
