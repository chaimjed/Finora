// recurring-transactions.controller.ts
import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { RecurringProcessorService } from './recurring-processor.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { ListRecurringQueryDto } from './dto/list-recurring-query.dto';

@ApiTags('Recurring transactions')
@ApiBearerAuth('access-token')
@Controller('recurring-transactions')
export class RecurringTransactionsController {
  constructor(
    private readonly service: RecurringTransactionsService,
    private readonly processor: RecurringProcessorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a recurring rule' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRecurringDto) {
    return this.service.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my recurring rules' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListRecurringQueryDto) {
    return this.service.findAll(user.sub, query);
  }

  @Post('process-due')
  @HttpCode(200)
  @ApiOperation({ summary: 'Process my due rules now (same idempotent logic as the cron job)' })
  processDue(@CurrentUser() user: JwtPayload) {
    return this.processor.processDue({ userId: user.sub });
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update amount, description, category or end date' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringDto,
  ) {
    return this.service.update(user.sub, id, dto);
  }

  @Patch(':id/pause')
  pause(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.pause(user.sub, id);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume a paused rule (missed occurrences are skipped)' })
  resume(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.resume(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a rule (generated transactions are kept)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(user.sub, id);
  }
}