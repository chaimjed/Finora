/*
  Warnings:

  - You are about to alter the column `amount` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,3)`.

*/
-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `destinationAmount` DECIMAL(15, 3) NULL,
    ADD COLUMN `exchangeRate` DECIMAL(18, 8) NULL,
    MODIFY `amount` DECIMAL(15, 3) NOT NULL,
    MODIFY `notes` TEXT NULL;
