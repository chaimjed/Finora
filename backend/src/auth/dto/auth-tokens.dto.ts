import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT, expires in 15 min' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT, expires in 7 days, rotated on each refresh' })
  refreshToken!: string;
}