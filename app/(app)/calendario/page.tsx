"use client";

import { MonthCard } from "@/components/calendar/MonthCard";
import { getCalendarYear, getEventosSet } from "@/lib/utils/calendar";

export default function CalendarioPage() {
  const year = getCalendarYear();
  const eventos = getEventosSet();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Calendário {year}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, monthIndex) => (
          <MonthCard key={monthIndex} year={year} monthIndex={monthIndex} eventos={eventos} />
        ))}
      </div>
    </div>
  );
}
