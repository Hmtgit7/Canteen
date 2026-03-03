import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentMethodInput } from './dto/create-payment-method.input';
import { UpdatePaymentMethodInput } from './dto/update-payment-method.input';
import type { PaymentMethodObject } from './types/payment-method.object';
import type { JwtUserPayload } from '../common/types/jwt-payload.type';
import { Role } from '../common/enums/role.enum';
import { PaymentType } from '../common/enums/graphql-enums';
import {
  PrismaPaymentType,
  type PaymentMethod,
} from '../prisma/types/prisma-types';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyPaymentMethods(
    currentUser: JwtUserPayload,
  ): Promise<PaymentMethodObject[]> {
    const methods = await this.prisma.paymentMethod.findMany({
      where: { userId: currentUser.sub },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return methods.map(this.mapPaymentMethod);
  }

  async createPaymentMethod(
    input: CreatePaymentMethodInput,
    currentUser: JwtUserPayload,
  ): Promise<PaymentMethodObject> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can add payment methods');
    }

    // If setting as default, unset existing defaults first
    if (input.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId: currentUser.sub, isDefault: true },
        data: { isDefault: false },
      });
    }

    const method = await this.prisma.paymentMethod.create({
      data: {
        userId: currentUser.sub,
        type: input.type as unknown as PrismaPaymentType,
        label: input.label,
        last4: input.last4,
        isDefault: input.isDefault ?? false,
      },
    });

    return this.mapPaymentMethod(method);
  }

  async updatePaymentMethod(
    input: UpdatePaymentMethodInput,
    currentUser: JwtUserPayload,
  ): Promise<PaymentMethodObject> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can modify payment methods');
    }

    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id: input.id },
    });

    if (!existing) throw new NotFoundException('Payment method not found');

    if (existing.userId !== currentUser.sub) {
      throw new ForbiddenException('You do not own this payment method');
    }

    // Swap default
    if (input.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId: currentUser.sub, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.paymentMethod.update({
      where: { id: input.id },
      data: {
        ...(input.label !== undefined && { label: input.label }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      },
    });

    return this.mapPaymentMethod(updated);
  }

  async deletePaymentMethod(
    id: string,
    currentUser: JwtUserPayload,
  ): Promise<boolean> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can delete payment methods');
    }

    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException('Payment method not found');

    if (existing.userId !== currentUser.sub) {
      throw new ForbiddenException('You do not own this payment method');
    }

    await this.prisma.paymentMethod.delete({ where: { id } });
    return true;
  }

  private readonly mapPaymentMethod = (
    method: PaymentMethod,
  ): PaymentMethodObject => {
    return {
      id: method.id,
      type: method.type as unknown as PaymentType,
      label: method.label,
      last4: method.last4,
      isDefault: method.isDefault,
      userId: method.userId,
      createdAt: method.createdAt,
      updatedAt: method.updatedAt,
    };
  };
}
