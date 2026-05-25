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
  scope: string;
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
  scope: string;
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

const BUSINESS_TIME_ZONE = "Asia/Kolkata";
const BUSINESS_TIME_ZONE_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const businessDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getBusinessDateParts(date: Date) {
  const parts = businessDateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return {
    year,
    monthIndex: month - 1,
    day,
  };
}

function createBusinessDate(
  year: number,
  monthIndex: number,
  day: number,
  endOfDay = false,
) {
  return new Date(
    Date.UTC(
      year,
      monthIndex,
      day,
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0,
    ) - BUSINESS_TIME_ZONE_OFFSET_MS,
  );
}

function normalizeDate(date: Date) {
  const { year, monthIndex, day } = getBusinessDateParts(date);
  return createBusinessDate(year, monthIndex, day);
}

function normalizeEndOfDate(date: Date) {
  const { year, monthIndex, day } = getBusinessDateParts(date);
  return createBusinessDate(year, monthIndex, day, true);
}

function getCurrentFinancialYear(date = new Date()) {
  const { year, monthIndex } = getBusinessDateParts(date);
  return monthIndex < 3 ? year - 1 : year;
}

function getFinancialYearRange(year: number) {
  const start = createBusinessDate(year, 3, 1);
  const end = createBusinessDate(year + 1, 2, 31, true);

  return { start, end };
}

function getFinancialMonth(date: Date) {
  const { monthIndex } = getBusinessDateParts(date);
  return (monthIndex + 9) % 12;
}

function getFinancialYearForDate(date: Date) {
  const { year, monthIndex } = getBusinessDateParts(date);
  return monthIndex < 3 ? year - 1 : year;
}

function getBusinessCalendarYear(date: Date) {
  return getBusinessDateParts(date).year;
}

function getBusinessMonthLabel(date: Date) {
  return MONTHS[getFinancialMonth(date)];
}

function formatFinancialYearLabel(year: number) {
  return `FY ${year}-${String(year + 1).slice(-2)}`;
}

function getFinancialMonthRange(financialYear: number, monthIndex: number) {
  const calendarMonth = monthIndex <= 8 ? monthIndex + 3 : monthIndex - 9;

  const calendarYear = monthIndex <= 8 ? financialYear : financialYear + 1;

  const lastDayOfMonth = new Date(
    Date.UTC(calendarYear, calendarMonth + 1, 0),
  ).getUTCDate();

  const start = createBusinessDate(calendarYear, calendarMonth, 1);
  const end = createBusinessDate(
    calendarYear,
    calendarMonth,
    lastDayOfMonth,
    true,
  );

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
    | "collectedAmount"
  >,
): Date | null {
  // Priority 1: Use actual payment received date if recorded
  if (cycle.paymentReceivedDate) {
    return cycle.paymentReceivedDate;
  }

  // Priority 2: If marked as received (YES) but no date recorded,
  // use invoice/billing date as reference for fiscal year mapping
  if (cycle.paymentReceived === PaymentReceived.YES) {
    return cycle.invoiceDate ?? cycle.billingSubmittedDate ?? null;
  }

  return null;
}

function hasRecordedPayment(
  cycle: Pick<
    BillingCycleWithPurchaseOrder,
    "paymentReceived" | "paymentReceivedDate" | "collectedAmount"
  >,
) {
  return (
    cycle.paymentReceived === PaymentReceived.YES ||
    Boolean(cycle.paymentReceivedDate) ||
    Number(cycle.collectedAmount || 0) > 0
  );
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
    const endDate = normalizeEndOfDate(new Date(filters.endDate));

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
    if (hasRecordedPayment(cycle)) {
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
      scope: cycle.purchaseOrder?.scope?.trim() || "-",
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

      if (params.series === "payment" && !hasRecordedPayment(cycle)) {
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

        month: getBusinessMonthLabel(seriesDate || new Date()),

        year: getBusinessCalendarYear(seriesDate || new Date()),

        companyName: cycle.purchaseOrder?.company?.name || "-",

        customerName: getCustomerDisplayName(cycle.purchaseOrder?.customer),

        poNumber: cycle.purchaseOrder?.customerPONumber || "-",

        scope: cycle.purchaseOrder?.scope?.trim() || "-",

        invoiceNumber: cycle.invoiceNumber || "-",

        billedAmount,

        paymentReceived,

        pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
      };
    });
}
