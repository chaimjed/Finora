import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class UpdateRecurringDto {
  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @IsPositive()
  amount?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ nullable: true, description: 'null removes the category' })
  @IsOptional() @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'null removes the end date' })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD' })
  endDate?: string | null;
}