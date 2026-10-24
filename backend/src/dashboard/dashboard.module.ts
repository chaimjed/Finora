import { Module } from "@nestjs/common";
import { SpendingModule } from "../spending/spending.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { BudgetModule } from "../budget/budgets.module";

@Module({
  imports: [SpendingModule, BudgetModule], 
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}