"use server";

import { prisma } from "../prisma";
import { purchaseOrderSchema } from "../validators";
import { formatError } from "../utils";
import { PurchaseOrder } from "@/types";
import { PaymentReceived, Prisma } from "@prisma/client";
import { generatePurchaseOrderBillingCycles } from "../billing-cycle-utils";

// ================= DATE HELPER =================
const toLocalDate = (date?: string | Date | null): Date | undefined => {
  if (!date) return undefined;
  return new Date(typeof date === "string" ? `${date}T00:00:00` : date);
};

const emptyToUndefined = (value?: string | null) => {
  if (typeof value !== "string") return value ?? undefined;

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const resolveBillingSubmittedDate = (billingCycle?: {
  billingSubmittedDate?: string | Date | null;
  invoiceDate?: string | Date | null;
}) => {
  return toLocalDate(
    billingCycle?.invoiceDate ?? billingCycle?.billingSubmittedDate,
  );
};

const resolvePaymentDueDate = (billingCycle?: {
  billingSubmittedDate?: string | Date | null;
  invoiceDate?: string | Date | null;
  paymentDueDate?: string | Date | null;
}) => {
  return toLocalDate(
    billingCycle?.paymentDueDate ??
      billingCycle?.invoiceDate ??
      billingCycle?.billingSubmittedDate,
  );
};

// ================= GET ALL =================
export async function getPurchaseOrders() {
  try {
    const data = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        billingPlan: true,
        ServiceType: true,
        contractDuration: true,
        contract: true,
        customer: true,
        billingCycles: true,
        company: true,
        vendor: true,
      },
    });

    return { success: true, data };
  } catch (error) {
    return { success: false, data: [], message: formatError(error) };
  }
}

