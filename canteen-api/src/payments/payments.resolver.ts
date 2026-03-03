import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentMethodObject } from './types/payment-method.object';
import { CreatePaymentMethodInput } from './dto/create-payment-method.input';
import { UpdatePaymentMethodInput } from './dto/update-payment-method.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { JwtUserPayload } from '../common/types/jwt-payload.type';

@Resolver(() => PaymentMethodObject)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Query(() => [PaymentMethodObject], {
    description: 'Get current user payment methods',
  })
  async myPaymentMethods(
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<PaymentMethodObject[]> {
    return this.paymentsService.getMyPaymentMethods(currentUser);
  }

  @Mutation(() => PaymentMethodObject, {
    description: 'Add a payment method — Admin only',
  })
  @Roles(Role.ADMIN)
  async createPaymentMethod(
    @Args('input') input: CreatePaymentMethodInput,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<PaymentMethodObject> {
    return this.paymentsService.createPaymentMethod(input, currentUser);
  }

  @Mutation(() => PaymentMethodObject, {
    description: 'Update a payment method — Admin only',
  })
  @Roles(Role.ADMIN)
  async updatePaymentMethod(
    @Args('input') input: UpdatePaymentMethodInput,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<PaymentMethodObject> {
    return this.paymentsService.updatePaymentMethod(input, currentUser);
  }

  @Mutation(() => Boolean, {
    description: 'Delete a payment method — Admin only',
  })
  @Roles(Role.ADMIN)
  async deletePaymentMethod(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<boolean> {
    return this.paymentsService.deletePaymentMethod(id, currentUser);
  }
}
