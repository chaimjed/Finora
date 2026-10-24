import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiConflictResponse, ApiNotFoundResponse, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { BudgetQueryDto, CopyBudgetsDto } from './dto/budget-query.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@ApiTags('Budgets')
@ApiBearerAuth('access-token')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'List budgets of a month with spent, remaining, % used and state' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: BudgetQueryDto) {
    return this.budgetsService.findAll(user.sub, query.month);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one budget with its status' })
  @ApiNotFoundResponse({ description: 'Budget not found' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.budgetsService.findOne(user.sub, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a monthly budget for an expense category' })
  @ApiConflictResponse({ description: 'A budget already exists for this category and month' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(user.sub, dto);
  }

  @Post('copy-previous')
  @HttpCode(200)
  @ApiOperation({ summary: 'Copy the previous month budgets into the given month' })
  copyPrevious(@CurrentUser() user: JwtPayload, @Body() dto: CopyBudgetsDto) {
    return this.budgetsService.copyFromPrevious(user.sub, dto.month);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update amount or warning threshold' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a budget' })
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.budgetsService.remove(user.sub, id);
  }
}