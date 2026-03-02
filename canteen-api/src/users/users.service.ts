// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { UserObject } from './types/user.object';
import type { JwtUserPayload } from '../common/types/jwt-payload.type';
import { Role } from '../common/enums/role.enum';
import { Country } from '../common/enums/country.enum';
import {
  PrismaRole,
  PrismaCountry,
  type User,
} from '../prisma/types/prisma-types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtUserPayload): Promise<UserObject[]> {
    const users = await this.prisma.user.findMany({
      where: {
        ...(currentUser.role !== Role.ADMIN && {
          country: currentUser.country as unknown as PrismaCountry,
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.mapUser(u));
  }

  async findById(id: string, currentUser: JwtUserPayload): Promise<UserObject> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('User not found');

    if (
      currentUser.role !== Role.ADMIN &&
      user.country !== (currentUser.country as unknown as PrismaCountry)
    ) {
      throw new ForbiddenException('Access denied: cross-country user access');
    }

    return this.mapUser(user);
  }

  async updateUser(
    input: UpdateUserInput,
    currentUser: JwtUserPayload,
  ): Promise<UserObject> {
    const user = await this.prisma.user.findUnique({ where: { id: input.id } });
    if (!user) throw new NotFoundException('User not found');

    if (input.role && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can change roles');
    }

    if (currentUser.sub !== input.id && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const updated = await this.prisma.user.update({
      where: { id: input.id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.role && {
          role: input.role as unknown as PrismaRole,
        }),
        ...(input.avatar !== undefined && { avatar: input.avatar }),
      },
    });

    return this.mapUser(updated);
  }

  async deactivateUser(
    id: string,
    currentUser: JwtUserPayload,
  ): Promise<UserObject> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return this.mapUser(updated);
  }

  private mapUser(user: User): UserObject {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as unknown as Role,
      country: user.country as unknown as Country,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
