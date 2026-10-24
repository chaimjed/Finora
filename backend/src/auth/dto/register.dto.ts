import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsDateString } from 'class-validator';
import { IsValidPassword } from '../../common/validators/is-valid-password.decorator';
import { MinAge } from '../../common/validators/min-age.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'Chaima' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'eljed' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ example: 'chaima@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '2001-01-01', description: 'Minimum age: 12 years' })
  @IsDateString()
  @MinAge(12)
  dateOfBirth!: string;

  @ApiProperty({
    example: 'StrongPass123',
    minLength: 8,
    maxLength: 72,
    description: 'At least 8 characters with a lowercase letter, an uppercase letter and a number',
  })
  @IsValidPassword()
  @MaxLength(72)
  password!: string;
}