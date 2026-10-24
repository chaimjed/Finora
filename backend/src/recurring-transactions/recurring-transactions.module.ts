import { Module } from "@nestjs/common";
import { TransactionsModule } from "../transactions/transactions.module";
import { RecurringTransactionsController } from "./recurring-transactions.controller";
import { RecurringTransactionsService } from "./recurring-transactions.service";
import { RecurringProcessorService } from "./recurring-processor.service";

@Module({
  imports: [TransactionsModule], 
  controllers: [RecurringTransactionsController],
  providers: [RecurringTransactionsService, RecurringProcessorService],
  exports: [RecurringProcessorService],
})
export class RecurringTransactionsModule {}