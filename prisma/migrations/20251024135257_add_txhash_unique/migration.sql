/*
  Warnings:

  - A unique constraint covering the columns `[txHash]` on the table `Transfer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transfer_txHash_key" ON "Transfer"("txHash");
