"use client";

import { X } from "lucide-react";

import { formatCount } from "@/lib/revenue-metrics";

export function FilterChips({
  chips,
  count,
  onReset,
}: {
  chips: Array<{ id: string; label: string; onRemove: () => void }>;
  count: number;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-md border border-[#e4e8ee] bg-[#f7f8fa] px-2 py-1 text-xs font-medium text-[#1c2430] hover:bg-white"
        >
          {chip.label}
          <X className="size-3" aria-hidden="true" />
          <span className="sr-only">Remove {chip.label}</span>
        </button>
      ))}
      <span className="text-xs font-medium text-[#667085]" aria-live="polite">
        {formatCount(count)} records
      </span>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-[#e4e8ee] bg-white px-2 py-1 text-xs font-semibold text-[#1c2430] hover:bg-[#f7f8fa]"
      >
        Reset filters
      </button>
    </div>
  );
}
