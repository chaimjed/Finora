import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CashflowQueryDto, DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Balance, income vs expenses, category spending, recent transactions, budgets, recurring and goals' })
  summary(@CurrentUser() user: JwtPayload, @Query() query: DashboardQueryDto) {
    return this.dashboardService.summary(user.sub, query);
  }

  @Get('cashflow')
  @ApiOperation({ summary: 'Income and expenses over time (chart data)' })
  cashflow(@CurrentUser() user: JwtPayload, @Query() query: CashflowQueryDto) {
    return this.dashboardService.cashflow(user.sub, query);
  }
}