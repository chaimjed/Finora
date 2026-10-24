import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class UpdateBudgetDto {
  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @IsPositive()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(1) @Max(100)
  warningThresholdPercent?: number;
}