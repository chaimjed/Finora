import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AuthModule } from '../auth/auth.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [PrismaModule, AuthModule, S3Module],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, AdminUsersService],
})
export class UsersModule {}
