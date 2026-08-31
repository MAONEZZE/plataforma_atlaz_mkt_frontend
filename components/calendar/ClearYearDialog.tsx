"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminEventos, type ClearScope } from "@/lib/api/eventos";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const SCOPE_LABELS: Record<ClearScope, string> = {
  general: "Geral",
  clients: "Dos clientes",
  all: "Ambos",
};

function yearOptions(): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => current - 1 + i);
}

interface ClearYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClearYearDialog({ open, onOpenChange }: ClearYearDialogProps) {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [scope, setScope] = useState<ClearScope>("general");
  const [confirmInput, setConfirmInput] = useState("");

  const mut = useMutation({
    mutationFn: () => adminEventos.clearYear(Number(year), scope),
    onSuccess: ({ deleted }) => {
      toast.success(`${deleted} evento(s) apagado(s)`);
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      setConfirmInput("");
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao limpar eventos.")),
  });

  const canConfirm = confirmInput === year;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setConfirmInput("");
      }}
    >
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Limpar eventos do ano</DialogTitle>
          <DialogDescription>
            Essa ação é irreversível e não há prévia de quantos eventos serão apagados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Ano</Label>
            <Select
              value={year}
              onValueChange={(v) => { if (v !== null) { setYear(v); setConfirmInput(""); } }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions().map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Escopo</Label>
            <Select value={scope} onValueChange={(v) => { if (v !== null) setScope(v as ClearScope); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SCOPE_LABELS) as ClearScope[]).map((s) => (
                  <SelectItem key={s} value={s}>{SCOPE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Digite &ldquo;{year}&rdquo; para confirmar</Label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={year}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Cancelar
          </button>
          <Button
            variant="destructive"
            disabled={!canConfirm || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Apagando..." : "Apagar eventos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
