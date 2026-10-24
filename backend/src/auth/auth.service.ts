import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import type { TokenPayload } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { generateRawToken, hashToken } from '../common/utils/crypto.util';
import { TokenType } from '../../generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { JwtPayload } from './strategies/jwt.strategy';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const defaultRole = await this.getDefaultRole();
    const password = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password,
        roleId: defaultRole.id,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });

    await this.sendVerificationEmail(user.id, user.email);

    return { id: user.id, email: user.email };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Use Google or set a password first.',
      );
    }

    const passwordValid = await argon2.verify(user.password, dto.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email not verified');
    }

    return this.issueTokenPair(user.id, user.email, user.role.name);
  }

  async googleAuth(idToken: string) {
    const g = await this.verifyGoogleToken(idToken);

    let user = await this.prisma.user.findUnique({
      where: { googleId: g.googleId },
      include: { role: true },
    });

    if (!user) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: g.email },
      });

      if (existingByEmail) {
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: g.googleId, isEmailVerified: true },
          include: { role: true },
        });
      } else {
        const defaultRole = await this.getDefaultRole();
        user = await this.prisma.user.create({
          data: {
            firstName: g.firstName || 'Google',
            lastName: g.lastName || 'User',
            email: g.email,
            googleId: g.googleId,
            isEmailVerified: true,
            roleId: defaultRole.id,
          },
          include: { role: true },
        });
      }
    }

    return this.issueTokenPair(user.id, user.email, user.role.name);
  }

  async setPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.password) {
      throw new BadRequestException('Password already set — use the change-password flow instead');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await argon2.hash(newPassword) },
    });

    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from your current password');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.password) {
      throw new BadRequestException('No password set yet — use set-password first');
    }

    const valid = await argon2.verify(user.password, dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const password = await argon2.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { password } }),
      this.prisma.userToken.updateMany({
        where: { userId, type: TokenType.REFRESH, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return { success: true };
  }
  async refreshTokens(rawRefreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.prisma.userToken.findFirst({
      where: {
        userId: payload.sub,
        type: TokenType.REFRESH,
        value: hashToken(rawRefreshToken),
        revoked: false,
      },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token not recognized');
    }

    await this.prisma.userToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return this.issueTokenPair(user.id, user.email, user.role.name);
  }

  async logout(userId: string, rawRefreshToken: string) {
    await this.prisma.userToken.updateMany({
      where: { userId, type: TokenType.REFRESH, value: hashToken(rawRefreshToken) },
      data: { revoked: true },
    });
    return { success: true };
  }

  async sendVerificationEmail(userId: string, email: string) {
    const expiresInMin = Number(process.env.EMAIL_VERIFICATION_EXPIRES_IN_MIN || 60);
    const rawToken = generateRawToken();

    await this.prisma.userToken.updateMany({
      where: { userId, type: TokenType.EMAIL_VERIFICATION, revoked: false },
      data: { revoked: true },
    });

    await this.prisma.userToken.create({
      data: {
        userId,
        type: TokenType.EMAIL_VERIFICATION,
        value: hashToken(rawToken),
        expiresAt: new Date(Date.now() + expiresInMin * 60_000),
      },
    });

    try {
      await this.mailService.sendVerificationEmail(email, rawToken, expiresInMin);
    } catch (err) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async isOnCooldown(userId: string, type: TokenType, seconds = 60) {
    const recent = await this.prisma.userToken.findFirst({
      where: { userId, type, createdAt: { gt: new Date(Date.now() - seconds * 1000) } },
      select: { id: true },
    });
    return !!recent;
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (
      user &&
      !user.isEmailVerified &&
      !(await this.isOnCooldown(user.id, TokenType.EMAIL_VERIFICATION))
    ) {
      await this.sendVerificationEmail(user.id, user.email);
    }
    return { success: true };
  }

  async verifyEmail(rawToken: string) {
    const stored = await this.prisma.userToken.findFirst({
      where: {
        type: TokenType.EMAIL_VERIFICATION,
        value: hashToken(rawToken),
        revoked: false,
      },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.userToken.update({
        where: { id: stored.id },
        data: { revoked: true },
      }),
    ]);

    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true };
    if (await this.isOnCooldown(user.id, TokenType.RESET_PASSWORD)) return { success: true };
    const expiresInMin = Number(process.env.RESET_PASSWORD_EXPIRES_IN_MIN || 30);
    const rawToken = generateRawToken();

    await this.prisma.userToken.updateMany({
      where: { userId: user.id, type: TokenType.RESET_PASSWORD, revoked: false },
      data: { revoked: true },
    });

    await this.prisma.userToken.create({
      data: {
        userId: user.id,
        type: TokenType.RESET_PASSWORD,
        value: hashToken(rawToken),
        expiresAt: new Date(Date.now() + expiresInMin * 60_000),
      },
    });

    try {
      await this.mailService.sendPasswordResetEmail(user.email, rawToken, expiresInMin);
    } catch (err) {
      this.logger.error(
        `Failed to send reset email to ${user.email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    return { success: true };
  }
  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const stored = await this.prisma.userToken.findFirst({
      where: { type: TokenType.RESET_PASSWORD, value: hashToken(dto.token), revoked: false },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (user?.password) {
      const sameAsOld = await argon2.verify(user.password, dto.newPassword);
      if (sameAsOld) {
        throw new BadRequestException('New password must be different from your current password');
      }
    }

    const password = await argon2.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: stored.userId }, data: { password } }),
      this.prisma.userToken.update({ where: { id: stored.id }, data: { revoked: true } }),
      this.prisma.userToken.updateMany({
        where: { userId: stored.userId, type: TokenType.REFRESH, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return { success: true };
  }

  private async getDefaultRole() {
    const role = await this.prisma.role.findUnique({ where: { name: 'USER' } });
    if (!role) {
      throw new BadRequestException('Default role USER not found — run the seed first');
    }
    return role;
  }

  private async verifyGoogleToken(idToken: string) {
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
    };
  }

  private async issueTokenPair(userId: string, email: string, roleName: string) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: { name: roleName } },
      include: { permission: true },
    });

    const payload: JwtPayload = {
      sub: userId,
      email,
      role: roleName,
      permissions: rolePermissions.map((rp) => rp.permission.code),
    };

    const accessExpiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ??
      '15m') as JwtSignOptions['expiresIn'];
    const refreshExpiresRaw = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
    const refreshExpiresIn = refreshExpiresRaw as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email, jti: randomUUID() },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpiresIn,
      },
    );

    await this.prisma.userToken.create({
      data: {
        userId,
        type: TokenType.REFRESH,
        value: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.parseExpiresInMs(refreshExpiresRaw)),
      },
    });

    return { accessToken, refreshToken };
  }

  private parseExpiresInMs(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // 7 j
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return Number(match[1]) * multipliers[match[2]];
  }
}
