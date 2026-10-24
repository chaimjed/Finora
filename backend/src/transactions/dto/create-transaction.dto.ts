import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateIf,
} from 'class-validator';
import { TransactionType } from '../../../generated/prisma/client';

const MAX_AMOUNT = 999_999_999_999.999;

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ description: 'Source account — debited for EXPENSE/TRANSFER, credited for INCOME' })
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'Destination account — required for TRANSFER, forbidden otherwise' })
  @ValidateIf((o) => o.type === TransactionType.TRANSFER)
  @IsUUID()
  relatedAccountId?: string;

  @ApiPropertyOptional({ description: 'Forbidden for TRANSFER' })
  @ValidateIf((o) => o.type !== TransactionType.TRANSFER)
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 42.5, description: 'Always positive — the sign is implied by type' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(MAX_AMOUNT)
  amount!: number;

  @ApiPropertyOptional({ description: 'Amount credited to the destination account, in its own currency. Required for cross-currency TRANSFER (or provide exchangeRate instead).' })
  @ValidateIf((o) => o.type === TransactionType.TRANSFER)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(MAX_AMOUNT)
  destinationAmount?: number;

  @ApiPropertyOptional({ description: 'Exchange rate used, source currency -> destination currency' })
  @ValidateIf((o) => o.type === TransactionType.TRANSFER)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.00000001)
  @Max(9_999_999_999)
  exchangeRate?: number;

  @ApiProperty({ example: '2026-10-07' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: 'Monthly groceries' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}