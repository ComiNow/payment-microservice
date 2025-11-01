/*
  Warnings:

  - A unique constraint covering the columns `[business_id]` on the table `payment_configs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments"."payment_configs_payment_provider_key";

-- CreateIndex
CREATE UNIQUE INDEX "payment_configs_business_id_key" ON "payment_configs"("business_id");
