import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf,
} from 'class-validator';
import { CategoryType } from '../../../generated/prisma/client';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fuel' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({
    description: 'Parent category id. If set, the type is inherited from the parent.',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ enum: CategoryType, example: CategoryType.EXPENSE })
  @ValidateIf((o: CreateCategoryDto) => !o.parentId)
  @IsEnum(CategoryType)
  type?: CategoryType;
}