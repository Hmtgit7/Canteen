// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './types/auth-response.type';
import type { JwtUserPayload } from '../common/types/jwt-payload.type';
import { Role } from '../common/enums/role.enum';
import { Country } from '../common/enums/country.enum';
import {
  PrismaRole,
  PrismaCountry,
  type User,
} from '../prisma/types/prisma-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        country: input.country as unknown as PrismaCountry,
        role: (input.role ?? Role.MEMBER) as unknown as PrismaRole,
      },
    });

    const token = this.generateToken(user);
    return { accessToken: token, user: this.mapUser(user) };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    return { accessToken: token, user: this.mapUser(user) };
  }

  private generateToken(user: User): string {
    const payload: JwtUserPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as unknown as Role,
      country: user.country as unknown as Country,
    };
    return this.jwtService.sign(payload);
  }

  private mapUser(user: User): AuthResponse['user'] {
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
