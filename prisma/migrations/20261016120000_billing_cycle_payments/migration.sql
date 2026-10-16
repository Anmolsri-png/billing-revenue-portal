-- CreateTable
CREATE TABLE "BillingCyclePayment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "billingCycleId" UUID NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingCyclePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingCyclePayment_billingCycleId_idx" ON "BillingCyclePayment"("billingCycleId");

-- CreateIndex
CREATE INDEX "BillingCyclePayment_receivedDate_idx" ON "BillingCyclePayment"("receivedDate");

-- AddForeignKey
ALTER TABLE "BillingCyclePayment" ADD CONSTRAINT "BillingCyclePayment_billingCycleId_fkey" FOREIGN KEY ("billingCycleId") REFERENCES "BillingCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep existing single receipt dates as one payment so the dashboard stays unchanged until more dates are added.
INSERT INTO "BillingCyclePayment" ("id", "billingCycleId", "receivedDate", "amount", "createdAt")
SELECT gen_random_uuid(), "id", "paymentReceivedDate", "collectedAmount", CURRENT_TIMESTAMP
FROM "BillingCycle"
WHERE "paymentReceivedDate" IS NOT NULL
  AND "collectedAmount" IS NOT NULL
  AND "collectedAmount" <> 0;
