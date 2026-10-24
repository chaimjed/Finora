import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@RequirePermission('roles:manage') 
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List roles with their permissions' })
  list() {
    return this.rolesService.list();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all available permissions (code + label)' })
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one role' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }



  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role (must have no users assigned)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Replace the full permission set of a role' })
  setPermissions(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignPermissionsDto) {
    return this.rolesService.setPermissions(id, dto.permissionCodes);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Add permissions to a role (keeps existing ones)' })
  addPermissions(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignPermissionsDto) {
    return this.rolesService.addPermissions(id, dto.permissionCodes);
  }

  @Delete(':id/permissions/:code')
  @ApiOperation({ summary: 'Remove one permission from a role' })
  removePermission(@Param('id', ParseUUIDPipe) id: string, @Param('code') code: string) {
    return this.rolesService.removePermission(id, code);
  }
}