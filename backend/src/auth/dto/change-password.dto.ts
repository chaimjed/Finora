import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidPassword } from '../../common/validators/is-valid-password.decorator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsValidPassword()
  currentPassword!: string;

  @ApiProperty({ example: 'nouveauPassword456', minLength: 8 })
  @MinLength(8)
  @IsValidPassword()
  newPassword!: string;

  @ApiProperty({ example: 'nouveauPassword456', minLength: 8 })
  @MinLength(8)
  @IsValidPassword()
  confirmNewPassword!: string;
}