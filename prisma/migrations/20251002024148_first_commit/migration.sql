-- CreateTable
CREATE TABLE "payment_configs" (
    "id" SERIAL NOT NULL,
    "business_id" TEXT NOT NULL,
    "payment_provider" TEXT NOT NULL,
    "secret_values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_configs_payment_provider_key" ON "payment_configs"("payment_provider");

-- CreateIndex
CREATE INDEX "payment_configs_business_id_idx" ON "payment_configs"("business_id");
