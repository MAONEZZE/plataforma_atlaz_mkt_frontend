"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ColumnForm } from "@/components/forms/ColumnForm";
import type { MetricOut } from "@/lib/api/metricas";

interface ColumnDialogProps {
  mode: "create" | "edit";
  metric?: MetricOut;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ColumnDialog({ mode, metric, open: controlledOpen, onOpenChange }: ColumnDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" && (
        <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 transition-all">
          <Plus className="size-4" />
          Nova coluna
        </DialogTrigger>
      )}
      <DialogContent className="glass max-w-md" showCloseButton={false}>
        <ColumnForm mode={mode} metric={metric} onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
