/*
  Warnings:

  - A unique constraint covering the columns `[keyHash]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "keyHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
