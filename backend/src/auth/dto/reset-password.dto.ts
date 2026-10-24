import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidPassword } from '../../common/validators/is-valid-password.decorator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'le-token-reçu-par-email' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'nouveauPassword123', minLength: 8 })
  @MinLength(8)
  @IsValidPassword()
  newPassword!: string;

  @ApiProperty({ example: 'nouveauPassword123', minLength: 8 })
  @MinLength(8)
  @IsValidPassword()

  confirmNewPassword!: string;
}