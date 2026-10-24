import { ExchangeRateModule } from "../exchange-rate/exchange-rate.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SpendingService } from "./spending.service";
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, ExchangeRateModule],
  providers: [SpendingService],
  exports: [SpendingService],
})
export class SpendingModule {}