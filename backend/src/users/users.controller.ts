import { Throttle } from '@nestjs/throttler';
import {
  BadRequestException, Body, Controller, Delete, Get, Patch, Post,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ApiBody, ApiConsumes  } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';


@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ description: 'Profile, role, permissions and account flags' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update first name, last name or date of birth' })
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(user, dto);
  }
  @Post('me/avatar')
@ApiBearerAuth('access-token')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@ApiOperation({ summary: 'Upload my avatar (PNG, JPEG or WebP, max 2 MB)' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@UseInterceptors(
  FileInterceptor('file', {
    limits: { fileSize: 2 * 1024 * 1024 },
  }),
)
uploadAvatar(
  @CurrentUser() user: JwtPayload,
  @UploadedFile() file?: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException(
      'No file uploaded — send it in the "file" field',
    );
  }

  return this.usersService.updateAvatar(user, file);
}

@Delete('me/avatar')
@ApiOperation({ summary: 'Remove my avatar' })
removeAvatar(@CurrentUser() user: JwtPayload) {
  return this.usersService.removeAvatar(user);
}
}
