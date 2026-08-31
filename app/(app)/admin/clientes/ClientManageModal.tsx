"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { isValidPhoneNumber } from "react-phone-number-input";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Pencil } from "lucide-react";
import { adminClientes, adminStages, adminStageFolders } from "@/lib/api/admin";
import type { ClienteLinha } from "@/lib/api/admin";
import { adminEventos } from "@/lib/api/eventos";
import { getApiErrorMessage } from "@/lib/api/errors";
import { listProdutos } from "@/lib/api/produtos";
import { groupStagesByFolder } from "@/lib/utils/stages";
import { initials } from "@/components/community/MentoradoCard";
import { ClientDatesField, type ClientDateItem } from "@/components/calendar/ClientDatesField";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { PasswordStrengthIndicator } from "@/components/forms/PasswordStrengthIndicator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PHOTO_ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_SIZE = 5 * 1024 * 1024;

const PHONE_CLASS =
  "flex h-9 items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 " +
  "[&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:pl-2 [&_.PhoneInputCountry]:gap-1 " +
  "[&_.PhoneInputCountryIcon]:size-5 [&_.PhoneInputCountrySelect]:border-0 [&_.PhoneInputCountrySelect]:bg-transparent " +
  "[&_.PhoneInputCountrySelect]:text-foreground [&_.PhoneInputCountrySelect]:outline-none [&_.PhoneInputCountrySelect]:text-sm [&_.PhoneInputCountrySelect]:px-1 " +
  "[&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:h-full [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent " +
  "[&_.PhoneInputInput]:px-2.5 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:ring-0 " +
  "[&_.PhoneInputInput]:shadow-none [&_.PhoneInputInput]:focus:outline-none [&_.PhoneInputInput]:focus:ring-0 " +
  "[&_.PhoneInputInput]:focus:shadow-none [&_.PhoneInputInput]:placeholder:text-muted-foreground";

function buildSchema(isCreate: boolean) {
  return z.object({
    name: z.string().min(1, "Nome obrigatório."),
    phone: z
      .string()
      .min(1, "Telefone obrigatório.")
      .refine((v) => isValidPhoneNumber(v), "Telefone inválido."),
    description: z.string().optional(),
    email: isCreate ? z.string().email("Email inválido.") : z.string().optional(),
    password: isCreate
      ? z.string().min(8, "Senha deve ter no mínimo 8 caracteres.")
      : z.string().optional(),
  });
}
type ClientFormInput = z.infer<ReturnType<typeof buildSchema>>;

type Tab = "config" | "data";

