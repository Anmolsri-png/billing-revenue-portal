import { efficiencyTone, formatPercent } from "@/lib/revenue-metrics";

const stroke: Record<string, string> = {
  bad: "#e11d48",
  warn: "#d97706",
  good: "#059669",
};

export function GaugeCard({
  label,
  value,
  target,
}: {
  label: string;
  value: number;
  target?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone = efficiencyTone(clamped);
  const length = Math.PI * 50;
  const dash = (clamped / 100) * length;

  return (
    <article className="rounded-md border border-[#e4e8ee] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
      <div className="mt-2 flex items-center gap-4">
        <svg viewBox="0 0 120 72" className="h-24 w-36" role="img" aria-label={`${label} ${formatPercent(clamped)}`}>
          <path
            d="M10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={stroke[tone]}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${length}`}
          />
          {typeof target === "number" ? (
            <circle
              cx={60 + Math.cos(Math.PI * (1 - target / 100)) * 50}
              cy={60 - Math.sin(Math.PI * (1 - target / 100)) * 50}
              r="3"
              fill="#0f2744"
            />
          ) : null}
        </svg>
        <div>
          <p className="font-mono text-3xl font-semibold tabular-nums text-slate-950">
            {formatPercent(clamped)}
          </p>
          <p className="text-xs text-slate-500">
            {tone === "good" ? "Above 80%" : tone === "warn" ? "50–80%" : "Below 50%"}
            {typeof target === "number" ? ` · target ${target}%` : ""}
          </p>
        </div>
      </div>
    </article>
  );
}
