import {
  Resolver,
  Query,
  Mutation,
  Subscription,
  Args,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService, pubSub } from './orders.service';
import { OrderObject } from './types/order.object';
import { OrderStatsObject } from './types/order-stats.object';
import { CreateOrderInput } from './dto/create-order.input';
import { AddOrderItemInput } from './dto/add-order-item.input';
import { UpdateOrderItemInput } from './dto/update-order-item.input';
import { CheckoutOrderInput } from './dto/checkout-order.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { OrderStatus } from '../common/enums/graphql-enums';
import type { JwtUserPayload } from '../common/types/jwt-payload.type';

@Resolver(() => OrderObject)
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── Queries ───────────────────────────────────────────────────────────────

  @Query(() => [OrderObject], { description: 'Get current user cart orders' })
  async myCart(
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderObject[]> {
    return this.ordersService.myCart(currentUser);
  }

  @Query(() => [OrderObject], { description: 'Get current user order history' })
  async myOrders(
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderObject[]> {
    return this.ordersService.myOrders(currentUser);
  }

  @Query(() => [OrderObject], {
    description: 'Get all orders — Admin/Manager only',
  })
  @Roles(Role.ADMIN, Role.MANAGER)
  async allOrders(
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderObject[]> {
    return this.ordersService.allOrders(currentUser);
  }

  @Query(() => OrderStatsObject, {
    description: 'Get order stats for dashboard — Admin/Manager only',
  })
  @Roles(Role.ADMIN, Role.MANAGER)
  async orderStats(
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderStatsObject> {
    return this.ordersService.getOrderStats(currentUser);
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  @Mutation(() => OrderObject, {
    description: 'Create a new order/cart at a restaurant',
  })
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    return this.ordersService.createOrder(input, currentUser);
  }

  @Mutation(() => OrderObject, {
    description: 'Add a menu item to an existing cart',
  })
  async addOrderItem(
    @Args('input') input: AddOrderItemInput,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    return this.ordersService.addOrderItem(input, currentUser);
  }

  @Mutation(() => OrderObject, {
    description: 'Update item quantity in cart (0 removes the item)',
  })
  async updateOrderItem(
    @Args('input') input: UpdateOrderItemInput,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    return this.ordersService.updateOrderItem(input, currentUser);
  }

  @Mutation(() => OrderObject, {
    description: 'Checkout cart with a payment method — Admin/Manager only',
  })
  @Roles(Role.ADMIN, Role.MANAGER)
  async checkoutOrder(
    @Args('input') input: CheckoutOrderInput,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    return this.ordersService.checkoutOrder(input, currentUser);
  }

  @Mutation(() => OrderObject, {
    description: 'Cancel an order — Admin/Manager only',
  })
  @Roles(Role.ADMIN, Role.MANAGER)
  async cancelOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    return this.ordersService.cancelOrder(orderId, currentUser);
  }

  @Mutation(() => OrderObject, {
    description: 'Update order status — Admin/Manager only',
  })
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateOrderStatus(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    return this.ordersService.updateOrderStatus(orderId, status, currentUser);
  }

  // ─── Subscription ──────────────────────────────────────────────────────────

  @Subscription(() => OrderObject, {
    description: 'Real-time order status updates',
    filter(
      payload: { orderUpdated: OrderObject },
      _variables: unknown,
      context: { req: { user: JwtUserPayload } },
    ): boolean {
      const user = context.req?.user;
      if (!user) return false;
      if (user.role === Role.MEMBER) {
        return payload.orderUpdated.userId === user.sub;
      }
      return true;
    },
  })
  orderUpdated() {
    return pubSub.asyncIterableIterator('ORDER_UPDATED');
  }
}
