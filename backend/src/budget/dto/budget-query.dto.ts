import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class BudgetQueryDto {
  @ApiPropertyOptional({ example: '2026-10', description: 'YYYY-MM, defaults to the current month' })
  @IsOptional() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be YYYY-MM' })
  month?: string;
}

export class CopyBudgetsDto {
  @ApiPropertyOptional({ example: '2026-11', description: 'Target month. Budgets are copied from the month before it.' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be YYYY-MM' })
  month!: string;
}