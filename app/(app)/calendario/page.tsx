"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { adminEventos, eventos, type EventOut, type EventoCliente } from "@/lib/api/eventos";
import type { Paginated } from "@/lib/api/types";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getCalendarYear, groupByDate } from "@/lib/utils/calendar";
import { MonthCard } from "@/components/calendar/MonthCard";
import { EventFormModal } from "@/components/calendar/EventFormModal";
import { EventDetailModal, type DetailEvent } from "@/components/calendar/EventDetailModal";
import { ClearYearDialog } from "@/components/calendar/ClearYearDialog";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/data/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type MenteeScope = "all" | "mine" | "general";

interface NormalizedEvent {
  id: string;
  title: string;
  date: string;
  description: string | null;
  image_url: string | null;
  is_global: boolean;
  client_id: string | null;
}

const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i);

export default function CalendarioPage() {
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const [year, setYear] = useState(() => getCalendarYear());
  const [menteeScope, setMenteeScope] = useState<MenteeScope>("all");
  const [creating, setCreating] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<EventOut | null>(null);
  const [detail, setDetail] = useState<DetailEvent | null>(null);
  const [dayEventsDate, setDayEventsDate] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<NormalizedEvent | null>(null);
  const [clearingYear, setClearingYear] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<Paginated<EventOut> | Paginated<EventoCliente>>({
    queryKey: isAdmin ? ["eventos", "admin"] : ["eventos", "me"],
    queryFn: () => (isAdmin ? adminEventos.list() : eventos.list()),
    enabled: !!user,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminEventos.remove(id),
    onSuccess: () => {
      toast.success("Evento removido.");
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      setDeletingEvent(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao remover evento.")),
  });

  const allEvents: NormalizedEvent[] = useMemo(() => {
    if (!data) return [];
    if (isAdmin) {
      return (data.items as EventOut[]).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        description: e.description,
        image_url: e.image_url,
        is_global: e.client_id === null,
        client_id: e.client_id,
      }));
    }
    return (data.items as EventoCliente[]).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      description: e.description,
      image_url: e.image_url,
      is_global: e.is_global,
      client_id: null,
    }));
  }, [data, isAdmin]);

  const filteredEvents = useMemo(() => {
    if (isAdmin) return allEvents.filter((e) => e.is_global);
    if (menteeScope === "mine") return allEvents.filter((e) => !e.is_global);
    if (menteeScope === "general") return allEvents.filter((e) => e.is_global);
    return allEvents;
  }, [allEvents, isAdmin, menteeScope]);

  const eventsByDate = useMemo(() => groupByDate(filteredEvents), [filteredEvents]);

  const yearEvents = useMemo(
    () =>
      filteredEvents
        .filter((e) => e.date.startsWith(String(year)))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [filteredEvents, year],
  );

  const dayDialogEvents = dayEventsDate ? eventsByDate.get(dayEventsDate) ?? [] : [];

  function goToYear(delta: number) {
    setYear((prev) => prev + delta);
  }

  function findRaw(id: string): EventOut | undefined {
    if (!isAdmin || !data) return undefined;
    return (data.items as EventOut[]).find((ev) => ev.id === id);
  }

  function openDetail(e: NormalizedEvent) {
    setDetail({
      id: e.id,
      title: e.title,
      date: e.date,
      description: e.description,
      image_url: e.image_url,
      isGlobal: e.is_global,
    });
  }

  function openEdit(id: string) {
    const raw = findRaw(id);
    if (raw) {
      setDetail(null);
      setEditing(raw);
    }
  }

  function openCreate(defaultDate?: string) {
    setCreateDate(defaultDate);
    setCreating(true);
  }

  function handleDayClick(iso: string) {
    const dayEvents = eventsByDate.get(iso) ?? [];
    if (dayEvents.length === 0) {
      if (isAdmin) openCreate(iso);
      return;
    }
    if (dayEvents.length === 1) {
      openDetail(dayEvents[0]);
      return;
    }
    setDayEventsDate(iso);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Eventos gerais e datas particulares dos clientes.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => openCreate(undefined)}>
              <Plus className="size-3.5" />
              Nova data
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" />}>
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onClick={() => setClearingYear(true)}>
                  Limpar eventos do ano…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {user && !isAdmin && (
          <Select value={menteeScope} onValueChange={(v) => { if (v !== null) setMenteeScope(v as MenteeScope); }}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="mine">Minhas datas</SelectItem>
              <SelectItem value="general">Datas gerais</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : isError ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger flex items-center justify-between">
          Erro ao carregar eventos.
          <button className="underline text-xs" onClick={() => refetch()}>Tentar novamente</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goToYear(-1)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Ano anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <h2 className="text-lg font-semibold w-20 text-center">{year}</h2>
              <button
                type="button"
                onClick={() => goToYear(1)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Próximo ano"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MONTH_INDEXES.map((monthIndex) => (
                <MonthCard
                  key={monthIndex}
                  year={year}
                  monthIndex={monthIndex}
                  events={eventsByDate}
                  size="sm"
                  selectedDate={dayEventsDate ?? undefined}
                  onDayClick={handleDayClick}
                />
              ))}
            </div>
          </div>

          <GlassCard variant="solid" className="space-y-3 h-fit">
            <h3 className="font-semibold text-sm">Eventos de {year}</h3>

            {yearEvents.length === 0 ? (
              <EmptyState title="Nenhum evento neste ano." className="py-8" />
            ) : (
              <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {yearEvents.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => openDetail(e)}
                  >
                    {e.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.image_url} alt={e.title} className="size-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="size-10 rounded-lg bg-muted shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {e.date.split("-").reverse().join("/")}
                        </span>
                        <Badge variant={e.is_global ? "success" : "default"} className="text-[10px]">
                          {e.is_global ? "Geral" : "Particular"}
                        </Badge>
                      </div>
                    </div>
                    {isAdmin && (
                      <div onClick={(ev) => ev.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <MoreVertical className="size-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(e.id)}>
                              <Pencil className="size-3.5" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setDeletingEvent(e)}>
                              <Trash2 className="size-3.5" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      )}

      {creating && isAdmin && (
        <EventFormModal defaultDate={createDate} onClose={() => setCreating(false)} />
      )}
      {editing && isAdmin && (
        <EventFormModal event={editing} onClose={() => setEditing(null)} />
      )}

      <EventDetailModal
        event={detail}
        isAdmin={isAdmin}
        onClose={() => setDetail(null)}
        onEdit={() => detail && openEdit(detail.id)}
      />

      {/* Múltiplos eventos no mesmo dia — escolher qual abrir */}
      <Dialog open={!!dayEventsDate} onOpenChange={(o) => !o && setDayEventsDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dayEventsDate &&
                format(new Date(`${dayEventsDate}T00:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          <ul className="space-y-1.5">
            {dayDialogEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => {
                  setDayEventsDate(null);
                  openDetail(e);
                }}
              >
                {e.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image_url} alt={e.title} className="size-9 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="size-9 rounded-lg bg-muted shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  <Badge variant={e.is_global ? "success" : "default"} className="text-[10px]">
                    {e.is_global ? "Geral" : "Particular"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {isAdmin && (
        <AlertDialog open={!!deletingEvent} onOpenChange={(o) => !o && setDeletingEvent(null)}>
          <AlertDialogContent className="bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{deletingEvent?.title}&rdquo; será removido permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingEvent && deleteMut.mutate(deletingEvent.id)}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? "Removendo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isAdmin && <ClearYearDialog open={clearingYear} onOpenChange={setClearingYear} />}
    </div>
  );
}
