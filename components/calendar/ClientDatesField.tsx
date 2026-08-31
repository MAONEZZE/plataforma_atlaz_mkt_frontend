"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { MonthCarousel } from "@/components/calendar/MonthCarousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CoverPhotoUpload } from "@/components/ui/CoverPhotoUpload";
import { groupByDate } from "@/lib/utils/calendar";

export interface ClientDateItem {
  id?: string;
  title: string;
  date: string;
  description?: string | null;
  imageUrl?: string | null;
  /** Imagem escolhida no formulário; só sobe depois que o evento existe. */
  file?: File | null;
}

/** Data em edição. `index` nulo = ainda não está na lista. */
interface Draft {
  index: number | null;
  date: string;
  title: string;
  description: string;
  imageUrl: string | null;
  file: File | null;
}

interface ClientDatesFieldProps {
  value: ClientDateItem[];
  onChange: (next: ClientDateItem[]) => void;
}

function toBr(iso: string) {
  return iso.split("-").reverse().join("/");
}

export function ClientDatesField({ value, onChange }: ClientDatesFieldProps) {
  const [draft, setDraft] = useState<Draft | null>(null);

  const eventsByDate = groupByDate(value.map((d) => ({ date: d.date, is_global: false })));
  const sorted = [...value]
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.date.localeCompare(b.item.date));

  function openExisting(index: number) {
    const item = value[index];
    setDraft({
      index,
      date: item.date,
      title: item.title,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? null,
      file: item.file ?? null,
    });
  }

  function handleDayClick(iso: string) {
    if (draft && draft.index === null && draft.date === iso) {
      setDraft(null);
      return;
    }
    // Dia já marcado abre a data existente; dia livre começa uma nova.
    const existing = value.findIndex((d) => d.date === iso);
    if (existing !== -1) {
      openExisting(existing);
      return;
    }
    setDraft({ index: null, date: iso, title: "", description: "", imageUrl: null, file: null });
  }

  function saveDraft() {
    if (!draft || !draft.title.trim()) return;
    const item: ClientDateItem = {
      ...(draft.index !== null ? value[draft.index] : {}),
      title: draft.title.trim(),
      date: draft.date,
      description: draft.description.trim() || null,
      imageUrl: draft.imageUrl,
      file: draft.file,
    };
    onChange(
      draft.index !== null
        ? value.map((d, i) => (i === draft.index ? item : d))
        : [...value, item],
    );
    setDraft(null);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
    setDraft((prev) => (prev?.index === index ? null : prev));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div className="shrink-0">
          <MonthCarousel
            events={eventsByDate}
            selectedDate={draft?.date}
            onDayClick={handleDayClick}
            perPage={1}
          />
        </div>

        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Nenhuma data ainda — clique num dia do calendário para criar.
          </p>
        ) : (
          <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
            {sorted.map(({ item, index }) => (
              <li
                key={`${item.id ?? "new"}-${item.date}-${index}`}
                className={
                  "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 transition-colors " +
                  (draft?.index === index ? "bg-primary/10 ring-1 ring-primary/40" : "bg-muted/40")
                }
              >
                <button
                  type="button"
                  onClick={() => openExisting(index)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{toBr(item.date)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="min-h-0 min-w-0 shrink-0 overflow-y-auto no-scrollbar rounded-xl border border-input p-3 lg:w-80">
        {!draft ? (
          <p className="text-xs text-muted-foreground">
            Clique num dia do calendário para adicionar uma data, ou numa data da lista para editar.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow">{draft.index === null ? "Nova data" : "Editar data"}</p>
              <span className="text-xs text-muted-foreground">{toBr(draft.date)}</span>
            </div>

            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Título do evento"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveDraft();
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Descrição do evento..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Imagem (opcional)</Label>
              <CoverPhotoUpload
                preview={draft.imageUrl}
                onFileSelect={(f, url) => setDraft({ ...draft, file: f, imageUrl: url })}
                onClear={() => setDraft({ ...draft, file: null, imageUrl: null })}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
              >
                Cancelar
              </button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                disabled={!draft.title.trim()}
                onClick={saveDraft}
              >
                {draft.index === null ? "Adicionar" : "Aplicar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
