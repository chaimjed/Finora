import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @RequirePermission('users:read')
  @Get('users')
  @ApiOperation({ summary: 'List users (pagination, search, role filter)' })
  list(@Query() query: ListUsersQueryDto) {
    return this.adminUsers.list(query);
  }

  @RequirePermission('users:export')
  @Get('users/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="users.csv"')
  @ApiOperation({ summary: 'Export users as CSV' })
  exportCsv() {
    return this.adminUsers.exportCsv();
  }

  @RequirePermission('users:read')
  @Get('users/:id')
  @ApiOperation({ summary: 'Get one user' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsers.findOne(id);
  }

  @RequirePermission('users:create')
  @Post('users')
  @ApiOperation({ summary: 'Create a user (a verification email is sent)' })
  create(@Body() dto: CreateUserDto) {
    return this.adminUsers.create(dto);
  }

@RequirePermission('users:edit')
@Patch('users/:id')
@ApiOperation({ summary: 'Edit a user — name, date of birth, email, or password' })
update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminUpdateUserDto) {
  return this.adminUsers.update(id, dto);
}

  @RequirePermission('roles:manage')
  @Patch('users/:id/role')
  @ApiOperation({ summary: "Change a user's role" })
  changeRole(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminUsers.changeRole(user, id, dto.role);
  }

  @RequirePermission('users:delete')
  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsers.remove(user, id);
  }
  @RequirePermission('users:read')
  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats for the admin area' })
  getStats() {
    return this.adminUsers.getStats();
  }
  @RequirePermission('roles:manage')
  @Get('roles')
  @ApiOperation({ summary: 'List roles with their permissions (code + label)' })
  listRoles() {
    return this.adminUsers.listRoles();
  }
}
