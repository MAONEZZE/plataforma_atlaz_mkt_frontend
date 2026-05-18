# Frontend 07 — Tela de Perfil

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `frontend/00`, `frontend/01`, `frontend/02`, `backend/02-usuarios-context`
**Bloqueia:** —

---

## Rota

`/perfil` — cliente e admin (ambos editam próprios dados).

## Layout

Título "Configurações da conta" + `<Tabs>` com 2 abas:
- Dados Pessoais.
- Segurança.

---

## Aba 1 — Dados Pessoais

Layout de 2 colunas em desktop (form + preview), stack em mobile.

### Coluna esquerda — Form

**Foto:**
- Preview circular grande (200px). Placeholder com iniciais se sem foto.
- Botão "Alterar foto" abre file picker (jpg/png/webp, max 5MB).
- Após selecionar: preview imediato + botão "Salvar foto" → `POST /me/foto` (API FastAPI).
- Validação no front: tipo + tamanho. Se inválido: toast.

**Campos editáveis (via API FastAPI):**
- Nome.
- Telefone (com máscara `+55 (XX) XXXXX-XXXX`).
  - Texto auxiliar: "Usado pela equipe Atlaz para entrar em contato. Não é exibido para outros mentorados."
- LinkedIn URL (validação regex `linkedin.com`).
- Instagram (sem `@`, validação `^[a-zA-Z0-9_.]{1,30}$`).
  - Texto auxiliar: "Apenas o nome de usuário, sem @".

Botão "Salvar alterações" no rodapé. Desabilitado se nada mudou.

Submit: `PATCH /me` (API FastAPI).

**Campo email (editável via Supabase, não via API própria):**
- Input separado dos demais.
- Botão "Alterar email" → modal com novo email + confirmação.
- Submit:
  ```ts
  const { error } = await supabase.auth.updateUser({ email: novoEmail });
  ```
- Supabase pode enviar email de confirmação (depende da configuração do projeto).
- Toast: "Email atualizado. Você pode precisar confirmar no email enviado."
- O trigger no banco propaga o novo email para `public.usuario`.

### Coluna direita — Preview

Card "Como você aparece na Comunidade":
- Renderiza `<MentoradoCard>` com dados atuais do form (live update).
- Mostra: foto, nome, ícones LinkedIn e Instagram.
- **Não mostra:** telefone, email.

---

## Aba 2 — Segurança

Form (sem chamar API FastAPI — direto com Supabase):
- Senha atual (`<PasswordInput>`).
- Nova senha (com `<PasswordStrengthIndicator>`).
- Confirmar nova senha.
- Botão "Atualizar senha".

```tsx
async function trocarSenha(data: { senhaAtual: string; novaSenha: string }) {
  const supabase = createSupabaseBrowserClient();
  
  // Supabase não tem "verificar senha atual" exposto.
  // Fazemos um signInWithPassword com email do usuário atual para validar.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Sessão inválida."); return; }
  
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: data.senhaAtual,
  });
  if (verifyError) {
    toast.error("Senha atual incorreta.");
    return;
  }
  
  // Senha atual ok. Atualizar.
  const { error } = await supabase.auth.updateUser({ password: data.novaSenha });
  if (error) {
    toast.error("Erro ao atualizar senha: " + error.message);
    return;
  }
  
  toast.success("Senha atualizada com sucesso.");
  // Limpa form.
}
```

> **Observação técnica:** Supabase não expõe um endpoint "verificar senha atual sem trocar". A workaround acima é refazer login. Outras alternativas (custom RPC, etc.) são overkill pra MVP.

Validação zod:
```ts
const schema = z.object({
  senhaAtual: z.string().min(1, "Obrigatório"),
  novaSenha: z.string().regex(/^(?=.*[A-Z])(?=.*\d).{8,}$/, "Mínimo 8 chars, 1 maiúscula, 1 número"),
  confirmar: z.string(),
}).refine((d) => d.novaSenha === d.confirmar, {
  message: "Senhas não coincidem", path: ["confirmar"],
});
```

---

## Comportamento geral

- Loading inicial: skeleton em cada aba.
- Trocar de aba preserva estado.
- Avisar se sair com alterações não salvas (`beforeunload`).

## Critérios de aceitação

- [ ] 2 abas funcionando.
- [ ] Upload de foto valida tipo e tamanho.
- [ ] Preview atualiza em tempo real.
- [ ] Preview NUNCA mostra telefone ou email.
- [ ] LinkedIn e Instagram validados.
- [ ] Telefone com texto auxiliar explicando privacidade.
- [ ] Alterar email passa pelo `supabase.auth.updateUser()`.
- [ ] Aba Segurança verifica senha atual via re-login.
- [ ] Aba Segurança valida senha forte.
- [ ] Aviso de alterações não salvas.
- [ ] Tema light e dark.
