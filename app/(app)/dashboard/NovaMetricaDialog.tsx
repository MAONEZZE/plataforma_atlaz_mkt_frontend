"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MetricasForm } from "@/components/forms/MetricasForm";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NovaMetricaDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 transition-all">
        <Plus className="size-4" />
        Cadastrar métricas da semana
      </DialogTrigger>
      <DialogContent className="glass max-w-lg" showCloseButton={false}>
        <MetricasForm
          mode="create"
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
