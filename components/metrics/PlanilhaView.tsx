"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getCellValue, type SheetOut } from "@/lib/api/metricas";
import { cn } from "@/lib/utils";

interface PlanilhaViewProps {
  sheet: SheetOut;
  readOnly?: boolean;
  onCellCommit?: (metricId: string, day: string, value: number | null) => void;
  onEditColumn?: (metricId: string) => void;
  onDeleteColumn?: (metricId: string) => void;
}

interface EditableCellProps {
  value: number | undefined;
  onCommit: (value: number | null) => void;
}

function EditableCell({ value, onCommit }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value !== undefined ? String(value) : "");

  function startEdit() {
    setDraft(value !== undefined ? String(value) : "");
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === "") {
      if (value !== undefined) onCommit(null);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 0) return;
    if (n !== value) onCommit(n);
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-16 h-7 rounded border border-input bg-background px-1.5 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="w-16 h-7 rounded text-sm hover:bg-muted/60 transition-colors"
    >
      {value ?? <span className="text-muted-foreground">—</span>}
    </button>
  );
}

export function PlanilhaView({ sheet, readOnly, onCellCommit, onEditColumn, onDeleteColumn }: PlanilhaViewProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const columns = [...sheet.columns].sort((a, b) => a.order - b.order);

  return (
    <div className="max-h-[420px] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 z-20 bg-muted">
          <TableRow>
            <TableHead className="sticky left-0 bg-muted z-30 h-8 py-1 w-16">Dia</TableHead>
            {columns.map((c) => (
              <TableHead key={c.id} className="text-center h-8 py-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span>
                    {c.name} <span className="text-muted-foreground font-normal">({c.unit})</span>
                  </span>
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditColumn?.(c.id)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Editar coluna ${c.name}`}
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteColumn?.(c.id)}
                        className="text-muted-foreground hover:text-danger"
                        aria-label={`Apagar coluna ${c.name}`}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sheet.days.map((day) => (
            <TableRow key={day}>
              <TableCell className="sticky left-0 bg-muted z-10 font-medium py-1 px-2 w-16">
                {format(parseISO(day), "dd (EEE)", { locale: ptBR })}
              </TableCell>
              {columns.map((c) => {
                const value = getCellValue(sheet, c.id, day);
                return (
                  <TableCell
                    key={c.id}
                    className={cn("text-center py-1 px-2", day === today ? "bg-primary/5" : "bg-background")}
                  >
                    {readOnly ? (
                      (value ?? <span className="text-muted-foreground">—</span>)
                    ) : (
                      <EditableCell value={value} onCommit={(v) => onCellCommit?.(c.id, day, v)} />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
