"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { matchingPreset, type PeriodMode } from "@/lib/dashboard-presets";
import type { DashboardFilters } from "@/lib/revenue-metrics";
import { cn } from "@/lib/utils";

const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const quarters = [
  { value: "1", label: "Q1 · Apr–Jun" },
  { value: "2", label: "Q2 · Jul–Sep" },
  { value: "3", label: "Q3 · Oct–Dec" },
  { value: "4", label: "Q4 · Jan–Mar" },
];
const presets = [
  ["month", "This Month"],
  ["quarter", "This Quarter"],
  ["fy", "This FY"],
  ["last-fy", "Last FY"],
] as const;

export function SlicerFields({
  filters,
  companies,
  customers,
  years,
  statuses,
  status,
  onStatus,
  onChange,
  onPreset,
  periodMode,
  collapsed = false,
  onToggle,
}: {
  filters: DashboardFilters;
  companies: Array<{ id: string; name: string }>;
  customers: Array<{ id: string; name: string }>;
  years: number[];
  statuses: string[];
  status: string;
  onStatus: (value: string) => void;
  onChange: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  onPreset: (preset: "month" | "quarter" | "fy" | "last-fy") => void;
  periodMode: PeriodMode;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const active = matchingPreset(filters, new Date());
  const periodLabel =
    periodMode === "dates"
      ? "Custom dates override month and quarter."
      : periodMode === "month"
        ? "Month is the active period."
        : periodMode === "quarter"
          ? "Quarter is the active period."
          : "Financial year is the active period.";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map(([preset, label]) => (
          <Button
            key={preset}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={active === preset}
            className={cn(
              "h-8",
              active === preset && "border-[#1F6FB5] bg-[#e8f3fb] text-[#1F6FB5] hover:bg-[#e8f3fb]",
            )}
            onClick={() => onPreset(preset)}
          >
            {label}
          </Button>
        ))}
        {onToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-8 text-[#667085]"
            aria-expanded={!collapsed}
            onClick={onToggle}
          >
            <ChevronDown className={cn("transition-transform", collapsed ? "" : "rotate-180")} />
            {collapsed ? "Show filters" : "Hide filters"}
          </Button>
        ) : null}
      </div>
      {collapsed ? null : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Field label="Financial Year">
            <Select value={filters.year} onValueChange={(value) => onChange("year", value)}>
              <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    FY {year}–{String(year + 1).slice(-2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Quarter">
            <Select value={filters.quarter} onValueChange={(value) => onChange("quarter", value)}>
              <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All quarters</SelectItem>
                {quarters.map((quarter) => (
                  <SelectItem key={quarter.value} value={quarter.value}>{quarter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Month">
            <Select value={filters.month} onValueChange={(value) => onChange("month", value)}>
              <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {months.map((month, index) => (
                  <SelectItem key={month} value={String(index)}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Company">
            <Select value={filters.company} onValueChange={(value) => onChange("company", value)}>
              <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Customer">
            <Select value={filters.customer} onValueChange={(value) => onChange("customer", value)}>
              <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Billing Status">
            <Select value={status} onValueChange={onStatus}>
              <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DateField label="From Date" value={filters.startDate} onChange={(date) => onChange("startDate", date)} />
          <DateField label="To Date" value={filters.endDate} onChange={(date) => onChange("endDate", date)} />
        </div>
      )}
      <p className="text-[11px] text-[#667085]">{periodLabel} Billing status applies to totals, rankings, and tables.</p>
    </div>
  );
}

export function SlicerBar(props: React.ComponentProps<typeof SlicerFields>) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className="hidden md:block">
        <SlicerFields
          {...props}
          collapsed={!open}
          onToggle={() => setOpen((value) => !value)}
        />
      </div>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <SlidersHorizontal />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              <SlicerFields {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-[#667085]">{label}</Label>
      {children}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Date;
  onChange: (value?: Date) => void;
}) {
  return (
    <Field label={label}>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full justify-start px-2 font-normal">
            <CalendarIcon />
            <span className="truncate">{value ? format(value, "dd MMM yyyy") : "Any date"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
