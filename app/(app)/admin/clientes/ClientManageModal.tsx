"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { adminClientes, adminStages, adminStageFolders } from "@/lib/api/admin";
import type { ClienteLinha } from "@/lib/api/admin";
import { listProdutos } from "@/lib/api/produtos";
import { groupStagesByFolder } from "@/lib/utils/stages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PHONE_CLASS =
  "flex h-9 items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 " +
  "[&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:pl-2 [&_.PhoneInputCountry]:gap-1 " +
  "[&_.PhoneInputCountryIcon]:size-5 [&_.PhoneInputCountrySelect]:border-0 [&_.PhoneInputCountrySelect]:bg-transparent " +
  "[&_.PhoneInputCountrySelect]:text-foreground [&_.PhoneInputCountrySelect]:outline-none [&_.PhoneInputCountrySelect]:text-sm [&_.PhoneInputCountrySelect]:px-1 " +
  "[&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:h-full [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent " +
  "[&_.PhoneInputInput]:px-2.5 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:ring-0 " +
  "[&_.PhoneInputInput]:shadow-none [&_.PhoneInputInput]:focus:outline-none [&_.PhoneInputInput]:focus:ring-0 " +
  "[&_.PhoneInputInput]:focus:shadow-none [&_.PhoneInputInput]:placeholder:text-muted-foreground";

interface ClientManageModalProps {
  client: ClienteLinha;
  onClose: () => void;
}

export function ClientManageModal({ client, onClose }: ClientManageModalProps) {
  const queryClient = useQueryClient();

  const { data: produtos } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const { data: allStages } = useQuery({
    queryKey: ["admin", "stages"],
    queryFn: adminStages.list,
  });
  const { data: stageFolders } = useQuery({
    queryKey: ["admin", "stage-folders"],
    queryFn: adminStageFolders.list,
  });
  const stageGroups = groupStagesByFolder(allStages ?? [], stageFolders ?? []);

  const [clientName, setClientName] = useState(client.name);
  const [clientPhone, setClientPhone] = useState(client.phone ?? "");
  const [description, setDescription] = useState(client.description ?? "");
  const [attachedIds, setAttachedIds] = useState<Set<string>>(
    () => new Set((client.stages ?? []).map((s) => s.stage_id))
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(
    client.product_id ?? "",
  );
  const [saving, setSaving] = useState(false);

  function toggleStage(stage_id: string, checked: boolean) {
    setAttachedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(stage_id);
      else next.delete(stage_id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await adminClientes.update(client.id, {
        name: clientName || null,
        phone: clientPhone || null,
        description: description || null,
        product_id: selectedProductId || null,
        stage_ids: Array.from(attachedIds),
      });
      toast.success("Alterações salvas!");
      queryClient.invalidateQueries({ queryKey: ["admin", "clientes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "client", client.id] });
      onClose();
    } catch {
      toast.error("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Editar — {client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-0.5 py-0.5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <PhoneInput
              international
              defaultCountry="BR"
              value={clientPhone}
              onChange={(v) => setClientPhone(v ?? "")}
              className={PHONE_CLASS}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do cliente..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
            />
          </div>

          {/* Product */}
          <div className="space-y-1.5">
            <Label>Produto</Label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Sem produto</option>
              {produtos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stages */}
          <div className="space-y-2">
            <Label>Etapas</Label>
            {!allStages ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : allStages.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma etapa cadastrada.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {stageGroups.filter((g) => g.stages.length > 0).map((g) => (
                  <div key={g.folder?.id ?? "unfiled"} className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-2 pt-1">
                      {g.folder?.title ?? "Sem pasta"}
                    </p>
                    {g.stages.map((s) => {
                      const attached = attachedIds.has(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/40 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={attached}
                            onChange={(e) => toggleStage(s.id, e.target.checked)}
                            className="size-4 accent-[var(--color-primary)]"
                          />
                          <div className="min-w-0 flex-1">
                            {s.title && (
                              <p className="text-sm font-medium break-all">{s.title}</p>
                            )}
                            <p className={(s.title ? "text-xs text-muted-foreground" : "text-sm") + " break-all whitespace-pre-wrap"}>
                              {s.text}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Cancelar
          </button>
          <Button variant="primary" disabled={saving} onClick={handleSave}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
