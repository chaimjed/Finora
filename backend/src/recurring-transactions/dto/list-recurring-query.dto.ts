import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RecurringStatus } from '../../../generated/prisma/enums';

export class ListRecurringQueryDto {
  @ApiPropertyOptional({ enum: RecurringStatus }) @IsOptional() @IsEnum(RecurringStatus)
  status?: RecurringStatus;
}