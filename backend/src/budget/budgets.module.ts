import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { SpendingModule } from '../spending/spending.module';

@Module({
  imports: [SpendingModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetModule {}
