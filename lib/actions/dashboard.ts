"use server";

import { format } from "date-fns";
import { PaymentReceived, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface DashboardStats {
  billCount: number;
  billingThisMonth: number;
  totalBilledAmount: number;
  totalCollectedAmount: number;
  totalOverdueAmount: number;
  collectionEfficiency: number;
  currentMonth: string;
}

interface BillingStatusFilters {
  company?: string;
  startDate?: Date;
  endDate?: Date;
  month?: string;
}

type GroupedRevenueDetail = {
  id: string;
  customerName: string;
  companyId: string | null;
  companyName: string;
  poNumber: string;
  amount: number;
  collectedAmount: number;
  overdueAmount: number;
  serviceType: string;
  billingPlan: string;
  contractDuration: string;
  period: string;
  status: string;
};

type RevenueSeries = "billing" | "payment";

type RevenueMonthDetailsParams = {
  month: number;
  year: number;
  series: RevenueSeries;
};

type BillingCycleWithPurchaseOrder = Prisma.BillingCycleGetPayload<{
  include: {
    purchaseOrder: {
      include: {
        ServiceType: true;
        billingPlan: true;
        company: true;
        contractDuration: true;
        customer: true;
      };
    };
  };
}>;

type CustomerRecord = BillingCycleWithPurchaseOrder["purchaseOrder"]["customer"];
type CompanyFilterCycle = {
  purchaseOrder?: {
    company?: {
      id?: string | null;
    } | null;
  } | null;
};

export type RevenueMonthDetail = {
  id: string;
  month: string;
  year: number;
  companyName: string;
  customerName: string;
  poNumber: string;
  invoiceNumber: string;
  billedAmount: number;
  paymentReceived: number;
  pendingAmount: number;
};

const MONTHS = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

function normalizeDate(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getCurrentFinancialYear(date = new Date()) {
  return date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear();
}

function getFinancialYearRange(year: number) {
  const start = new Date(year, 3, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year + 1, 2, 31, 23, 59, 59, 999);

  return { start, end };
}

function getFinancialMonth(date: Date) {
  return (date.getMonth() + 9) % 12;
}

function getFinancialYearForDate(date: Date) {
  return date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear();
}

function formatFinancialYearLabel(year: number) {
  return `FY ${year}-${String(year + 1).slice(-2)}`;
}

function getFinancialMonthRange(financialYear: number, monthIndex: number) {
  const calendarMonth = monthIndex <= 8 ? monthIndex + 3 : monthIndex - 9;

  const calendarYear = monthIndex <= 8 ? financialYear : financialYear + 1;

  const start = new Date(calendarYear, calendarMonth, 1);

  start.setHours(0, 0, 0, 0);

  const end = new Date(calendarYear, calendarMonth + 1, 0, 23, 59, 59, 999);

  return {
    start,
    end,
  };
}

function getInvoiceDate(
  cycle: Pick<
    BillingCycleWithPurchaseOrder,
    "invoiceDate" | "billingSubmittedDate"
  >,
): Date | null {
  return cycle.invoiceDate ?? cycle.billingSubmittedDate ?? null;
}

function getDueForBillingDate(
  cycle: Pick<
    BillingCycleWithPurchaseOrder,
    "billingSubmittedDate" | "invoiceDate"
  >,
): Date | null {
  return cycle.billingSubmittedDate ?? cycle.invoiceDate ?? null;
}


function getPaymentDate(
  cycle: Pick<
    BillingCycleWithPurchaseOrder,
    | "paymentReceived"
    | "paymentReceivedDate"
    | "invoiceDate"
    | "billingSubmittedDate"
  >,
): Date | null {
  if (cycle.paymentReceived === PaymentReceived.YES) {
    return (
      cycle.paymentReceivedDate ??
      cycle.invoiceDate ??
      cycle.billingSubmittedDate ??
      null
    );
  }

  return null;
}

/**
 * IMPORTANT:
 * If status YES but collectedAmount missing,
 * use invoiceAmount as fallback.
 */
function getEffectiveCollectedAmount(
  cycle: Pick<
    BillingCycleWithPurchaseOrder,
    "paymentReceived" | "collectedAmount" | "invoiceAmount"
  >,
) {
  const collected = Number(cycle.collectedAmount || 0);

  if (cycle.paymentReceived === PaymentReceived.YES && collected <= 0) {
    return Number(cycle.invoiceAmount || 0);
  }

  return collected;
}

function matchesCompanyFilter(
  cycle: CompanyFilterCycle,
  filters?: BillingStatusFilters,
) {
  if (!filters?.company || filters.company === "all") {
    return true;
  }

  return String(cycle.purchaseOrder?.company?.id) === filters.company;
}

function matchesFilterMonth(date: Date, filters?: BillingStatusFilters) {
  if (!filters?.month || filters.month === "all") {
    return true;
  }

  return getFinancialMonth(date) === Number(filters.month);
}

function isWithinFilterDateRange(date: Date, filters?: BillingStatusFilters) {
  if (filters?.startDate) {
    const startDate = normalizeDate(new Date(filters.startDate));

    if (date < startDate) {
      return false;
    }
  }

  if (filters?.endDate) {
    const endDate = new Date(filters.endDate);

    endDate.setHours(23, 59, 59, 999);

    if (date > endDate) {
      return false;
    }
  }

  return true;
}

function getCustomerDisplayName(customer?: CustomerRecord | null) {
  if (!customer) return "-";

  if (customer.companyName?.trim()) {
    return customer.companyName;
  }

  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || customer.customerCode || "-";
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const currentFY = getCurrentFinancialYear();

  const { start, end } = getFinancialYearRange(currentFY);

  const currentMonth = getFinancialMonth(new Date());

  const cycles = await prisma.billingCycle.findMany();

  let billCount = 0;
  let totalBilledAmount = 0;
  let totalCollectedAmount = 0;
  let totalOverdueAmount = 0;
  let billingThisMonth = 0;
  let collectedThisMonth = 0;

  for (const cycle of cycles) {
    const invoiceDate = getInvoiceDate(cycle);

    if (!invoiceDate) continue;

    const normalizedDate = normalizeDate(invoiceDate);

    if (normalizedDate < start || normalizedDate > end) {
      continue;
    }

    const billed = Number(cycle.invoiceAmount || 0);

    const collected = getEffectiveCollectedAmount(cycle);

    totalBilledAmount += billed;
    totalCollectedAmount += collected;

    billCount++;

    if (getFinancialMonth(normalizedDate) === currentMonth) {
      billingThisMonth += billed;
      collectedThisMonth += collected;
    }

    const pending = Math.max(billed - collected, 0);

    if (cycle.paymentDueDate && pending > 0) {
      const dueDate = normalizeDate(cycle.paymentDueDate);

      if (dueDate < normalizeDate(new Date())) {
        totalOverdueAmount += pending;
      }
    }
  }

  return {
    billCount,
    billingThisMonth,
    totalBilledAmount,
    totalCollectedAmount,
    totalOverdueAmount,
    collectionEfficiency:
      billingThisMonth > 0
        ? Number(((collectedThisMonth / billingThisMonth) * 100).toFixed(2))
        : 0,
    currentMonth: format(new Date(), "MMM"),
  };
}

export async function getMonthlyBillingData(
  year: number,
  filters?: BillingStatusFilters,
) {
  const { start, end } = getFinancialYearRange(year);

  const currentDate = new Date();

  const currentFY = getCurrentFinancialYear(currentDate);

  const currentFYMonth = getFinancialMonth(currentDate);

  const today = normalizeDate(new Date());

  const cycles = await prisma.billingCycle.findMany({
    where: {
      ...(filters?.company &&
        filters.company !== "all" && {
          purchaseOrder: {
            companyId: filters.company,
          },
        }),
    },
  });

  const data = MONTHS.map((month, index) => ({
    month,
    billing: 0,
    payment: 0,
    overdue: 0,
    index,
  }));

  for (const cycle of cycles) {
    const billed = Number(cycle.invoiceAmount || 0);

    const collected = getEffectiveCollectedAmount(cycle);

    const invoiceDate = getInvoiceDate(cycle);

    if (invoiceDate) {
      const normalizedInvoiceDate = normalizeDate(invoiceDate);

      const fyMonth = getFinancialMonth(normalizedInvoiceDate);

      const isFutureMonth = year === currentFY && fyMonth > currentFYMonth;

      if (
        !isFutureMonth &&
        normalizedInvoiceDate >= start &&
        normalizedInvoiceDate <= end &&
        isWithinFilterDateRange(normalizedInvoiceDate, filters) &&
        matchesFilterMonth(normalizedInvoiceDate, filters)
      ) {
        data[fyMonth].billing += billed;

        const pending = Math.max(billed - collected, 0);

        if (cycle.paymentDueDate && pending > 0) {
          const dueDate = normalizeDate(cycle.paymentDueDate);

          if (dueDate < today) {
            data[fyMonth].overdue += pending;
          }
        }
      }
    }
    if (cycle.paymentReceived === PaymentReceived.YES) {
      const paymentDate = getPaymentDate(cycle);

      if (paymentDate && collected > 0) {
        const normalizedPaymentDate = normalizeDate(paymentDate);

        const fyMonth = getFinancialMonth(normalizedPaymentDate);
        const isFutureMonth = year === currentFY && fyMonth > currentFYMonth;

        if (
          !isFutureMonth &&
          normalizedPaymentDate >= start &&
          normalizedPaymentDate <= end &&
          isWithinFilterDateRange(normalizedPaymentDate, filters) &&
          matchesFilterMonth(normalizedPaymentDate, filters)
        ) {
          data[fyMonth].payment += collected;
        }
      }
    }
  }

  if (year === currentFY) {
    data.forEach((item) => {
      if (item.index > currentFYMonth) {
        item.billing = 0;
        item.payment = 0;
        item.overdue = 0;
      }
    });
  }

  return data;
}

export async function getDueForBillingAmount(
  year?: number,
  filters?: BillingStatusFilters,
) {
  const cycles = await prisma.billingCycle.findMany({
    where: {
      ...(filters?.company &&
        filters.company !== "all" && {
          purchaseOrder: {
            companyId: filters.company,
          },
        }),
    },
    select: {
      billingSubmittedDate: true,
      invoiceDate: true,
      invoiceAmount: true,
      invoiceNumber: true,
      purchaseOrder: {
        select: {
          company: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  let totalDueForBilling = 0;

  for (const cycle of cycles) {
    const dueForBillingDate = getDueForBillingDate(cycle);

    if (!dueForBillingDate) {
      continue;
    }

    if (cycle.invoiceNumber?.trim()) {
      continue;
    }

    const normalizedBillingDate = normalizeDate(dueForBillingDate);

    if (typeof year === "number") {
      const fyRange = getFinancialYearRange(year);

      if (
        normalizedBillingDate < fyRange.start ||
        normalizedBillingDate > fyRange.end
      ) {
        continue;
      }
    }

    if (!matchesCompanyFilter(cycle, filters)) {
      continue;
    }

    if (!isWithinFilterDateRange(normalizedBillingDate, filters)) {
      continue;
    }

    if (!matchesFilterMonth(normalizedBillingDate, filters)) {
      continue;
    }

    totalDueForBilling += Number(cycle.invoiceAmount || 0);
  }

  return totalDueForBilling;
}

export async function getBillingStatusDetails(
  year?: number,
  filters?: BillingStatusFilters,
) {
  const cycles = await prisma.billingCycle.findMany({
    include: {
      purchaseOrder: {
        include: {
          ServiceType: true,
          billingPlan: true,
          company: true,
          contractDuration: true,
          customer: true,
        },
      },
    },
  });

  const groupedRecords = new Map<string, GroupedRevenueDetail>();

  for (const cycle of cycles) {
    const invoiceDate = getInvoiceDate(cycle);

    if (!invoiceDate) {
      continue;
    }

    const normalizedDate = normalizeDate(invoiceDate);

    if (typeof year === "number") {
      const fyRange = getFinancialYearRange(year);

      if (normalizedDate < fyRange.start || normalizedDate > fyRange.end) {
        continue;
      }
    }

    if (!matchesCompanyFilter(cycle, filters)) {
      continue;
    }

    if (!isWithinFilterDateRange(normalizedDate, filters)) {
      continue;
    }

    if (!matchesFilterMonth(normalizedDate, filters)) {
      continue;
    }

    const billed = Number(cycle.invoiceAmount || 0);
    const collected = getEffectiveCollectedAmount(cycle);
    const overdue = Math.max(billed - collected, 0);
    const financialYear = getFinancialYearForDate(normalizedDate);
    const financialMonth = getFinancialMonth(normalizedDate);
    const shouldSplitByMonth =
      Boolean(filters?.month) && filters?.month !== "all";
    const period = shouldSplitByMonth
      ? `${MONTHS[financialMonth]} · ${formatFinancialYearLabel(financialYear)}`
      : formatFinancialYearLabel(financialYear);
    const groupKey = shouldSplitByMonth
      ? `${cycle.purchaseOrderId}-${financialYear}-${financialMonth}`
      : `${cycle.purchaseOrderId}-${financialYear}`;
    const configuredDurationMonths =
      cycle.purchaseOrder?.contractDuration?.totalNumberOfMonths;
    const contractDuration =
      typeof configuredDurationMonths === "number" &&
      configuredDurationMonths > 0
        ? `${configuredDurationMonths} months`
        : cycle.purchaseOrder?.contractDuration?.name || "-";
    const existing = groupedRecords.get(groupKey);

    if (existing) {
      existing.amount += billed;
      existing.collectedAmount += collected;
      existing.overdueAmount += overdue;
      continue;
    }

    groupedRecords.set(groupKey, {
      id: groupKey,
      customerName: getCustomerDisplayName(cycle.purchaseOrder?.customer),
      companyId: cycle.purchaseOrder?.company?.id || null,
      companyName: cycle.purchaseOrder?.company?.name || "-",
      poNumber: cycle.purchaseOrder?.customerPONumber || "-",
      amount: billed,
      collectedAmount: collected,
      overdueAmount: overdue,
      serviceType: cycle.purchaseOrder?.ServiceType?.name || "-",
      billingPlan: cycle.purchaseOrder?.billingPlan?.name || "-",
      contractDuration,
      period,
      status: cycle.purchaseOrder?.status || "-",
    });
  }

  return Array.from(groupedRecords.values()).sort((a, b) => {
    const periodCompare = b.period.localeCompare(a.period);

    if (periodCompare !== 0) {
      return periodCompare;
    }

    const companyCompare = a.companyName.localeCompare(b.companyName);

    if (companyCompare !== 0) {
      return companyCompare;
    }

    return a.poNumber.localeCompare(b.poNumber);
  });
}

export async function getRevenueDetailsByMonth(
  params: RevenueMonthDetailsParams,
  filters?: BillingStatusFilters,
): Promise<RevenueMonthDetail[]> {
  const { start, end } = getFinancialMonthRange(params.year, params.month);

  const cycles = await prisma.billingCycle.findMany({
    where: {
      ...(filters?.company &&
        filters.company !== "all" && {
          purchaseOrder: {
            companyId: filters.company,
          },
        }),
    },
    include: {
      purchaseOrder: {
        include: {
          company: true,
          customer: true,
        },
      },
    },
  });

  return cycles
    .filter((cycle) => {
      const seriesDate =
        params.series === "payment"
          ? getPaymentDate(cycle)
          : getInvoiceDate(cycle);

      if (!seriesDate) {
        return false;
      }

      const normalizedDate = normalizeDate(seriesDate);

      if (normalizedDate < start || normalizedDate > end) {
        return false;
      }

      if (!matchesCompanyFilter(cycle, filters)) {
        return false;
      }

      if (!isWithinFilterDateRange(normalizedDate, filters)) {
        return false;
      }

      if (
        params.series === "payment" &&
        cycle.paymentReceived !== PaymentReceived.YES
      ) {
        return false;
      }

      return true;
    })
    .map((cycle) => {
      const billedAmount = Number(cycle.invoiceAmount || 0);

      const paymentReceived = getEffectiveCollectedAmount(cycle);

      const pendingAmount = billedAmount - paymentReceived;

      const seriesDate =
        params.series === "payment"
          ? getPaymentDate(cycle)
          : getInvoiceDate(cycle);

      return {
        id: cycle.id,

        month: format(seriesDate || new Date(), "MMM"),

        year: new Date(seriesDate || new Date()).getFullYear(),

        companyName: cycle.purchaseOrder?.company?.name || "-",

        customerName: getCustomerDisplayName(cycle.purchaseOrder?.customer),

        poNumber: cycle.purchaseOrder?.customerPONumber || "-",

        invoiceNumber: cycle.invoiceNumber || "-",

        billedAmount,

        paymentReceived,

        pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
      };
    });
}
