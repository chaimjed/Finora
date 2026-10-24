import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Search in email, first name and last name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ example: 'ADMIN', description: 'Filter by role name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  @ApiPropertyOptional({ enum: ['all', 'verified', 'unverified'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'verified', 'unverified'])
  status?: 'all' | 'verified' | 'unverified';

  @ApiPropertyOptional({ enum: ['all', 'google', 'password'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'google', 'password'])
  provider?: 'all' | 'google' | 'password';

  @ApiPropertyOptional({ enum: ['createdAt', 'firstName', 'lastName', 'email'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'firstName', 'lastName', 'email'])
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}