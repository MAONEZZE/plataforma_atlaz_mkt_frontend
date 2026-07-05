"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { addMonths, format, parse, startOfMonth, eachMonthOfInterval, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value: string;
  onChange: (mes: string) => void;
  minDate?: Date;
  maxDate?: Date;
}

function parseMes(mes: string): Date {
  return parse(mes, "yyyy-MM", new Date());
}

function formatMes(date: Date): string {
  return format(date, "yyyy-MM");
}

export function MonthPicker({ value, onChange, minDate, maxDate }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = parseMes(value);
  const min = minDate ? startOfMonth(minDate) : startOfMonth(addMonths(new Date(), -24));
  const max = maxDate ? startOfMonth(maxDate) : startOfMonth(addMonths(new Date(), 6));
  const months = eachMonthOfInterval({ start: min, end: max }).reverse();

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  function shift(delta: number) {
    onChange(formatMes(addMonths(selected, delta)));
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => shift(-1)}
        className="inline-flex items-center justify-center size-8 rounded-lg border border-input bg-background text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm capitalize transition-colors hover:bg-muted/50"
      >
        {format(selected, "MMMM 'de' yyyy", { locale: ptBR })}
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground shrink-0 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      <button
        type="button"
        onClick={() => shift(1)}
        className="inline-flex items-center justify-center size-8 rounded-lg border border-input bg-background text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-56 rounded-lg border border-border bg-card overflow-hidden shadow-md">
          <ul className="max-h-64 overflow-y-auto py-1">
            {months.map((m) => {
              const isSelected = isSameMonth(m, selected);
              return (
                <li key={formatMes(m)}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(formatMes(m));
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-sm capitalize transition-colors hover:bg-primary/10",
                      isSelected && "bg-primary/15",
                    )}
                  >
                    <span className={cn("text-foreground", isSelected && "text-primary font-medium")}>
                      {format(m, "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
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
