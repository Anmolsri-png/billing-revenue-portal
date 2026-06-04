"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Layers3,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import {
  getBillingStatusDetails,
  getRevenueDashboardSummary,
  type RevenueDashboardSummary,
} from "@/lib/actions/dashboard";
import { cn } from "@/lib/utils";

import { MonthlyBillingChartCard } from "../dashboard/monthly-billing-chart";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Filters = {
  company: string;
  customer: string;
  startDate?: Date;
  endDate?: Date;
  month: string;
  year: string;
};

type CompanyOption = {
  id: string;
  name: string;
};

type CustomerOption = {
  id: string;
  name: string;
};

type RevenueDetail = {
  id?: string | number | null;
  period?: string | null;
  customerName?: string | null;
  companyName?: string | null;
  poNumber?: string | null;
  scope?: string | null;
  amount?: number | string | null;
  collectedAmount?: number | string | null;
  overdueAmount?: number | string | null;
  serviceType?: string | null;
  billingPlan?: string | null;
  contractDuration?: string | null;
  status?: string | null;
};

type PurchaseOrderDashboardProps = {
  companies: CompanyOption[];
  customers: CustomerOption[];
};

const financialYearMonths = [
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

const now = new Date();
const currentFY =
  now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();

const years = Array.from(
  { length: currentFY - 2009 },
  (_, index) => currentFY - index,
);

function getDefaultFilters(): Filters {
  return {
    company: "all",
    customer: "all",
    startDate: undefined,
    endDate: undefined,
    month: "all",
    year: currentFY.toString(),
  };
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function formatFinancialYearLabel(year: string) {
  if (!year || year === "all") return "All Financial Years";

  const numericYear = Number(year);

  if (Number.isNaN(numericYear)) return year;

  return `FY ${numericYear}-${String(numericYear + 1).slice(-2)}`;
}

function getMonthDisplay(month: string) {
  if (month === "all") return "All Months";

  return financialYearMonths[Number(month)] ?? "Selected Month";
}

function getActiveFilterSummary(filters: Filters) {
  const parts = [formatFinancialYearLabel(filters.year)];

  if (filters.month !== "all") {
    parts.push(financialYearMonths[Number(filters.month)] ?? "Selected Month");
  }

  if (filters.company !== "all") {
    parts.push("Company filter");
  }

  if (filters.customer !== "all") {
    parts.push("Customer filter");
  }

  return parts.join(" / ");
}

function getStatusBadgeTone(status?: string | null) {
  const normalized = status?.toLowerCase() ?? "";

  if (normalized.includes("active") || normalized.includes("running")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized.includes("pending") || normalized.includes("draft")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    normalized.includes("expired") ||
    normalized.includes("inactive") ||
    normalized.includes("closed") ||
    normalized.includes("cancel")
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function TopBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-40 h-px bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400" />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {children}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function MetricCard({
  description,
  label,
  value,
  icon: Icon,
  tone,
  suffix,
  monthLabel,
  yearLabel,
}: {
  description: string;
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone: string;
  suffix?: string;
  monthLabel?: string;
  yearLabel?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={cn(
          "absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20",
          tone,
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xm font-bold tracking-tight text-slate-700">
              {label}
            </p>
            {monthLabel || yearLabel ? (
              <div className="flex items-center gap-1">
                {monthLabel ? (
                  <span className="rounded-full border border-blue-900 bg-blue-900 px-2.5 py-1 text-[11px] font-bold text-white">
                    {monthLabel}
                  </span>
                ) : null}

                {monthLabel && yearLabel ? (
                  <span className="text-xs font-bold text-slate-500">/</span>
                ) : null}

                {yearLabel ? (
                  <span className="rounded-full border border-blue-900 bg-blue-900 px-2.5 py-1 text-[11px] font-bold text-white">
                    {yearLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="font-mono text-lg font-semibold tracking-tight text-slate-950 tabular-nums sm:text-xl">
              {value}
            </p>
            {suffix ? (
              <span className="text-xs font-semibold text-slate-400">
                {suffix}
              </span>
            ) : null}
          </div>
          <p className="text-xs leading-5 text-slate-400">{description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div
            className={cn(
              "rounded-2xl border p-3 shadow-sm",
              tone.replace("bg-", "border-").replace("500", "200"),
              tone.replace("bg-", "bg-").replace("500", "50"),
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                tone.replace("bg-", "text-").replace("500", "600"),
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const PurchaseOrderDashboard = ({
  companies,
  customers,
}: PurchaseOrderDashboardProps) => {
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filters, setFilters] = useState<Filters>(getDefaultFilters);
  const [revenueDetails, setRevenueDetails] = useState<RevenueDetail[]>([]);
  const [summary, setSummary] = useState<RevenueDashboardSummary>({
    totalRevenueProjected: 0,
    totalRevenueTillNow: 0,
    dueForBillingTillNow: 0,
    collectedAmountTillNow: 0,
    pendingCollectionTillNow: 0,
    collectionEfficiency: 0,
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(getDefaultFilters());
  };

  useEffect(() => {
    let active = true;

    async function loadRevenueDetails() {
      setLoading(true);

      try {
        const selectedYear =
          filters.year === "all" ? undefined : Number(filters.year);
        const [data, dashboardSummary] = await Promise.all([
          getBillingStatusDetails(selectedYear, filters),
          getRevenueDashboardSummary(selectedYear, filters),
        ]);

        if (!active) return;

        setRevenueDetails(data ?? []);
        setSummary(dashboardSummary);
        setLastUpdated(new Date());
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRevenueDetails();

    return () => {
      active = false;
    };
  }, [filters]);

  useEffect(() => {
    setPageIndex(0);
  }, [filters]);

  useEffect(() => {
    setPageIndex((prev) =>
      Math.min(
        prev,
        Math.max(0, Math.ceil(revenueDetails.length / pageSize) - 1),
      ),
    );
  }, [pageSize, revenueDetails.length]);

  if (!hydrated) return null;

  const filteredStats = revenueDetails.reduce(
    (acc, item) => {
      acc.totalBilledAmount += toNumber(item.amount);
      acc.totalCollectedAmount += toNumber(item.collectedAmount);
      acc.totalOverdueAmount += toNumber(item.overdueAmount);

      return acc;
    },
    {
      totalBilledAmount: 0,
      totalCollectedAmount: 0,
      totalOverdueAmount: 0,
    },
  );

  const activeFilterCount = [
    filters.company !== "all",
    filters.customer !== "all",
    filters.month !== "all",
    filters.year !== currentFY.toString(),
    Boolean(filters.startDate),
    Boolean(filters.endDate),
  ].filter(Boolean).length;
  const metricMonthLabel = getMonthDisplay(filters.month);
  const metricYearLabel = formatFinancialYearLabel(filters.year);

  const metrics = [
    {
      label: "Total Revenue Projected",
      description: "Combined billed revenue across the selected financial year",
      value: formatCurrency(summary.totalRevenueProjected),
      icon: IndianRupee,
      monthLabel: "Full Year",
      tone: "bg-violet-500",
    },
    {
      label: "Total Revenue Till Now",
      description: "Billed revenue recorded till the current financial month",
      value: formatCurrency(summary.totalRevenueTillNow),
      icon: IndianRupee,
      monthLabel: metricMonthLabel,
      tone: "bg-sky-500",
    },
    {
      label: "Due for Billing Till Now",
      description:
        "Billing amount pending invoice generation after the billing date",
      value: formatCurrency(summary.dueForBillingTillNow),
      icon: CalendarIcon,
      monthLabel: metricMonthLabel,
      tone: "bg-amber-500",
    },
    {
      label: "Collected Amount Till Now",
      description: "Payments already received for billed revenue",
      value: formatCurrency(summary.collectedAmountTillNow),
      icon: TrendingUp,
      monthLabel: metricMonthLabel,
      tone: "bg-emerald-500",
    },
    {
      label: "Due For Collection Till Now",
      description: "Outstanding amount still pending collection",
      value: formatCurrency(summary.pendingCollectionTillNow),
      icon: TrendingDown,
      monthLabel: metricMonthLabel,
      tone: "bg-rose-500",
    },
    {
      label: "Collection Efficiency",
      description: "Collected share of the billed amount",
      value: formatNumber(summary.collectionEfficiency),
      suffix: "%",
      icon: Layers3,
      monthLabel: metricMonthLabel,
      tone: "bg-cyan-500",
    },
    {
      label: "Billing Records",
      description: "Total billing records in the current view",
      value: formatNumber(revenueDetails.length),
      icon: Layers3,
      monthLabel: metricMonthLabel,
      tone: "bg-indigo-500",
    },
  ];

  const totalPages = Math.max(1, Math.ceil(revenueDetails.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const startRow = safePageIndex * pageSize;
  const endRow = startRow + pageSize;
  const paginatedRevenueDetails = revenueDetails.slice(startRow, endRow);
  const visibleStart = revenueDetails.length === 0 ? 0 : startRow + 1;
  const visibleEnd = Math.min(endRow, revenueDetails.length);

  return (
    <>
      <style>{`
        .revenue-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .revenue-scroll::-webkit-scrollbar-track { background: transparent; }
        .revenue-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
      `}</style>

      <TopBar />

      <div className="min-h-screen space-y-6 bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(135deg,_#ffffff,_#f8fbff_55%,_#eef5ff)] px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-700">
                  Revenue Intelligence
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Revenue Dashboard
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                  Track billed revenue, collections, overdue amounts, and
                  billing performance with the same reporting experience used
                  across the P&amp;L dashboard.
                </p>
              </div>

              <div className="flex flex-col items-start gap-2 lg:items-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  {getActiveFilterSummary(filters)}
                </div>
                <p className="text-xs font-medium tracking-wide text-slate-400">
                  {lastUpdated
                    ? `Last refreshed ${format(
                        lastUpdated,
                        "dd MMM yyyy, hh:mm a",
                      )}`
                    : "Waiting for first refresh"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setFiltersOpen((value) => !value)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50 sm:px-7"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-500">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Filters</p>
                <p className="text-xs text-slate-500">
                  Refine by company, customer, date, month, and year
                </p>
              </div>

              {activeFilterCount > 0 ? (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </div>

            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform duration-200",
                filtersOpen && "rotate-180",
              )}
            />
          </button>

          {filtersOpen ? (
            <div className="border-t border-slate-100 px-6 py-6 sm:px-7">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7 2xl:items-end">
                <div className="min-w-0 space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Company
                  </Label>
                  <Select
                    value={filters.company}
                    onValueChange={(value) => updateFilter("company", value)}
                  >
                    <SelectTrigger className="h-10 w-full min-w-0 rounded-2xl border-slate-200 bg-slate-50 text-sm">
                      <SelectValue placeholder="All Companies" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={String(company.id)}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Customer
                  </Label>
                  <Select
                    value={filters.customer}
                    onValueChange={(value) => updateFilter("customer", value)}
                  >
                    <SelectTrigger className="h-10 w-full min-w-0 rounded-2xl border-slate-200 bg-slate-50 text-sm">
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    From Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-full min-w-0 justify-start overflow-hidden rounded-2xl border-slate-200 bg-slate-50 text-left text-sm font-normal text-slate-700"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                        {filters.startDate
                          ? format(filters.startDate, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      avoidCollisions={false}
                      className="w-auto rounded-2xl p-0"
                      side="bottom"
                      sideOffset={8}
                    >
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => updateFilter("startDate", date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="min-w-0 space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    To Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-full min-w-0 justify-start overflow-hidden rounded-2xl border-slate-200 bg-slate-50 text-left text-sm font-normal text-slate-700"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                        {filters.endDate
                          ? format(filters.endDate, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      avoidCollisions={false}
                      className="w-auto rounded-2xl p-0"
                      side="bottom"
                      sideOffset={8}
                    >
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => updateFilter("endDate", date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="min-w-0 space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Month
                  </Label>
                  <Select
                    value={filters.month}
                    onValueChange={(value) => updateFilter("month", value)}
                  >
                    <SelectTrigger className="h-10 w-full min-w-0 rounded-2xl border-slate-200 bg-slate-50 text-sm">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">All Months</SelectItem>
                      {financialYearMonths.map((month, index) => (
                        <SelectItem key={month} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Year
                  </Label>
                  <Select
                    value={filters.year}
                    onValueChange={(value) => updateFilter("year", value)}
                  >
                    <SelectTrigger className="h-10 w-full min-w-0 rounded-2xl border-slate-200 bg-slate-50 text-sm">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {formatFinancialYearLabel(year.toString())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="h-10 w-full rounded-2xl border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reset Filters
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-full border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-bold text-white">
                  Viewing {revenueDetails.length} records
                </div>

                <div className="rounded-full border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-bold text-white">
                  Period: {getMonthDisplay(filters.month)}
                </div>

                <div className="rounded-full border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-bold text-white">
                  Year: {formatFinancialYearLabel(filters.year)}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <SectionLabel>Key metrics</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                description={metric.description}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                tone={metric.tone}
                suffix={metric.suffix}
                monthLabel={metric.monthLabel}
                yearLabel={metricYearLabel}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionLabel>Revenue details</SectionLabel>
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Revenue Breakdown
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Purchase-order level billing, collection, and pending amount
                  overview for the active filters.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs font-medium">
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  {formatNumber(revenueDetails.length)} records
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  {formatCurrency(filteredStats.totalOverdueAmount)} pending
                </span>
              </div>
            </div>

            <div className="overflow-x-auto revenue-scroll">
              <table className="min-w-[1560px] w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-100">
                    {[
                      "Period",
                      "Customer",
                      "Company",
                      "PO Number",
                      "Scope of Work",
                      "Billed Amount",
                      "Amount Received",
                      "Amount Pending",
                      "Service Type",
                      "Billing Plan",
                      "Contract Duration",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {revenueDetails.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-5 py-14 text-center text-sm font-medium text-slate-400"
                      >
                        {loading
                          ? "Loading revenue data..."
                          : "No revenue records found for the selected filters."}
                      </td>
                    </tr>
                  ) : (
                    paginatedRevenueDetails.map((item, index) => {
                      const rowIndex = startRow + index;
                      const pendingAmount = Math.max(
                        toNumber(item.overdueAmount) ||
                          toNumber(item.amount) -
                            toNumber(item.collectedAmount),
                        0,
                      );

                      return (
                        <tr
                          key={item.id ?? `${item.poNumber}-${rowIndex}`}
                          className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 font-mono text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                            {item.period || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700">
                            {item.customerName || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {item.companyName || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                            {item.poNumber || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            <div className="max-w-[280px] whitespace-normal break-words">
                              {item.scope || "-"}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono text-sm text-slate-700 tabular-nums">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-5 py-4 font-mono text-sm text-slate-700 tabular-nums">
                            {formatCurrency(item.collectedAmount)}
                          </td>
                          <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-950 tabular-nums">
                            {formatCurrency(pendingAmount)}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.serviceType || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.billingPlan || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.contractDuration || "-"}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                getStatusBadgeTone(item.status),
                              )}
                            >
                              {item.status || "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="text-sm text-slate-500">
                Showing {visibleStart}-{visibleEnd} of {revenueDetails.length}{" "}
                records
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Rows
                  </Label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-[88px] rounded-2xl border-slate-200 bg-slate-50 text-sm">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {[10, 20, 30, 50].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-start">
                  <span className="text-sm font-medium text-slate-600">
                    Page {safePageIndex + 1} of {totalPages}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-2xl border-slate-200"
                      onClick={() =>
                        setPageIndex((prev) => Math.max(prev - 1, 0))
                      }
                      disabled={safePageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-2xl border-slate-200"
                      onClick={() =>
                        setPageIndex((prev) =>
                          Math.min(prev + 1, totalPages - 1),
                        )
                      }
                      disabled={safePageIndex >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next page</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionLabel>Monthly trends</SectionLabel>
          <MonthlyBillingChartCard filters={filters} />
        </section>
      </div>
    </>
  );
};

export default PurchaseOrderDashboard;
