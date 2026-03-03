import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserObject } from './types/user.object';
import { UpdateUserInput } from './dto/update-user.input';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { JwtUserPayload } from '../common/types/jwt-payload.type';

@Resolver(() => UserObject)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserObject], { description: 'Get all users (Admin/Manager)' })
  @Roles(Role.ADMIN, Role.MANAGER)
  async users(
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<UserObject[]> {
    return this.usersService.findAll(currentUser);
  }

  @Query(() => UserObject, { description: 'Get current logged-in user' })
  async me(@CurrentUser() currentUser: JwtUserPayload): Promise<UserObject> {
    return this.usersService.findById(currentUser.sub, currentUser);
  }

  @Mutation(() => UserObject, { description: 'Update user profile or role' })
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<UserObject> {
    return this.usersService.updateUser(input, currentUser);
  }

  @Mutation(() => UserObject, { description: 'Deactivate a user (Admin only)' })
  @Roles(Role.ADMIN)
  async deactivateUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<UserObject> {
    return this.usersService.deactivateUser(id, currentUser);
  }
}
