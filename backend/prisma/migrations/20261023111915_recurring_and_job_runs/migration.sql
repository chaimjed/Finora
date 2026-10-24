/*
  Warnings:

  - You are about to alter the column `amount` on the `budget` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,3)`.
  - You are about to alter the column `amount` on the `recurringtransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,3)`.

*/
-- AlterTable
ALTER TABLE `budget` MODIFY `amount` DECIMAL(15, 3) NOT NULL;

-- AlterTable
ALTER TABLE `recurringtransaction` ADD COLUMN `consecutiveFailures` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastError` VARCHAR(500) NULL,
    ADD COLUMN `lastExecutionDate` DATE NULL,
    MODIFY `amount` DECIMAL(15, 3) NOT NULL,
    MODIFY `startDate` DATE NOT NULL,
    MODIFY `endDate` DATE NULL,
    MODIFY `nextExecutionDate` DATE NOT NULL;

-- CreateTable
CREATE TABLE `JobRun` (
    `id` VARCHAR(191) NOT NULL,
    `jobName` VARCHAR(191) NOT NULL,
    `status` ENUM('SUCCESS', 'PARTIAL', 'FAILED') NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `finishedAt` DATETIME(3) NOT NULL,
    `processed` INTEGER NOT NULL DEFAULT 0,
    `succeeded` INTEGER NOT NULL DEFAULT 0,
    `failed` INTEGER NOT NULL DEFAULT 0,
    `details` JSON NULL,
    `error` TEXT NULL,

    INDEX `JobRun_jobName_startedAt_idx`(`jobName`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `RecurringTransaction_status_nextExecutionDate_idx` ON `RecurringTransaction`(`status`, `nextExecutionDate`);
