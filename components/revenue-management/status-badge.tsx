import { efficiencyLabel, efficiencyTone, type StatusTone } from "@/lib/revenue-metrics";
import { cn } from "@/lib/utils";

const toneClass: Record<StatusTone, string> = {
  bad: "border-rose-200 bg-rose-50 text-rose-800",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function StatusBadge({
  value,
  label,
}: {
  value?: number;
  label?: string;
}) {
  const tone = typeof value === "number" ? efficiencyTone(value) : "warn";
  const text = label ?? (typeof value === "number" ? efficiencyLabel(value) : "Unknown");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        toneClass[tone],
      )}
    >
      <span className="sr-only">Status: </span>
      {text}
    </span>
  );
}
