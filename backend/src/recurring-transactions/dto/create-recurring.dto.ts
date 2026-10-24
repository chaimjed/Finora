import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches, Max, MaxLength, Min,
} from 'class-validator';
import { RecurringFrequency, TransactionType } from '../../../generated/prisma/enums';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export class CreateRecurringDto {
  @ApiProperty({ enum: TransactionType }) @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty() @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'Destination account (transfers only)' })
  @IsOptional() @IsUUID()
  relatedAccountId?: string;

  @ApiPropertyOptional({ description: 'Income/expense only. Must match the type.' })
  @IsOptional() @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 600 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @IsPositive()
  amount!: number;

  @ApiProperty({ enum: RecurringFrequency }) @IsEnum(RecurringFrequency)
  frequency!: RecurringFrequency;

  @ApiPropertyOptional({ example: 1, description: 'Every N days/weeks/months/years (default 1)' })
  @IsOptional() @IsInt() @Min(1) @Max(365)
  intervalCount?: number;

  @ApiProperty({ example: '2026-11-01', description: 'YYYY-MM-DD, today or later' })
  @Matches(DAY, { message: 'startDate must be YYYY-MM-DD' })
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-11-01' })
  @IsOptional() @Matches(DAY, { message: 'endDate must be YYYY-MM-DD' })
  endDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  description?: string;
}