function TabPill({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="inline-flex rounded-full border border-input bg-muted/50 p-0.5">
      {(["config", "data"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          aria-pressed={value === t}
          className={
            // O selecionado usa --primary: no tema escuro `bg-background` fica
            // mais escuro que a trilha da pill e o estado some.
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors outline-none " +
            "focus-visible:ring-3 focus-visible:ring-ring/50 " +
            (value === t
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {t === "config" ? "Config" : "Data"}
        </button>
      ))}
    </div>
  );
}

interface ClientManageModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client: ClienteLinha | null;
  /** Atalho para a página do cliente. Fica fora quando o modal já é aberto lá. */
  showFullViewLink?: boolean;
  onSuccess: () => void;
}

export function ClientManageModal({
  open,
  onOpenChange,
  client,
  showFullViewLink = false,
  onSuccess,
}: ClientManageModalProps) {
  const isCreate = !client;
  const router = useRouter();
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [attachedIds, setAttachedIds] = useState<Set<string>>(new Set());
  const [dates, setDates] = useState<ClientDateItem[]>([]);
  const [initialDates, setInitialDates] = useState<ClientDateItem[]>([]);
  const [tab, setTab] = useState<Tab>("config");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(buildSchema(isCreate)),
    mode: "onTouched",
  });

  const password = watch("password") ?? "";
  const watchedName = watch("name");

  const { data: produtos } = useQuery({ queryKey: ["produtos"], queryFn: listProdutos });
  const { data: allStages } = useQuery({ queryKey: ["admin", "stages"], queryFn: adminStages.list });
  const { data: stageFolders } = useQuery({ queryKey: ["admin", "stage-folders"], queryFn: adminStageFolders.list });
  const stageGroups = groupStagesByFolder(allStages ?? [], stageFolders ?? []);

  const detailQuery = useQuery({
    queryKey: ["admin", "client", client?.id],
    queryFn: () => adminClientes.get(client!.id),
    enabled: open && !!client,
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      description: client?.description ?? "",
      email: "",
      password: "",
    });
    setSelectedProductId(client?.product_id ?? "");
    setAttachedIds(new Set((client?.stages ?? []).map((s) => s.stage_id)));
    setPhotoUrl(client?.photo_url ?? null);
    setPendingPhotoFile(null);
    setTab("config");
    if (!client) {
      setDates([]);
      setInitialDates([]);
    }
  }, [open, client, reset]);

  useEffect(() => {
    if (!open || !client || !detailQuery.data) return;
    const loaded = detailQuery.data.events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      description: e.description,
      imageUrl: e.image_url,
    }));
    setDates(loaded);
    setInitialDates(loaded);
  }, [open, client, detailQuery.data]);

  const uploadPhotoMut = useMutation({
    mutationFn: (file: File) => adminClientes.uploadPhoto(client!.id, file),
    onSuccess: ({ photo_url }) => {
      setPhotoUrl(photo_url);
      toast.success("Foto atualizada!");
      queryClient.invalidateQueries({ queryKey: ["admin", "clientes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "client", client!.id] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao enviar foto.")),
  });

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!PHOTO_ALLOWED.includes(f.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    if (f.size > PHOTO_MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    if (client) {
      uploadPhotoMut.mutate(f);
    } else {
      setPendingPhotoFile(f);
      setPhotoUrl(await fileToDataUrl(f));
    }
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function toggleStage(stage_id: string, checked: boolean) {
    setAttachedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(stage_id);
      else next.delete(stage_id);
      return next;
    });
  }

  /** Aplica no backend o que mudou na aba Data. Devolve os títulos que falharam. */
  async function syncDates(clientId: string): Promise<string[]> {
    const removed = initialDates.filter((d0) => d0.id && !dates.some((d1) => d1.id === d0.id));
    await Promise.allSettled(removed.map((d0) => adminEventos.remove(d0.id!)));

    const failed: string[] = [];
    for (const item of dates) {
      try {
        let eventId = item.id;
        const before = eventId ? initialDates.find((d) => d.id === eventId) : undefined;
        if (!eventId) {
          const created = await adminEventos.create({
            title: item.title,
            date: item.date,
            description: item.description ?? null,
            client_id: clientId,
          });
          eventId = created.id;
        } else if (
          before &&
          (before.title !== item.title ||
            before.date !== item.date ||
            (before.description ?? null) !== (item.description ?? null))
        ) {
          await adminEventos.update(eventId, {
            title: item.title,
            date: item.date,
            description: item.description ?? null,
          });
        }
        // A imagem só sobe depois que o evento existe e tem id.
        if (item.file) await adminEventos.uploadImage(eventId, item.file);
      } catch {
        failed.push(item.title);
      }
    }
    return failed;
  }

  const mut = useMutation({
    mutationFn: async (d: ClientFormInput) => {
      if (client) {
        await adminClientes.update(client.id, {
          name: d.name,
          phone: d.phone,
          description: d.description || null,
          product_id: selectedProductId || null,
          stage_ids: Array.from(attachedIds),
        });

        const failed = await syncDates(client.id);
        if (failed.length > 0) {
          toast.warning(`As datas "${failed.join(", ")}" não foram salvas.`);
        }
        return;
      }

      const created = await adminClientes.create({
        name: d.name,
        email: d.email!,
        password: d.password!,
        phone: d.phone,
        description: d.description || null,
        product_id: selectedProductId || null,
        stage_ids: Array.from(attachedIds),
      });

      if (pendingPhotoFile) {
        try {
          await adminClientes.uploadPhoto(created.id, pendingPhotoFile);
        } catch {
          toast.warning("Cliente criado, mas a foto não foi salva.");
        }
      }

      const failed = await syncDates(created.id);
      if (failed.length > 0) {
        toast.warning(`Cliente criado, mas as datas "${failed.join(", ")}" não foram salvas.`);
      }
    },
    onSuccess: () => {
      toast.success(client ? "Alterações salvas!" : "Cliente cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin", "clientes"] });
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      if (client) queryClient.invalidateQueries({ queryKey: ["admin", "client", client.id] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => {
      if (isCreate && axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error("Email já cadastrado.");
      } else {
        toast.error(client ? "Erro ao salvar alterações." : "Erro ao cadastrar cliente.");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Tamanho fixo: o modal não muda de dimensão entre abas nem entre criar e
          editar, e nada rola por fora. As caixas de altura livre lá dentro rolam
          sem barra visível (.no-scrollbar). */}
      <DialogContent
        className="glass flex h-[85vh] flex-col overflow-hidden sm:h-[40rem] sm:max-h-[calc(100vh-2rem)] sm:w-[56rem] sm:max-w-[calc(100vw-2rem)]"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 flex-row items-center justify-between gap-4 space-y-0">
          <DialogTitle>{client ? `Editar — ${client.name}` : "Novo cliente"}</DialogTitle>
          <TabPill value={tab} onChange={setTab} />
        </DialogHeader>

        <form
          onSubmit={handleSubmit((d) => mut.mutate(d))}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div
            className={
              tab === "config"
                ? "flex min-h-0 flex-1 flex-col gap-5 md:flex-row"
                : "hidden"
            }
          >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto no-scrollbar">
              {/* Dados */}
              <div className="space-y-4">
                <p className="eyebrow">Dados</p>

                <div className="flex justify-center pb-1">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadPhotoMut.isPending}
                    className="relative group rounded-full disabled:opacity-60"
                  >
                    <Avatar className="size-16">
                      {photoUrl && <AvatarImage src={photoUrl} alt={client?.name ?? watchedName ?? ""} />}
                      <AvatarFallback className="text-base font-medium bg-primary/10 text-primary">
                        {initials(client?.name || watchedName || "Cliente")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Pencil className="size-4 text-white" />
                    </span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input {...register("name")} placeholder="Nome completo" />
                  {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        international
                        defaultCountry="BR"
                        value={field.value ?? ""}
                        onChange={(v) => field.onChange(v ?? "")}
                        className={PHONE_CLASS}
                      />
                    )}
                  />
                  {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <textarea
                    {...register("description")}
                    placeholder="Descrição do cliente..."
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                  />
                </div>
              </div>

            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5">
              {/* Acesso — só no criar */}
              {isCreate && (
                <div className="space-y-4">
                  <p className="eyebrow">Acesso</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="off"
                      {...register("email")}
                      placeholder="cliente@email.com"
                    />
                    {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Senha</Label>
                    <PasswordInput
                      id="password"
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      {...register("password")}
                    />
                    <PasswordStrengthIndicator password={password} />
                    {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
                  </div>
                </div>
              )}

              {/* Produto e etapas */}
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <p className="eyebrow">Produto e etapas</p>
                <div className="space-y-1.5">
                  <Label>Produto</Label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  >
                    <option value="">Sem produto</option>
                    {produtos?.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  <Label>Etapas</Label>
                  {!allStages ? (
                    <Skeleton className="h-24 rounded-xl" />
                  ) : allStages.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma etapa cadastrada.</p>
                  ) : (
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto no-scrollbar rounded-lg border border-input p-2">
                      {stageGroups.filter((g) => g.stages.length > 0).map((g) => (
                        <div key={g.folder?.id ?? "unfiled"} className="space-y-1">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-2 pt-1">
                            {g.folder?.title ?? "Sem pasta"}
                          </p>
                          {g.stages.map((s) => (
                            <label
                              key={s.id}
                              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={attachedIds.has(s.id)}
                                onChange={(e) => toggleStage(s.id, e.target.checked)}
                                className="size-4 accent-[var(--color-primary)]"
                              />
                              <div className="min-w-0 flex-1">
                                {s.title && <p className="text-sm font-medium break-all">{s.title}</p>}
                                <p className={(s.title ? "text-xs text-muted-foreground" : "text-sm") + " break-all whitespace-pre-wrap"}>
                                  {s.text}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={tab === "data" ? "flex min-h-0 flex-1 flex-col gap-3" : "hidden"}>
            <p className="eyebrow shrink-0">Datas do cliente</p>
            {client && detailQuery.isLoading ? (
              <Skeleton className="min-h-0 flex-1 rounded-xl" />
            ) : (
              <ClientDatesField value={dates} onChange={setDates} />
            )}
          </div>

          <DialogFooter
            className={
              "mt-4 shrink-0" + (client && showFullViewLink ? " sm:justify-between" : "")
            }
          >
            {client && showFullViewLink && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/clientes/${client.id}`)}
              >
                Visualização completa
              </Button>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Cancelar
              </button>
              <Button type="submit" variant="primary" disabled={!isValid || mut.isPending}>
                {mut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
