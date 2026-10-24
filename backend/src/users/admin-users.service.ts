import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Prisma, TokenType } from '../../generated/prisma/client';
import type { Role, User } from '../../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

type UserWithRole = User & { role: Role };

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const { search, role, status, provider } = query;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role: { name: role } } : {}),
      ...(status === 'verified' ? { isEmailVerified: true } : {}),
      ...(status === 'unverified' ? { isEmailVerified: false } : {}),
      ...(provider === 'google' ? { googleId: { not: null } } : {}),
      ...(provider === 'password' ? { password: { not: null } } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } },
            ],
          }
        : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => this.toView(u)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  async findOne(id: string) {
    return this.toView(await this.getUser(id));
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const role = await this.getRole(dto.role ?? 'USER');

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: await argon2.hash(dto.password),
        roleId: role.id,
      },
      include: { role: true },
    });

    await this.authService.sendVerificationEmail(user.id, user.email);
    return this.toView(user);
  }

  async update(id: string, dto: AdminUpdateUserDto) {
  const existing = await this.getUser(id);

  let dateOfBirth: Date | undefined;
  if (dto.dateOfBirth) {
    dateOfBirth = new Date(dto.dateOfBirth);
    if (dateOfBirth > new Date()) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }
  }

  const emailChanged = !!dto.email && dto.email !== existing.email;
  if (emailChanged) {
    const conflict = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (conflict) throw new ConflictException('Email already in use');
  }

  const passwordChanged = !!dto.password;
  const sendVerification = dto.sendVerificationEmail ?? true;

  const user = await this.prisma.user.update({
    where: { id },
    data: {
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfBirth,
      ...(emailChanged && {
        email: dto.email,
        isEmailVerified: sendVerification ? false : true,
      }),
      ...(passwordChanged && { password: await argon2.hash(dto.password!) }),
    },
    include: { role: true },
  });

  if (emailChanged && sendVerification) {
    await this.authService.sendVerificationEmail(user.id, user.email);
  }

  if (passwordChanged) {
    await this.prisma.userToken.updateMany({
      where: { userId: id, type: TokenType.REFRESH, revoked: false },
      data: { revoked: true },
    });
  }

  return this.toView(user);
}
  async getStats() {
    const [totalUsers, verifiedUsers, googleUsers, passwordUsers, roles, recentUsers] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isEmailVerified: true } }),
        this.prisma.user.count({ where: { googleId: { not: null } } }),
        this.prisma.user.count({ where: { password: { not: null } } }),
        this.prisma.role.findMany({
          include: { _count: { select: { users: true } } },
          orderBy: { name: 'asc' },
        }),
        this.prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { role: true },
        }),
      ]);

    return {
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      googleUsers,
      passwordUsers,
      usersByRole: roles.map((r) => ({ role: r.name, count: r._count.users })),
      recentUsers: recentUsers.map((u) => this.toView(u)),
    };
  }
  async changeRole(current: JwtPayload, id: string, roleName: string) {
    if (id === current.sub) throw new ForbiddenException('You cannot change your own role');
    await this.getUser(id);
    const role = await this.getRole(roleName);

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { roleId: role.id },
        include: { role: true },
      }),
      this.prisma.userToken.updateMany({
        where: { userId: id, type: TokenType.REFRESH, revoked: false },
        data: { revoked: true },
      }),
    ]);
    return this.toView(user);
  }

  async remove(current: JwtPayload, id: string) {
    if (id === current.sub) throw new ForbiddenException('You cannot delete your own account');
    await this.getUser(id);

    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException('This user has related data and cannot be deleted');
      }
      throw e;
    }
    return { success: true };
  }

  async exportCsv() {
    const users = await this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'asc' },
      take: 10_000, 
    });

    const header = ['id', 'email', 'firstName', 'lastName', 'role', 'isEmailVerified', 'createdAt'];
    const rows = users.map((u) =>
      [u.id, u.email, u.firstName, u.lastName, u.role.name, u.isEmailVerified, u.createdAt]
        .map((v) => this.csvCell(v))
        .join(','),
    );

    return '\uFEFF' + [header.join(','), ...rows].join('\r\n');
  }

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      permissions: r.permissions.map((rp) => ({
        code: rp.permission.code,
        label: rp.permission.label,
      })),
    }));
  }

  private async getUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async getRole(name: string) {
    const role = await this.prisma.role.findUnique({ where: { name } });
    if (!role) throw new BadRequestException(`Unknown role: ${name}`);
    return role;
  }

  private toView(u: UserWithRole) {
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      dateOfBirth: u.dateOfBirth,
      profileAvatar: u.profileAvatar,
      isEmailVerified: u.isEmailVerified,
      role: u.role.name,
      hasPassword: !!u.password,
      googleLinked: !!u.googleId,
      createdAt: u.createdAt,
    };
  }

  private csvCell(value: unknown): string {
    let s = value instanceof Date ? value.toISOString() : String(value ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; 
    return `"${s.replace(/"/g, '""')}"`;
  }
}
