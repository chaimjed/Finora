import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenType } from '../../generated/prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';

const SYSTEM_ROLES = ['ADMIN', 'USER'];
const CRITICAL_PERMISSION = 'roles:manage'; 

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    return roles.map((r) => this.toView(r));
  }

  async findOne(id: string) {
    return this.toView(await this.getRole(id));
  }

async create(dto: CreateRoleDto) {
  const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
  if (existing) throw new ConflictException('A role with this name already exists');

  const role = await this.prisma.role.create({
    data: { name: dto.name },
    include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
  });
  return this.toView(role);
}
 
  async remove(id: string) {
    const role = await this.getRole(id);
    if (SYSTEM_ROLES.includes(role.name)) {
      throw new ForbiddenException(`The system role "${role.name}" cannot be deleted`);
    }

    const usersCount = await this.prisma.user.count({ where: { roleId: id } });
    if (usersCount > 0) {
      throw new ConflictException(
        `${usersCount} user(s) still have this role — reassign them first`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  async setPermissions(id: string, codes: string[]) {
    const role = await this.getRole(id);
    const permissions = await this.resolvePermissions(codes);
    this.assertNotStrippingCriticalPermission(role.name, codes);

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: id, permissionId: p.id })),
      }),
      this.prisma.userToken.updateMany({
        where: { user: { roleId: id }, type: TokenType.REFRESH, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return this.findOne(id);
  }

  async addPermissions(id: string, codes: string[]) {
    await this.getRole(id);
    const permissions = await this.resolvePermissions(codes);

    await this.prisma.$transaction(
      permissions.map((p) =>
        this.prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: id, permissionId: p.id } },
          update: {},
          create: { roleId: id, permissionId: p.id },
        }),
      ),
    );

    return this.findOne(id);
  }

  async removePermission(id: string, code: string) {
    const role = await this.getRole(id);
    this.assertNotStrippingCriticalPermission(
      role.name,
      role.permissions.map((rp) => rp.permission.code).filter((c) => c !== code),
    );

    const permission = await this.prisma.permission.findUnique({ where: { code } });
    if (!permission) throw new NotFoundException(`Unknown permission code: ${code}`);

    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id, permissionId: permission.id },
    });

    return this.findOne(id);
  }

  async listPermissions() {
    const permissions = await this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
    return permissions.map((p) => ({ code: p.code, label: p.label, description: p.description }));
  }

  private async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  private async resolvePermissions(codes: string[]) {
    if (codes.length === 0) throw new BadRequestException('permissionCodes cannot be empty');
    const permissions = await this.prisma.permission.findMany({ where: { code: { in: codes } } });
    const found = new Set(permissions.map((p) => p.code));
    const unknown = codes.filter((c) => !found.has(c));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown permission code(s): ${unknown.join(', ')}`);
    }
    return permissions;
  }

  private assertNotStrippingCriticalPermission(roleName: string, resultingCodes: string[]) {
    if (roleName === 'ADMIN' && !resultingCodes.includes(CRITICAL_PERMISSION)) {
      throw new ForbiddenException(
        `"${CRITICAL_PERMISSION}" cannot be removed from ADMIN — this would lock everyone out of role management`,
      );
    }
  }

  private toView(role: {
    id: string;
    name: string;
    permissions: { permission: { code: string; label: string } }[];
    _count?: { users: number };
  }) {
    return {
      id: role.id,
      name: role.name,
      isSystemRole: SYSTEM_ROLES.includes(role.name),
      usersCount: role._count?.users ?? 0,
      permissions: role.permissions.map((rp) => ({
        code: rp.permission.code,
        label: rp.permission.label,
      })),
    };
  }
}