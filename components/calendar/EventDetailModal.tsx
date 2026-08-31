"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { adminEventos } from "@/lib/api/eventos";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export interface DetailEvent {
  id: string;
  title: string;
  date: string;
  description: string | null;
  image_url: string | null;
  isGlobal: boolean;
  clientName?: string | null;
}

interface EventDetailModalProps {
  event: DetailEvent | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function EventDetailModal({ event, isAdmin, onClose, onEdit }: EventDetailModalProps) {
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const deleteMut = useMutation({
    mutationFn: () => adminEventos.remove(event!.id),
    onSuccess: () => {
      toast.success("Evento removido.");
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      setConfirmingDelete(false);
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao remover evento.")),
  });

  return (
    <>
      <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          {event && (
            <div className="space-y-4">
              {event.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg -mt-1"
                />
              )}
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle>{event.title}</DialogTitle>
                  <Badge variant={event.isGlobal ? "success" : "default"}>
                    {event.isGlobal ? "Geral" : event.clientName ?? "Particular"}
                  </Badge>
                </div>
              </DialogHeader>

              <p className="text-sm text-muted-foreground">
                {format(new Date(`${event.date}T00:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>

              {event.description && (
                <p className="text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">{event.description}</p>
              )}

              {isAdmin && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)}>
                    <Trash2 className="size-3.5" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{event?.title}&rdquo; será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? "Removendo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
