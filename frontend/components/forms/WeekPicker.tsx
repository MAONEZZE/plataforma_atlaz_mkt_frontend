"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import {
  addWeeks,
  format,
  isBefore,
  isAfter,
  startOfWeek,
  addDays,
  isSameDay,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `Semana de ${format(monday, "dd/MM", { locale: ptBR })} a ${format(sunday, "dd/MM/yyyy", { locale: ptBR })}`;
}

export function WeekPicker({ value, onChange, minDate, maxDate, disabled }: WeekPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(value ?? new Date());

  const selectedMonday = value ? toMonday(value) : null;

  function handleDayClick(day: Date) {
    const monday = toMonday(day);
    if (minDate && isBefore(monday, toMonday(minDate))) return;
    if (maxDate && isAfter(monday, toMonday(maxDate))) return;
    onChange(monday);
    setOpen(false);
  }

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingDays = (getDay(monthStart) + 6) % 7;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className="flex h-9 w-full items-center justify-start rounded-lg border border-input bg-background px-3 text-sm font-normal transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CalendarDays className="mr-2 size-4 opacity-60" />
        {selectedMonday ? formatWeekLabel(selectedMonday) : "Selecionar semana"}
      </PopoverTrigger>
      <PopoverContent className="bg-background border border-border rounded-xl shadow-xl p-4 w-auto">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium capitalize">
            {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">Selecione a segunda-feira de início da semana</p>
        <div className="grid grid-cols-7 gap-0.5 text-xs text-center mb-1">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => (
            <div key={d} className={cn("py-1", i === 0 ? "text-primary font-semibold" : "text-muted-foreground")}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: leadingDays }).map((_, i) => (
            <div key={`lead-${i}`} />
          ))}
          {days.map((day) => {
            const isMonday = day.getDay() === 1;
            const monday = toMonday(day);
            const isSelected = selectedMonday ? isSameDay(monday, selectedMonday) : false;
            const isInSelectedWeek =
              selectedMonday
                ? !isBefore(day, selectedMonday) && !isAfter(day, addDays(selectedMonday, 6))
                : false;
            const tooEarly = minDate ? isBefore(monday, toMonday(minDate)) : false;
            const tooLate = maxDate ? isAfter(monday, toMonday(maxDate)) : false;
            const isDisabled = tooEarly || tooLate || !isMonday;
            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={isDisabled}
                onClick={() => isMonday && handleDayClick(day)}
                className={cn(
                  "h-8 w-8 text-xs rounded transition-colors",
                  isInSelectedWeek && isMonday && "bg-primary/20",
                  isSelected && isMonday && "bg-primary text-primary-foreground font-semibold",
                  !isMonday && "opacity-20 cursor-not-allowed",
                  isMonday && !isSelected && !isDisabled && "hover:bg-primary/20 text-foreground font-medium",
                  isMonday && (tooEarly || tooLate) && "opacity-30 cursor-not-allowed",
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
