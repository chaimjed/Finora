import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum, IsISO4217CurrencyCode, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength,
} from 'class-validator';
import { AccountType } from '../../../generated/prisma/client';

const MAX_AMOUNT = 999_999_999_999.999; 

export class CreateAccountDto {
  @ApiProperty({ example: 'Main bank account' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.BANK })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiPropertyOptional({
    example: 'TND',
    description: "ISO 4217 code. Defaults to the user's preferred currency. Cannot be changed later.",
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsISO4217CurrencyCode()
  currency?: string;

  @ApiPropertyOptional({
    example: 1250.5,
    description: 'Opening balance. Negative allowed (e.g. credit card debt). Default 0.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(-MAX_AMOUNT)
  @Max(MAX_AMOUNT)
  initialBalance?: number;

  @ApiPropertyOptional({ example: 'Salary lands here' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}