/*
  Warnings:

  - You are about to alter the column `createdAt` on the `timezonetest` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `updatedAt` on the `timezonetest` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `timezonetest` MODIFY `createdAt` DATETIME NOT NULL DEFAULT NOW(),
    MODIFY `updatedAt` DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW();

-- CreateTable
CREATE TABLE `AppRelease` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `version` VARCHAR(191) NOT NULL,
    `buildId` VARCHAR(191) NOT NULL,
    `releasedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `forceUpdate` BOOLEAN NOT NULL DEFAULT false,
    `message` TEXT NULL,

    UNIQUE INDEX `AppRelease_version_key`(`version`),
    UNIQUE INDEX `AppRelease_buildId_key`(`buildId`),
    INDEX `AppRelease_releasedAt_idx`(`releasedAt`),
    INDEX `AppRelease_version_idx`(`version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
