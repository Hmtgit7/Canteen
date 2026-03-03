import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PubSub } from 'graphql-subscriptions';
import { CreateOrderInput } from './dto/create-order.input';
import { AddOrderItemInput } from './dto/add-order-item.input';
import { UpdateOrderItemInput } from './dto/update-order-item.input';
import { CheckoutOrderInput } from './dto/checkout-order.input';
import type { OrderObject } from './types/order.object';
import type { OrderStatsObject } from './types/order-stats.object';
import type { JwtUserPayload } from '../common/types/jwt-payload.type';
import { Role } from '../common/enums/role.enum';
import { OrderStatus } from '../common/enums/graphql-enums';
import {
  PrismaCountry,
  PrismaOrderStatus,
  type Order,
  type OrderItem,
  type MenuItem,
} from '../prisma/types/prisma-types';

export const pubSub = new PubSub();
export const ORDER_UPDATED_EVENT = 'ORDER_UPDATED';

type OrderWithRelations = Order & {
  items: (OrderItem & { menuItem: MenuItem })[];
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create a new cart/order ───────────────────────────────────────────────
  async createOrder(
    input: CreateOrderInput,
    currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
    });

    if (!restaurant || !restaurant.isActive) {
      throw new NotFoundException('Restaurant not found');
    }

    // Re-BAC: users can only order from their country's restaurants
    if (
      currentUser.role !== Role.ADMIN &&
      restaurant.country !== (currentUser.country as unknown as PrismaCountry)
    ) {
      throw new ForbiddenException(
        'You can only order from restaurants in your country',
      );
    }

    // Check for existing active cart at this restaurant
    const existingCart = await this.prisma.order.findFirst({
      where: {
        userId: currentUser.sub,
        restaurantId: input.restaurantId,
        status: 'CART' as PrismaOrderStatus,
      },
    });

    if (existingCart) {
      throw new BadRequestException(
        'You already have an active cart at this restaurant',
      );
    }

    const order = await this.prisma.order.create({
      data: {
        userId: currentUser.sub,
        restaurantId: input.restaurantId,
        notes: input.notes,
        status: 'CART' as PrismaOrderStatus,
        totalAmount: 0,
      },
      include: { items: { include: { menuItem: true } } },
    });

    return this.mapOrder(order);
  }

  // ─── Add item to cart ──────────────────────────────────────────────────────
  async addOrderItem(
    input: AddOrderItemInput,
    currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    const order = await this.getEditableOrder(input.orderId, currentUser);

    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: input.menuItemId },
    });

    if (!menuItem || !menuItem.isAvailable) {
      throw new NotFoundException('Menu item not found or unavailable');
    }

    if (menuItem.restaurantId !== order.restaurantId) {
      throw new BadRequestException(
        'Menu item does not belong to the order restaurant',
      );
    }

    // Upsert: if item exists in cart, increment quantity
    const existingItem = await this.prisma.orderItem.findFirst({
      where: { orderId: input.orderId, menuItemId: input.menuItemId },
    });

    if (existingItem) {
      await this.prisma.orderItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + input.quantity },
      });
    } else {
      await this.prisma.orderItem.create({
        data: {
          orderId: input.orderId,
          menuItemId: input.menuItemId,
          quantity: input.quantity,
          unitPrice: menuItem.price,
        },
      });
    }

    return this.recalculateAndReturn(input.orderId);
  }

  // ─── Update item quantity (0 = remove) ────────────────────────────────────
  async updateOrderItem(
    input: UpdateOrderItemInput,
    currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: input.orderItemId },
    });

    if (!orderItem) throw new NotFoundException('Order item not found');

    await this.getEditableOrder(orderItem.orderId, currentUser);

    if (input.quantity === 0) {
      await this.prisma.orderItem.delete({ where: { id: input.orderItemId } });
    } else {
      await this.prisma.orderItem.update({
        where: { id: input.orderItemId },
        data: { quantity: input.quantity },
      });
    }

    return this.recalculateAndReturn(orderItem.orderId);
  }

  // ─── Checkout ──────────────────────────────────────────────────────────────
  async checkoutOrder(
    input: CheckoutOrderInput,
    currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    if (currentUser.role === Role.MEMBER) {
      throw new ForbiddenException('Members cannot checkout orders');
    }

    const order = await this.getEditableOrder(input.orderId, currentUser);

    if (order.items === undefined || order.items.length === 0) {
      throw new BadRequestException('Cannot checkout an empty order');
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: input.paymentMethodId },
    });

    if (!paymentMethod || paymentMethod.userId !== currentUser.sub) {
      throw new NotFoundException('Payment method not found');
    }

    const updated = await this.prisma.order.update({
      where: { id: input.orderId },
      data: {
        status: 'CONFIRMED' as PrismaOrderStatus,
        paymentId: input.paymentMethodId,
      },
      include: { items: { include: { menuItem: true } } },
    });

    const mapped = this.mapOrder(updated);
    await pubSub.publish(ORDER_UPDATED_EVENT, { orderUpdated: mapped });
    return mapped;
  }

  // ─── Cancel order ──────────────────────────────────────────────────────────
  async cancelOrder(
    orderId: string,
    currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    if (currentUser.role === Role.MEMBER) {
      throw new ForbiddenException('Members cannot cancel orders');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');

    this.assertOwnershipOrAdmin(order, currentUser);

    const cancellableStatuses: PrismaOrderStatus[] = [
      'CART',
      'PENDING',
      'CONFIRMED',
    ] as PrismaOrderStatus[];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel an order with status: ${order.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' as PrismaOrderStatus },
      include: { items: { include: { menuItem: true } } },
    });

    const mapped = this.mapOrder(updated);
    await pubSub.publish(ORDER_UPDATED_EVENT, { orderUpdated: mapped });
    return mapped;
  }

  // ─── Update order status (Admin/Manager) ──────────────────────────────────
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    if (currentUser.role === Role.MEMBER) {
      throw new ForbiddenException('Members cannot update order status');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as unknown as PrismaOrderStatus },
      include: { items: { include: { menuItem: true } } },
    });

    const mapped = this.mapOrder(updated);
    await pubSub.publish(ORDER_UPDATED_EVENT, { orderUpdated: mapped });
    return mapped;
  }

  // ─── Queries ───────────────────────────────────────────────────────────────
  async myOrders(currentUser: JwtUserPayload): Promise<OrderObject[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId: currentUser.sub,
        NOT: { status: 'CART' as PrismaOrderStatus },
      },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(this.mapOrder);
  }

  async myCart(currentUser: JwtUserPayload): Promise<OrderObject[]> {
    const carts = await this.prisma.order.findMany({
      where: {
        userId: currentUser.sub,
        status: 'CART' as PrismaOrderStatus,
      },
      include: { items: { include: { menuItem: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return carts.map(this.mapOrder);
  }

  async allOrders(currentUser: JwtUserPayload): Promise<OrderObject[]> {
    if (currentUser.role === Role.MEMBER) {
      throw new ForbiddenException('Members cannot view all orders');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        ...(currentUser.role === Role.MANAGER && {
          user: {
            country: currentUser.country as unknown as PrismaCountry,
          },
        }),
        NOT: { status: 'CART' as PrismaOrderStatus },
      },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(this.mapOrder);
  }

  async getOrderStats(currentUser: JwtUserPayload): Promise<OrderStatsObject> {
    if (currentUser.role === Role.MEMBER) {
      throw new ForbiddenException('Members cannot access order stats');
    }

    const countryFilter =
      currentUser.role === Role.MANAGER
        ? { user: { country: currentUser.country as unknown as PrismaCountry } }
        : {};

    const completedStatuses: PrismaOrderStatus[] = [
      'CONFIRMED',
      'PREPARING',
      'DELIVERED',
    ] as PrismaOrderStatus[];

    const activeStatuses: PrismaOrderStatus[] = [
      'CONFIRMED',
      'PREPARING',
    ] as PrismaOrderStatus[];

    const [allOrders, revenueOrders] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where: {
          ...countryFilter,
          NOT: { status: 'CART' as PrismaOrderStatus },
        },
        _count: { status: true },
      }),
      this.prisma.order.aggregate({
        where: {
          ...countryFilter,
          status: { in: completedStatuses },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
        _avg: { totalAmount: true },
      }),
    ]);

    const totalOrders = allOrders.reduce((sum, g) => sum + g._count.status, 0);
    const activeOrders = allOrders
      .filter((g) => activeStatuses.includes(g.status))
      .reduce((sum, g) => sum + g._count.status, 0);

    return {
      totalOrders,
      totalRevenue: revenueOrders._sum.totalAmount ?? 0,
      activeOrders,
      averageOrderValue: revenueOrders._avg.totalAmount ?? 0,
      byStatus: allOrders.map((g) => ({
        status: g.status,
        count: g._count.status,
      })),
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────
  private async getEditableOrder(
    orderId: string,
    currentUser: JwtUserPayload,
  ): Promise<OrderObject> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');

    this.assertOwnershipOrAdmin(order, currentUser);

    if (order.status !== ('CART' as PrismaOrderStatus)) {
      throw new BadRequestException('Order is no longer editable');
    }

    return this.mapOrder(order);
  }

  private assertOwnershipOrAdmin(
    order: { userId: string },
    currentUser: JwtUserPayload,
  ): void {
    if (currentUser.role !== Role.ADMIN && order.userId !== currentUser.sub) {
      throw new ForbiddenException('You do not own this order');
    }
  }

  private async recalculateAndReturn(orderId: string): Promise<OrderObject> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: { menuItem: true },
    });

    const total = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { totalAmount: Math.round(total * 100) / 100 },
      include: { items: { include: { menuItem: true } } },
    });

    return this.mapOrder(updated);
  }

  private readonly mapOrder = (order: OrderWithRelations): OrderObject => {
    return {
      id: order.id,
      status: order.status as unknown as OrderStatus,
      totalAmount: order.totalAmount,
      notes: order.notes,
      userId: order.userId,
      restaurantId: order.restaurantId,
      paymentId: order.paymentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: Math.round(item.unitPrice * item.quantity * 100) / 100,
        menuItemId: item.menuItemId,
        orderId: item.orderId,
        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          description: item.menuItem.description,
          price: item.menuItem.price,
          imageUrl: item.menuItem.imageUrl,
          category: item.menuItem.category,
          isAvailable: item.menuItem.isAvailable,
          isVeg: item.menuItem.isVeg,
          calories: item.menuItem.calories,
          restaurantId: item.menuItem.restaurantId,
          createdAt: item.menuItem.createdAt,
          updatedAt: item.menuItem.updatedAt,
        },
      })),
    };
  };
}
