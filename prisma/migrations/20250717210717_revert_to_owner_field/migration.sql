/*
  Warnings:

  - You are about to drop the column `name` on the `apikey` table. All the data in the column will be lost.
  - Added the required column `owner` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `apikey` DROP COLUMN `name`,
    ADD COLUMN `owner` VARCHAR(191) NOT NULL;
