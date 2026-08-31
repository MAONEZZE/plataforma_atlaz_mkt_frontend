"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { MonthCarousel } from "@/components/calendar/MonthCarousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { groupByDate } from "@/lib/utils/calendar";

export interface ClientDateItem {
  id?: string;
  title: string;
  date: string;
}

interface ClientDatesFieldProps {
  value: ClientDateItem[];
  onChange: (next: ClientDateItem[]) => void;
}

export function ClientDatesField({ value, onChange }: ClientDatesFieldProps) {
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingTitle, setPendingTitle] = useState("");

  const eventsByDate = groupByDate(value.map((d) => ({ date: d.date, is_global: false })));
  const sorted = [...value].sort((a, b) => a.date.localeCompare(b.date));

  function handleDayClick(iso: string) {
    setPendingDate((prev) => (prev === iso ? null : iso));
    setPendingTitle("");
  }

  function confirmAdd() {
    if (!pendingDate || !pendingTitle.trim()) return;
    onChange([...value, { title: pendingTitle.trim(), date: pendingDate }]);
    setPendingDate(null);
    setPendingTitle("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <MonthCarousel
        events={eventsByDate}
        selectedDate={pendingDate ?? undefined}
        onDayClick={handleDayClick}
        perPage={1}
      />

      {pendingDate && (
        <div className="flex items-center gap-2 rounded-lg border border-input p-2">
          <span className="text-xs text-muted-foreground shrink-0">
            {pendingDate.split("-").reverse().join("/")}
          </span>
          <Input
            autoFocus
            value={pendingTitle}
            onChange={(e) => setPendingTitle(e.target.value)}
            placeholder="Título da data"
            className="h-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmAdd();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={!pendingTitle.trim()}
            onClick={confirmAdd}
          >
            Adicionar
          </Button>
          <button
            type="button"
            onClick={() => setPendingDate(null)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {sorted.length > 0 && (
        <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {sorted.map((d) => {
            const index = value.indexOf(d);
            return (
              <li
                key={`${d.id ?? "new"}-${d.date}-${index}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.date.split("-").reverse().join("/")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
