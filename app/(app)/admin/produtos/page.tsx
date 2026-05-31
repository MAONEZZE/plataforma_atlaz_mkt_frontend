"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Pencil, Trash2 } from "lucide-react";
import { listProdutos, type Produto } from "@/lib/api/produtos";
import { adminProdutos } from "@/lib/api/admin";
import { GlassCard } from "@/components/glass/GlassCard";
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

const produtoSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  value: z
    .number()
    .min(0, "Mínimo 0"),
  description: z.string().optional(),
});
type ProdutoFormInput = z.infer<typeof produtoSchema>;

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function AdminProdutosPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const [editing, setEditing] = useState<Produto | null>(null);
  const [deleting, setDeleting] = useState<Produto | null>(null);

  const createForm = useForm<ProdutoFormInput>({
    resolver: zodResolver(produtoSchema),
    defaultValues: { name: "", value: 0, description: "" },
  });

  const editForm = useForm<ProdutoFormInput>({
    resolver: zodResolver(produtoSchema),
  });

  function openEdit(p: Produto) {
    editForm.reset({ name: p.name, value: p.value, description: p.description ?? "" });
    setEditing(p);
  }

  function toPayload(d: ProdutoFormInput) {
    return {
      name: d.name,
      value: d.value,
      description: d.description?.trim() ? d.description.trim() : null,
    };
  }

  const createMut = useMutation({
    mutationFn: (d: ProdutoFormInput) => adminProdutos.create(toPayload(d)),
    onSuccess: () => {
      toast.success("Produto criado!");
      createForm.reset({ name: "", value: 0, description: "" });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
    onError: () => toast.error("Erro ao criar produto."),
  });

  const editMut = useMutation({
    mutationFn: (d: ProdutoFormInput) => adminProdutos.update(editing!.id, toPayload(d)),
    onSuccess: () => {
      toast.success("Produto atualizado!");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
    onError: () => toast.error("Erro ao atualizar produto."),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminProdutos.remove(deleting!.id),
    onSuccess: () => {
      toast.success("Produto removido.");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
    onError: (err) => {
      if (
        axios.isAxiosError(err) &&
        err.response?.data?.error?.code === "PRODUCT_IN_USE"
      ) {
        toast.error("Produto está vinculado a clientes e não pode ser removido.");
      } else {
        toast.error("Erro ao remover produto.");
      }
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie os produtos da plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
        {/* Left — create form */}
        <GlassCard variant="solid" className="space-y-4">
          <h2 className="font-medium">Novo produto</h2>
          <form
            onSubmit={createForm.handleSubmit((d) => createMut.mutate(d))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                {...createForm.register("name")}
                placeholder="Nome do produto"
              />
              {createForm.formState.errors.name && (
                <p className="text-xs text-danger">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                {...createForm.register("value", { valueAsNumber: true })}
                placeholder="0,00"
              />
              {createForm.formState.errors.value && (
                <p className="text-xs text-danger">
                  {createForm.formState.errors.value.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <textarea
                {...createForm.register("description")}
                placeholder="Descrição do produto"
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "Criando..." : "Criar produto"}
            </Button>
          </form>
        </GlassCard>

        {/* Right — products table */}
        <GlassCard variant="solid" className="space-y-4 h-fit">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Produtos cadastrados</h2>
          <span className="text-xs text-muted-foreground">
            {data?.length ?? 0} registros
          </span>
        </div>
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : data?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum produto ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[18%]" />
                <col className="w-[42%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-2 font-medium text-muted-foreground text-xs">
                    Nome
                  </th>
                  <th className="text-left pb-2 font-medium text-muted-foreground text-xs">
                    Valor
                  </th>
                  <th className="text-left pb-2 font-medium text-muted-foreground text-xs">
                    Descrição
                  </th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {data?.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium break-all">{p.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {formatBRL(p.value)}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                      <span className="line-clamp-2 break-all" title={p.description ?? undefined}>
                        {p.description ?? "—"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(p)}
                          className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-muted-foreground hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </GlassCard>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Editar produto</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((d) => editMut.mutate(d))}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input {...editForm.register("name")} />
              {editForm.formState.errors.name && (
                <p className="text-xs text-danger">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                {...editForm.register("value", { valueAsNumber: true })}
              />
              {editForm.formState.errors.value && (
                <p className="text-xs text-danger">
                  {editForm.formState.errors.value.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <textarea
                {...editForm.register("description")}
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Cancelar
              </button>
              <Button
                type="submit"
                variant="primary"
                disabled={editMut.isPending}
              >
                {editMut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
