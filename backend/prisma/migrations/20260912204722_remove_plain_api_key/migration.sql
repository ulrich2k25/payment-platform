/*
  Warnings:

  - You are about to drop the column `key` on the `ApiKey` table. All the data in the column will be lost.
  - Made the column `keyHash` on table `ApiKey` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ApiKey_key_key";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "key",
ALTER COLUMN "keyHash" SET NOT NULL;