// ================= CREATE =================
export async function createPurchaseOrder(data: PurchaseOrder) {
  try {
    const validated = purchaseOrderSchema.parse(data);
    const billingPlanId = emptyToUndefined(validated.billingPlanId);
    const billingPlan =
      billingPlanId
        ? await prisma.billingPlan.findUnique({
            where: { id: billingPlanId },
          })
        : null;

    if (billingPlanId && !billingPlan) {
      throw new Error("Billing Plan not found");
    }

    const generatedCycles =
      billingPlan &&
      !validated.billingCycles?.length &&
      validated.startFrom
        ? generatePurchaseOrderBillingCycles({
            startDate: new Date(validated.startFrom),
            endDate: validated.endDate ? new Date(validated.endDate) : null,
            totalBillingCycles: billingPlan.totalBillingCycles,
            planName: billingPlan.name,
            type: billingPlan.billingCycleType as "START" | "MID" | "END",
          })
        : [];
    const generatedInvoiceAmount =
      generatedCycles.length > 0
        ? Math.round(((validated.poAmount ?? 0) / generatedCycles.length) * 100) / 100
        : 0;
    const billingCycles =
      generatedCycles.length > 0
        ? generatedCycles.map((cycle) => ({
          invoiceNumber: "",
          invoiceAmount: generatedInvoiceAmount,
          collectedAmount: 0,
          invoiceDate: cycle.invoiceDate,
          billingSubmittedDate: resolveBillingSubmittedDate(cycle),
          paymentReceivedDate: null,
          paymentDueDate: resolvePaymentDueDate(cycle),
          paymentReceived: PaymentReceived.NO,
          billingRemark: "",
          tds: new Prisma.Decimal(0),
        }))
        : validated.billingCycles.map((bc) => ({
          invoiceNumber: bc.invoiceNumber ?? "",
          invoiceAmount: bc.invoiceAmount ?? 0,
          collectedAmount: bc.collectedAmount ?? 0,
          invoiceDate: toLocalDate(bc.invoiceDate),
          billingSubmittedDate: resolveBillingSubmittedDate(bc),
          paymentReceivedDate: toLocalDate(bc.paymentReceivedDate),
          paymentDueDate: resolvePaymentDueDate(bc),
          paymentReceived: bc.paymentReceived,
          billingRemark: bc.billingRemark ?? "",
          tds: new Prisma.Decimal(bc.tds ?? 0),
        }));

    const purchaseOrderData: Prisma.PurchaseOrderUncheckedCreateInput = {
      customerPONumber: emptyToUndefined(validated.customerPONumber) ?? null,
      poAmount: validated.poAmount ?? null,
      serviceTypeId: emptyToUndefined(validated.serviceTypeId) ?? null,
      contractDurationId:
        emptyToUndefined(validated.contractDurationId) ?? null,
      contractId: emptyToUndefined(validated.contractId) ?? null,
      startFrom: toLocalDate(validated.startFrom) ?? null,
      endDate: toLocalDate(validated.endDate) ?? null,
      companyId: emptyToUndefined(validated.companyId) ?? null,
      vendorId: emptyToUndefined(validated.vendorId) ?? null,
      paymentTerms: emptyToUndefined(validated.paymentTerms) ?? null,
      customerId: emptyToUndefined(validated.customerId) ?? null,
      billingPlanId: billingPlanId ?? null,
      poOwner: emptyToUndefined(validated.poOwner) ?? null,
      purchaseOrderType: validated.purchaseOrderType ?? null,
      status: validated.status,
      ageingDays: validated.ageingDays?.toString() ?? null,
      remark: validated.remark ?? null,
      scope: emptyToUndefined(validated.scope) ?? null,
      billingCycles: {
        create: billingCycles,
      },
    };

    await prisma.purchaseOrder.create({
      data: purchaseOrderData,
    });

    return { success: true, message: "Purchase Order created successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// ================= GET BY ID =================
export async function getPurchaseOrderById(id: string) {
  try {
    const data = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        ServiceType: true,
        billingPlan: true,
        contractDuration: true,
        contract: true,
        customer: true,
        billingCycles: true,
        company: true,
        vendor: true,
      },
    });

    if (!data) return { success: false };

    return { success: true, data };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// ================= UPDATE =================
export async function updatePurchaseOrder(
  data: PurchaseOrder,
  id: string
) {
  try {
    const validated = purchaseOrderSchema.parse(data);
    const billingPlanId = emptyToUndefined(validated.billingPlanId);

    const purchaseOrderData: Prisma.PurchaseOrderUncheckedUpdateInput = {
      customerPONumber: emptyToUndefined(validated.customerPONumber) ?? null,
      poAmount: validated.poAmount ?? null,
      serviceTypeId: emptyToUndefined(validated.serviceTypeId) ?? null,
      contractDurationId:
        emptyToUndefined(validated.contractDurationId) ?? null,
      contractId: emptyToUndefined(validated.contractId) ?? null,
      startFrom: toLocalDate(validated.startFrom) ?? null,
      endDate: toLocalDate(validated.endDate) ?? null,
      companyId: emptyToUndefined(validated.companyId) ?? null,
      vendorId: emptyToUndefined(validated.vendorId) ?? null,
      paymentTerms: emptyToUndefined(validated.paymentTerms) ?? null,
      customerId: emptyToUndefined(validated.customerId) ?? null,
      billingPlanId: billingPlanId ?? null,
      poOwner: emptyToUndefined(validated.poOwner) ?? null,
      purchaseOrderType: validated.purchaseOrderType ?? null,
      status: validated.status,
      ageingDays: validated.ageingDays?.toString() ?? null,
      remark: validated.remark ?? null,
      scope: emptyToUndefined(validated.scope) ?? null,
      billingCycles: {
        deleteMany: {},
        create:
          validated.billingCycles?.map((bc) => ({
            invoiceNumber: bc.invoiceNumber ?? "",
            invoiceAmount: bc.invoiceAmount ?? 0,
            collectedAmount: bc.collectedAmount ?? 0,
            invoiceDate: toLocalDate(bc.invoiceDate),
            billingSubmittedDate: resolveBillingSubmittedDate(bc),
            paymentReceivedDate: toLocalDate(bc.paymentReceivedDate),
            paymentDueDate: resolvePaymentDueDate(bc),
            paymentReceived: bc.paymentReceived,
            billingRemark: bc.billingRemark ?? "",
            tds: new Prisma.Decimal(bc.tds ?? 0),
          })) ?? [],
      },
    };

    await prisma.purchaseOrder.update({
      where: { id },
      data: purchaseOrderData,
    });

    return { success: true, message: "Purchase Order updated successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// ================= DELETE =================
export async function deletePurchaseOrder(id: string) {
  try {
    await prisma.$transaction([
      prisma.billingCycle.deleteMany({
        where: { purchaseOrderId: id },
      }),
      prisma.purchaseOrder.delete({
        where: { id },
      }),
    ]);

    return {
      success: true,
      message: "Purchase Order deleted successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// ================= GET BILLING CYCLES =================
export async function getBillingCyclesByPOID(id: string) {
  try {
    const data = await prisma.billingCycle.findMany({
      where: { purchaseOrderId: id },
      orderBy: { billingSubmittedDate: "asc" },
    });

    return {
      success: true,
      data,
      message: "Billing Cycles fetched successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
