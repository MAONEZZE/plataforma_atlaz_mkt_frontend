"use client";

import { cn } from "@/lib/utils";
import { getMonthCells, toIsoDate, MONTH_NAMES, WEEKDAY_LABELS } from "@/lib/utils/calendar";

interface MonthCardEvent {
  is_global?: boolean;
}

interface MonthCardProps {
  year: number;
  monthIndex: number; // 0-11
  events: Map<string, MonthCardEvent[]>;
  size?: "sm" | "lg";
  selectedDate?: string;
  onDayClick?: (isoDate: string) => void;
}

export function MonthCard({
  year,
  monthIndex,
  events,
  size = "lg",
  selectedDate,
  onDayClick,
}: MonthCardProps) {
  const cells = getMonthCells(year, monthIndex);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sm = size === "sm";

  return (
    <div className={cn("rounded-2xl bg-card border border-border/60 shadow-sm", sm ? "p-3" : "p-4")}>
      <h3 className={cn("font-semibold text-foreground mb-3 text-center", sm ? "text-xs" : "text-sm")}>
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
          const isoDate = toIsoDate(year, monthIndex, cell.day);
          const dayEvents = events.get(isoDate) ?? [];
          const hasGlobal = dayEvents.some((e) => e.is_global !== false);
          const hasPrivate = dayEvents.some((e) => e.is_global === false);
          const isPast = new Date(year, monthIndex, cell.day) < today;
          const isSelected = selectedDate === isoDate;

          const content = (
            <>
              <span>{cell.day}</span>
              {hasGlobal && hasPrivate && (
                <span className="absolute -bottom-1 flex gap-0.5">
                  <span className="size-1 rounded-full bg-success" />
                  <span className="size-1 rounded-full bg-primary" />
                </span>
              )}
            </>
          );

          const className = cn(
            "relative flex items-center justify-center mx-auto rounded-full text-xs",
            sm ? "size-6" : "size-7",
            hasGlobal && !hasPrivate && "bg-success/15 text-success font-semibold",
            hasPrivate && !hasGlobal && "bg-primary/15 text-primary font-semibold",
            hasGlobal && hasPrivate && "bg-muted text-foreground font-semibold",
            !hasGlobal && !hasPrivate && "text-foreground",
            isPast && "opacity-40",
            isSelected && "ring-2 ring-ring",
          );

          if (onDayClick) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onDayClick(isoDate)}
                className={cn(className, "hover:brightness-95 cursor-pointer")}
              >
                {content}
              </button>
            );
          }

          return (
            <span key={i} className={className}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
