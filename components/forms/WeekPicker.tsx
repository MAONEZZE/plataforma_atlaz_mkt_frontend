"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  addDays,
  format,
  getISOWeek,
  isSameDay,
  startOfWeek,
  eachWeekOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WeekPickerProps {
  value: Date | null;
  onChange: (monday: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

function toMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const d1 = format(monday, "d");
  const d2 = format(sunday, "d");
  if (monday.getMonth() === sunday.getMonth()) {
    return `${d1}–${d2} ${format(sunday, "MMM", { locale: ptBR })}`;
  }
  return `${d1} ${format(monday, "MMM", { locale: ptBR })}–${d2} ${format(sunday, "MMM", { locale: ptBR })}`;
}

function formatButtonLabel(monday: Date): string {
  return `Semana ${getISOWeek(monday)} · ${formatRange(monday)}`;
}

export function WeekPicker({ value, onChange, minDate, maxDate, disabled }: WeekPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedMonday = value ? toMonday(value) : null;

  const min = minDate ? toMonday(minDate) : toMonday(addDays(new Date(), -28));
  const max = maxDate ? toMonday(maxDate) : toMonday(new Date());
  const weeks = eachWeekOfInterval({ start: min, end: max }, { weekStartsOn: 1 }).reverse();

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className={selectedMonday ? "text-foreground" : "text-muted-foreground"}>
          {selectedMonday ? formatButtonLabel(selectedMonday) : "Selecionar semana"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground shrink-0 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border border-border bg-card overflow-hidden shadow-md">
          <ul className="max-h-52 overflow-y-auto py-1">
            {weeks.map((monday) => {
              const isSelected = selectedMonday ? isSameDay(monday, selectedMonday) : false;
              return (
                <li key={monday.toISOString()}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(monday);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-primary/10",
                      isSelected && "bg-primary/15"
                    )}
                  >
                    <span className={cn("font-medium text-foreground", isSelected && "text-primary")}>
                      Semana {getISOWeek(monday)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatRange(monday)}</span>
                      {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
