"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MonthCard } from "@/components/calendar/MonthCard";
import { getCalendarYear } from "@/lib/utils/calendar";
import { cn } from "@/lib/utils";

interface MonthCarouselEvent {
  is_global?: boolean;
}

interface MonthCarouselProps {
  events: Map<string, MonthCarouselEvent[]>;
  selectedDate?: string;
  onDayClick?: (isoDate: string) => void;
  /** Quantos meses mostrar por página do carrossel. @default 3 */
  perPage?: 1 | 3;
}

export function MonthCarousel({ events, selectedDate, onDayClick, perPage = 3 }: MonthCarouselProps) {
  const [year, setYear] = useState(() => getCalendarYear());
  const [page, setPage] = useState(0);

  const totalPages = 12 / perPage;
  const lastPage = totalPages - 1;
  const months = Array.from({ length: perPage }, (_, offset) => page * perPage + offset);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Ano anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-semibold w-12 text-center">{year}</span>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Próximo ano"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page === lastPage}
            className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-3", perPage === 3 && "sm:grid-cols-3")}>
        {months.map((monthIndex) => (
          <MonthCard
            key={monthIndex}
            year={year}
            monthIndex={monthIndex}
            events={events}
            size="sm"
            selectedDate={selectedDate}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
}
