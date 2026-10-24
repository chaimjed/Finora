import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { TransactionType } from '../../../generated/prisma/client';

export class ListTransactionsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Matches transactions where this account is source OR destination' })
  @IsOptional() @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional() @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional() @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional() @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search in description' })
  @IsOptional() @IsString() @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
  default: true,
  description: 'When filtering by a parent category, also include its subcategories',
})
@IsOptional()
@Transform(({ value }) =>
  value === undefined ? undefined : value === true || value === 'true',
)@IsBoolean()
includeSubcategories?: boolean;
}