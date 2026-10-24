import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

const MAX_AMOUNT = 999_999_999_999.999; 

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(MAX_AMOUNT)
  amount?: number;

  @ApiPropertyOptional({ description: 'Transfers only — amount credited to the destination account' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(MAX_AMOUNT)
  destinationAmount?: number;

  @ApiPropertyOptional({ description: 'Transfers only — rate used, source → destination currency' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.00000001)
  @Max(9_999_999_999)
  exchangeRate?: number;

  @ApiPropertyOptional({ example: '2026-10-07' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ nullable: true, description: 'null clears the description' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'null removes the category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}