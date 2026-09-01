"use client";

export function CycleProgressRing({
  daysElapsed,
  totalDays,
  mode,
}: {
  daysElapsed: number;
  totalDays: number;
  mode: string;
}) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const pct = mode === "locked" ? 1 : Math.min(1, daysElapsed / totalDays);
  const offset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-3 border border-teal/40 rounded-lg p-3.5 bg-teal/10">
      <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0 -rotate-90">
        <circle cx="32" cy="32" r={radius} stroke="#0E4749" strokeWidth="6" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke={mode === "locked" ? "#95C623" : "#E55812"}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div>
        <p className="text-sm font-semibold text-cream">
          {mode === "locked" ? "Schedule locked" : `Day ${daysElapsed} / ${totalDays}`}
        </p>
        <p className="text-[11px] text-cream/40">
          {mode === "locked"
            ? "Posting on your learned best times"
            : mode === "exploring"
            ? "Learning your best posting times"
            : "Not started yet"}
        </p>
      </div>
    </div>
  );
}
