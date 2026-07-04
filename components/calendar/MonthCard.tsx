"use client";

import { cn } from "@/lib/utils";
import { getMonthCells, dayKey, MONTH_NAMES, WEEKDAY_LABELS } from "@/lib/utils/calendar";

interface MonthCardProps {
  year: number;
  monthIndex: number; // 0-11
  eventos: Set<string>;
}

export function MonthCard({ year, monthIndex, eventos }: MonthCardProps) {
  const cells = getMonthCells(year, monthIndex);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 text-center">
        {MONTH_NAMES[monthIndex]}
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (cell.day === null) return <span key={i} />;
          const marked = eventos.has(dayKey(cell.day, monthIndex + 1));
          const isPast = new Date(year, monthIndex, cell.day) < today;
          return (
            <span
              key={i}
              className={cn(
                "flex items-center justify-center size-7 mx-auto rounded-full text-xs",
                marked
                  ? "bg-success/15 text-success font-semibold"
                  : "text-foreground",
                isPast && "opacity-40",
              )}
            >
              {cell.day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
