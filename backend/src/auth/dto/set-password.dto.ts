import { IsString, MinLength, MaxLength } from 'class-validator';
import { IsValidPassword } from '../../common/validators/is-valid-password.decorator';

export class SetPasswordDto {
  @IsString()
  @MinLength(8)
  @IsValidPassword()
  newPassword!: string;
}