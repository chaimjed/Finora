import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiConflictResponse, ApiNotFoundResponse, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ListAccountsQueryDto } from './dto/list-accounts-query.dto';

@ApiTags('Accounts')
@ApiBearerAuth('access-token')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an account (wallet)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my accounts (ACTIVE by default)' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListAccountsQueryDto) {
    return this.accountsService.findAll(user.sub, query.status ?? 'ACTIVE');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my accounts' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update name, type or notes' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(user.sub, id, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive an account' })
  archive(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.archive(user.sub, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore an archived account' })
  restore(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.restore(user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an account (only if it has no transactions)' })
  @ApiConflictResponse({ description: 'Account is in use — archive it instead' })
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.accountsService.remove(user.sub, id);
  }
}