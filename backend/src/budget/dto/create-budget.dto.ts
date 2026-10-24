import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, IsUUID, Matches, Max, Min } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty() @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: 500 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @IsPositive()
  amount!: number;

  @ApiProperty({ example: '2026-10', description: 'YYYY-MM' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be YYYY-MM' })
  month!: string;

  @ApiPropertyOptional({ example: 80, description: 'Warning threshold in % (default 80)' })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  warningThresholdPercent?: number;
}