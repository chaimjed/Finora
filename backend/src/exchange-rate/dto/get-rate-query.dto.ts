import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO4217CurrencyCode } from 'class-validator';

const upper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class GetRateQueryDto {
  @ApiProperty({ example: 'TND' })
  @Transform(upper)
  @IsISO4217CurrencyCode()
  from!: string;

  @ApiProperty({ example: 'EUR' })
  @Transform(upper)
  @IsISO4217CurrencyCode()
  to!: string;
}