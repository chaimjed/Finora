import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'ADMIN', description: 'Role name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  role!: string;
}