import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean, IsDateString, IsEmail, IsOptional, IsString, MaxLength, MinLength,
} from 'class-validator';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ example: 'Chaima' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Eljed' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '2001-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'new-email@example.com', description: 'Only processed if different from the current email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NewPassword123', minLength: 8, maxLength: 72, description: 'Leave empty to keep the current password' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Only relevant if email changes. true: send a verification link to the new address (unverified until confirmed). false: mark the new email verified immediately.',
  })
  @IsOptional()
  @IsBoolean()
  sendVerificationEmail?: boolean;
}