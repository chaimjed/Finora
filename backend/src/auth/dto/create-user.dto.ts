import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RegisterDto } from '../../auth/dto/register.dto';

export class CreateUserDto extends RegisterDto {
  @ApiPropertyOptional({ example: 'USER', default: 'USER', description: 'Role name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  role?: string;
}