import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import type { Role, User } from '../../generated/prisma/client';
import { S3Service } from '../s3/s3.service';
import { randomUUID } from 'crypto';
import 'multer';

type UserWithRole = User & { role: Role };
function detectImageExtension(buf: Buffer): 'png' | 'jpg' | 'webp' | null {
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length >= 8 && png.every((b, i) => buf[i] === b)) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

const MIME_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' } as const;
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
      private readonly s3: S3Service,

  ) {}

  async getMe(current: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: current.sub },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.toProfile(user, current.permissions);
  }

  async updateMe(current: JwtPayload, dto: UpdateProfileDto) {
  let dateOfBirth: Date | undefined;
  if (dto.dateOfBirth) {
    dateOfBirth = new Date(dto.dateOfBirth);
    if (dateOfBirth > new Date()) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }
  }

  const user = await this.prisma.user.update({
    where: { id: current.sub },
    data: {
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfBirth,
      timezone: dto.timezone,
      Currency: dto.preferredCurrency,
    },
    include: { role: true },
  });

  return this.toProfile(user, current.permissions);
}

  private toProfile(user: UserWithRole, permissions: string[]) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      profileAvatar: user.profileAvatar,
      isEmailVerified: user.isEmailVerified,
      timezone: user.timezone,
      Currency: user.Currency,
      role: user.role.name,
      permissions,
      hasPassword: !!user.password,   
      createdAt: user.createdAt,
    };
  }


async updateAvatar(current: JwtPayload, file: Express.Multer.File) {
  const ext = detectImageExtension(file.buffer);
  if (!ext) throw new BadRequestException('Only PNG, JPEG or WebP images are allowed');

  const user = await this.prisma.user.findUnique({
    where: { id: current.sub },
    select: { profileAvatar: true },
  });
  if (!user) throw new NotFoundException('User not found');

  const key = `avatars/${current.sub}-${randomUUID()}.${ext}`;
  const url = await this.s3.upload(key, file.buffer, MIME_BY_EXT[ext]);

  const updated = await this.prisma.user.update({
    where: { id: current.sub },
    data: { profileAvatar: url },
    include: { role: true },
  });

  if (user.profileAvatar) {
    const oldKey = this.s3.keyFromUrl(user.profileAvatar);
    if (oldKey) await this.s3.delete(oldKey);
  }

  return this.toProfile(updated, current.permissions);
}

async removeAvatar(current: JwtPayload) {
  const user = await this.prisma.user.findUnique({
    where: { id: current.sub },
    select: { profileAvatar: true },
  });
  if (!user) throw new NotFoundException('User not found');

  const updated = await this.prisma.user.update({
    where: { id: current.sub },
    data: { profileAvatar: null },
    include: { role: true },
  });

  if (user.profileAvatar) {
    const oldKey = this.s3.keyFromUrl(user.profileAvatar);
    if (oldKey) await this.s3.delete(oldKey);
  }

  return this.toProfile(updated, current.permissions);
}

  
}