import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantObject } from './types/restaurant.object';
import { MenuItemObject } from './types/menu-item.object';
import { PaginatedRestaurants } from './types/paginated-restaurants.object';
import { RestaurantFilterInput } from './dto/restaurant-filter.input';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { JwtUserPayload } from '../common/types/jwt-payload.type';

@Resolver(() => RestaurantObject)
@UseGuards(JwtAuthGuard, RolesGuard)
export class RestaurantsResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Query(() => PaginatedRestaurants, {
    description: 'Get all restaurants with optional filters and pagination',
  })
  async restaurants(
    @Args('filter', { nullable: true }) filter: RestaurantFilterInput = {},
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<PaginatedRestaurants> {
    return this.restaurantsService.findAll(filter, currentUser);
  }

  @Query(() => RestaurantObject, {
    description: 'Get a single restaurant with its menu',
  })
  async restaurant(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<RestaurantObject> {
    return this.restaurantsService.findById(id, currentUser);
  }

  @Query(() => [MenuItemObject], {
    description: 'Get all available menu items for a restaurant',
  })
  async menuItems(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
  ): Promise<MenuItemObject[]> {
    return this.restaurantsService.getMenuItems(restaurantId);
  }

  @Query(() => [RestaurantObject], {
    description: "Get current user's favorited restaurants",
  })
  async myFavorites(
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<RestaurantObject[]> {
    return this.restaurantsService.getFavorites(currentUser);
  }

  @Query(() => [String], {
    description: 'Get distinct cuisine types available to the user',
  })
  async cuisines(
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<string[]> {
    return this.restaurantsService.getCuisines(currentUser);
  }

  @Mutation(() => MenuItemObject, {
    description: 'Create a menu item (Admin/Manager only)',
  })
  @Roles(Role.ADMIN, Role.MANAGER)
  async createMenuItem(
    @Args('input') input: CreateMenuItemInput,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<MenuItemObject> {
    return this.restaurantsService.createMenuItem(input, currentUser);
  }

  @Mutation(() => MenuItemObject, {
    description: 'Update a menu item (Admin/Manager only)',
  })
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateMenuItem(
    @Args('input') input: UpdateMenuItemInput,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<MenuItemObject> {
    return this.restaurantsService.updateMenuItem(input, currentUser);
  }

  @Mutation(() => Boolean, {
    description: 'Toggle favorite status for a restaurant',
  })
  async toggleFavorite(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<boolean> {
    return this.restaurantsService.toggleFavorite(restaurantId, currentUser);
  }
}
