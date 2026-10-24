import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export class DashboardQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01', description: 'YYYY-MM-DD. Defaults to the first day of the current month' })
  @IsOptional() @Matches(DAY, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'YYYY-MM-DD, inclusive. Defaults to the last day of the current month' })
  @IsOptional() @Matches(DAY, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}

export class CashflowQueryDto extends DashboardQueryDto {
  @ApiPropertyOptional({ enum: ['day', 'month'], description: 'Auto: day up to 62 days, month beyond' })
  @IsOptional() @IsIn(['day', 'month'])
  granularity?: 'day' | 'month';
}