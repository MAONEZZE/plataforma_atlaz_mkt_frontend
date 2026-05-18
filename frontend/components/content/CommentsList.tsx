"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  listComentarios,
  createComentario,
  updateComentario,
  deleteComentario,
  type Comentario,
} from "@/lib/api/conteudo";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CommentsListProps {
  aulaId: string;
}

function initials(nome: string): string {
  return nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
}: {
  comment: Comentario;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (id: string, texto: string) => void;
  onDelete: (id: string) => void;
}) {
  const canAct = comment.usuario_id === currentUserId || isAdmin;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.texto ?? "");

  if (comment.apagado_em) {
    return (
      <div className="solid-surface p-4 text-sm text-muted-foreground italic">
        Comentário removido.
      </div>
    );
  }

  return (
    <div className="solid-surface p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            {comment.autor_foto_url && <AvatarImage src={comment.autor_foto_url} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials(comment.autor_nome)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{comment.autor_nome}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.criado_em), { addSuffix: true, locale: ptBR })}
              {comment.editado_em && <span className="ml-1">(Editado)</span>}
            </p>
          </div>
        </div>
        {canAct && !editing && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger className="inline-flex size-7 items-center justify-center rounded hover:bg-muted text-danger transition-colors">
                <Trash2 className="size-3.5" />
              </AlertDialogTrigger>
              <AlertDialogContent className="glass">
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar comentário?</AlertDialogTitle>
                  <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white"
                    onClick={() => onDelete(comment.id)}
                  >
                    Apagar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm resize-none"
            rows={3}
            maxLength={2000}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={() => { onEdit(comment.id, editText); setEditing(false); }}>
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap">{comment.texto}</p>
      )}
    </div>
  );
}

export function CommentsList({ aulaId }: CommentsListProps) {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const [newText, setNewText] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comentarios", aulaId],
    queryFn: () => listComentarios(aulaId),
  });

  const createMut = useMutation({
    mutationFn: (texto: string) => createComentario(aulaId, texto),
    onMutate: async (texto) => {
      await queryClient.cancelQueries({ queryKey: ["comentarios", aulaId] });
      const prev = queryClient.getQueryData<Comentario[]>(["comentarios", aulaId]);
      const optimistic: Comentario = {
        id: `optimistic-${Date.now()}`,
        usuario_id: user?.id ?? "",
        autor_nome: user?.nome ?? "",
        autor_foto_url: user?.foto_url ?? null,
        texto,
        criado_em: new Date().toISOString(),
        editado_em: null,
        apagado_em: null,
        is_proprio: true,
      };
      queryClient.setQueryData<Comentario[]>(["comentarios", aulaId], (old) => [optimistic, ...(old ?? [])]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(["comentarios", aulaId], ctx?.prev);
      toast.error("Erro ao publicar comentário.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comentarios", aulaId] }),
  });

  const editMut = useMutation({
    mutationFn: ({ id, texto }: { id: string; texto: string }) => updateComentario(id, texto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comentarios", aulaId] }),
    onError: () => toast.error("Erro ao editar comentário."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteComentario(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["comentarios", aulaId] });
      const prev = queryClient.getQueryData<Comentario[]>(["comentarios", aulaId]);
      queryClient.setQueryData<Comentario[]>(["comentarios", aulaId], (old) =>
        (old ?? []).map((c) => c.id === id ? { ...c, apagado_em: new Date().toISOString() } : c),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(["comentarios", aulaId], ctx?.prev);
      toast.error("Erro ao apagar comentário.");
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    createMut.mutate(newText.trim());
    setNewText("");
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Comentários</h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          className="w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm resize-none placeholder:text-muted-foreground"
          rows={3}
          maxLength={2000}
          placeholder="Escreva um comentário..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{newText.length}/2000</span>
          <Button type="submit" variant="primary" size="sm" disabled={!newText.trim() || createMut.isPending}>
            Publicar
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(comments ?? []).map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={user?.id ?? ""}
              isAdmin={user?.role === "admin"}
              onEdit={(id, texto) => editMut.mutate({ id, texto })}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
