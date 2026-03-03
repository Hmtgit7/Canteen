import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantFilterInput } from './dto/restaurant-filter.input';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';
import type { RestaurantObject } from './types/restaurant.object';
import type { MenuItemObject } from './types/menu-item.object';
import type { PaginatedRestaurants } from './types/paginated-restaurants.object';
import type { JwtUserPayload } from '../common/types/jwt-payload.type';
import { Role } from '../common/enums/role.enum';
import { Country } from '../common/enums/country.enum';
import {
  PrismaCountry,
  type Restaurant,
  type MenuItem,
} from '../prisma/types/prisma-types';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filter: RestaurantFilterInput,
    currentUser: JwtUserPayload,
  ): Promise<PaginatedRestaurants> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    // Re-BAC: restrict to user's own country unless Admin
    const countryFilter: PrismaCountry | undefined =
      currentUser.role === Role.ADMIN
        ? (filter.country as unknown as PrismaCountry | undefined)
        : (currentUser.country as unknown as PrismaCountry);

    const where = {
      isActive: true,
      ...(countryFilter && { country: countryFilter }),
      ...(filter.cuisine && { cuisine: filter.cuisine }),
      ...(filter.city && {
        city: { contains: filter.city, mode: 'insensitive' as const },
      }),
      ...(filter.search && {
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' as const } },
          {
            description: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
          {
            cuisine: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        include: { menuItems: true },
        skip,
        take: pageSize,
        orderBy: { rating: 'desc' },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    // Fetch user favorites for this batch
    const favoriteIds = await this.getUserFavoriteIds(
      currentUser.sub,
      restaurants.map((r) => r.id),
    );

    return {
      items: restaurants.map((r) =>
        this.mapRestaurant(r, r.menuItems, favoriteIds),
      ),
      total,
      page,
      pageSize,
      hasNextPage: skip + pageSize < total,
    };
  }

  async findById(
    id: string,
    currentUser: JwtUserPayload,
  ): Promise<RestaurantObject> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { menuItems: { where: { isAvailable: true } } },
    });

    if (!restaurant || !restaurant.isActive) {
      throw new NotFoundException('Restaurant not found');
    }

    // Re-BAC country check
    if (
      currentUser.role !== Role.ADMIN &&
      restaurant.country !== (currentUser.country as unknown as PrismaCountry)
    ) {
      throw new ForbiddenException(
        'Access denied: restaurant is in a different country',
      );
    }

    const favoriteIds = await this.getUserFavoriteIds(currentUser.sub, [id]);
    return this.mapRestaurant(restaurant, restaurant.menuItems, favoriteIds);
  }

  async getMenuItems(restaurantId: string): Promise<MenuItemObject[]> {
    const items = await this.prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return items.map(this.mapMenuItem);
  }

  async createMenuItem(
    input: CreateMenuItemInput,
    currentUser: JwtUserPayload,
  ): Promise<MenuItemObject> {
    if (currentUser.role === Role.MEMBER) {
      throw new ForbiddenException('Members cannot create menu items');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
    });

    if (!restaurant) throw new NotFoundException('Restaurant not found');

    // Re-BAC: managers can only manage their country
    if (
      currentUser.role === Role.MANAGER &&
      restaurant.country !== (currentUser.country as unknown as PrismaCountry)
    ) {
      throw new ForbiddenException(
        'Managers can only manage restaurants in their country',
      );
    }

    const item = await this.prisma.menuItem.create({
      data: {
        restaurantId: input.restaurantId,
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        category: input.category,
        isAvailable: input.isAvailable ?? true,
        isVeg: input.isVeg ?? false,
        calories: input.calories,
      },
    });

    return this.mapMenuItem(item);
  }

  async updateMenuItem(
    input: UpdateMenuItemInput,
    currentUser: JwtUserPayload,
  ): Promise<MenuItemObject> {
    if (currentUser.role === Role.MEMBER) {
      throw new ForbiddenException('Members cannot update menu items');
    }

    const item = await this.prisma.menuItem.findUnique({
      where: { id: input.id },
      include: { restaurant: true },
    });

    if (!item) throw new NotFoundException('Menu item not found');

    if (
      currentUser.role === Role.MANAGER &&
      item.restaurant.country !==
        (currentUser.country as unknown as PrismaCountry)
    ) {
      throw new ForbiddenException(
        'Managers can only manage restaurants in their country',
      );
    }

    const updated = await this.prisma.menuItem.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.isAvailable !== undefined && {
          isAvailable: input.isAvailable,
        }),
        ...(input.isVeg !== undefined && { isVeg: input.isVeg }),
        ...(input.calories !== undefined && { calories: input.calories }),
      },
    });

    return this.mapMenuItem(updated);
  }

  async toggleFavorite(
    restaurantId: string,
    currentUser: JwtUserPayload,
  ): Promise<boolean> {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_restaurantId: { userId: currentUser.sub, restaurantId },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return false;
    }

    await this.prisma.favorite.create({
      data: { userId: currentUser.sub, restaurantId },
    });
    return true;
  }

  async getFavorites(currentUser: JwtUserPayload): Promise<RestaurantObject[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId: currentUser.sub },
      include: {
        restaurant: { include: { menuItems: true } },
      },
    });

    const restaurantIds = favorites.map((f) => f.restaurantId);
    return favorites.map((f) =>
      this.mapRestaurant(f.restaurant, f.restaurant.menuItems, restaurantIds),
    );
  }

  async getCuisines(currentUser: JwtUserPayload): Promise<string[]> {
    const countryFilter =
      currentUser.role === Role.ADMIN
        ? undefined
        : (currentUser.country as unknown as PrismaCountry);

    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        isActive: true,
        ...(countryFilter && { country: countryFilter }),
      },
      select: { cuisine: true },
      distinct: ['cuisine'],
      orderBy: { cuisine: 'asc' },
    });

    return restaurants.map((r) => r.cuisine);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async getUserFavoriteIds(
    userId: string,
    restaurantIds: string[],
  ): Promise<string[]> {
    const favs = await this.prisma.favorite.findMany({
      where: { userId, restaurantId: { in: restaurantIds } },
      select: { restaurantId: true },
    });
    return favs.map((f) => f.restaurantId);
  }

  private mapRestaurant(
    r: Restaurant,
    menuItems: MenuItem[],
    favoriteIds: string[],
  ): RestaurantObject {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      cuisine: r.cuisine,
      country: r.country as unknown as Country,
      city: r.city,
      address: r.address,
      rating: r.rating,
      reviewCount: r.reviewCount,
      isActive: r.isActive,
      openTime: r.openTime,
      closeTime: r.closeTime,
      menuItems: menuItems.map(this.mapMenuItem),
      isFavorited: favoriteIds.includes(r.id),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private mapMenuItem = (item: MenuItem): MenuItemObject => {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category,
      isAvailable: item.isAvailable,
      isVeg: item.isVeg,
      calories: item.calories,
      restaurantId: item.restaurantId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  };
}
