export function ScenarioSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between text-sm text-slate-700">
        {label}
        <span className="font-mono tabular-nums">{value}%</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        className="w-full accent-[#1F6FB5]"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
