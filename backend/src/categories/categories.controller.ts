import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

@Post()
@ApiOperation({ summary: 'Create a custom category or subcategory (send parentId)' })
@ApiConflictResponse({ description: 'A category with this name already exists here' })
create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
  return this.categoriesService.create(user.sub, dto);
}

@Get()
@ApiOperation({ summary: 'List categories (system + mine), flat or as a tree' })
findAll(@CurrentUser() user: JwtPayload, @Query() query: ListCategoriesQueryDto) {
  return this.categoriesService.findAll(
    user.sub,
    query.type,
    query.status ?? 'ACTIVE',
    query.tree ?? false,
  );
}

  @Get(':id')
  @ApiOperation({ summary: 'Get one category' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a custom category' })
  @ApiForbiddenResponse({ description: 'System categories cannot be modified' })
  update(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(user.sub, id, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a custom category' })
  archive(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.archive(user.sub, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore an archived custom category' })
  restore(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.restore(user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a custom category (only if unused)' })
  @ApiConflictResponse({ description: 'Category is in use — archive it instead' })
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(user.sub, id);
  }
}