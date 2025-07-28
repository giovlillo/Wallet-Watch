/*
  Warnings:

  - You are about to drop the column `name` on the `apikey` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `apikey` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `apikey` table. All the data in the column will be lost.
  - Added the required column `owner` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tier` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `apikey` DROP COLUMN `name`,
    DROP COLUMN `permissions`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `lastResetDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `owner` VARCHAR(191) NOT NULL,
    ADD COLUMN `tier` ENUM('UNLIMITED', 'LIMITED') NOT NULL,
    ADD COLUMN `usageCount` INTEGER NOT NULL DEFAULT 0;
