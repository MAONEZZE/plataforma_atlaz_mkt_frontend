# Shared 02 — Contrato da API

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `shared/00`, `shared/01`
**Bloqueia:** todas as specs de backend e frontend

---

## Convenções

- Base path: `/api/v1`.
- Content-Type: `application/json` (exceto uploads).
- Datas em ISO 8601 UTC.
- IDs em UUID string.
- Paginação:
  ```json
  { "items": [...], "page": 1, "page_size": 20, "total": 137 }
  ```

## Headers

- `Authorization: Bearer {supabase_access_token}` em todos os endpoints autenticados. O token é emitido pelo Supabase Auth.

## Códigos HTTP

| Código | Uso |
|---|---|
| 200 | Sucesso |
| 201 | Criado |
| 204 | Sucesso sem corpo |
| 400 | Validação |
| 401 | Token ausente/inválido/expirado |
| 403 | Sem permissão (role errado) |
| 404 | Não encontrado |
| 409 | Conflito |
| 422 | Regra de negócio violada |
| 429 | Rate limit |
| 500 | Erro interno |

## Formato de erro

```json
{
  "error": {
    "code": "CODIGO",
    "message": "Mensagem em PT-BR.",
    "details": { "campo": "..." }
  }
}
```

## Autenticação

**Login, logout, refresh, troca de senha são feitos diretamente pelo cliente Supabase no frontend.** O backend FastAPI **não expõe endpoints `/auth/*`**.

O frontend usa `@supabase/supabase-js` e armazena o access token. Em cada request à API FastAPI, envia `Authorization: Bearer {token}`. O backend valida o token usando o JWT secret do projeto Supabase.

Detalhes em `shared/03-autenticacao`.

## Endpoints

### Usuário logado (`/me/*`)

| Método | Path | Auth | Descrição |
|---|---|---|---|
| GET | `/me` | sim | Dados do usuário atual |
| PATCH | `/me` | sim | Atualizar nome/telefone/LinkedIn/Instagram |
| POST | `/me/foto` | sim (multipart) | Upload foto |

> Email não é editável via backend — se quiser, o frontend chama `supabase.auth.updateUser({ email })`. O trigger sincroniza para `public.usuario`.
> Senha não é editável via backend — frontend chama `supabase.auth.updateUser({ password })`.

### Métricas

| Método | Path | Auth | Descrição |
|---|---|---|---|
| GET | `/metricas` | sim | Listar (próprias para cliente; admin pode `?usuario_id=`) |
| POST | `/metricas` | sim | Criar |
| PATCH | `/metricas/{id}` | sim | Atualizar (respeitando janela de 4 semanas) |
| GET | `/dashboard/resumo` | sim | Cards do mês |
| GET | `/dashboard/series` | sim | Série semanal para gráfico |
| GET | `/admin/dashboard` | admin | Tabela consolidada da turma |

### Conteúdo

| Método | Path | Auth | Descrição |
|---|---|---|---|
| GET | `/trilhas` | sim | Listar trilhas com progresso |
| GET | `/trilhas/{id}` | sim | Trilha com módulos e aulas |
| GET | `/aulas/{id}` | sim | Detalhe da aula |
| POST | `/aulas/{id}/concluir` | sim | Marcar como concluída |
| DELETE | `/aulas/{id}/concluir` | sim | Desmarcar |

### Comentários

| Método | Path | Auth | Descrição |
|---|---|---|---|
| GET | `/aulas/{id}/comentarios` | sim | Listar |
| POST | `/aulas/{id}/comentarios` | sim | Criar |
| PATCH | `/comentarios/{id}` | sim | Editar (autor ou admin) |
| DELETE | `/comentarios/{id}` | sim | Apagar (soft delete) |

### Comunidade

| Método | Path | Auth | Descrição |
|---|---|---|---|
| GET | `/comunidade` | sim | Listar todos os mentorados ativos |

### Admin — Conteúdo

| Método | Path | Auth | Descrição |
|---|---|---|---|
| POST | `/admin/trilhas` | admin | Criar |
| PATCH | `/admin/trilhas/{id}` | admin | Editar |
| DELETE | `/admin/trilhas/{id}` | admin | Remover |
| POST | `/admin/trilhas/reordenar` | admin | Reordenar |
| POST | `/admin/modulos` | admin | Criar |
| PATCH | `/admin/modulos/{id}` | admin | Editar |
| DELETE | `/admin/modulos/{id}` | admin | Remover |
| POST | `/admin/modulos/reordenar` | admin | Reordenar |
| POST | `/admin/aulas` | admin | Criar |
| PATCH | `/admin/aulas/{id}` | admin | Editar |
| DELETE | `/admin/aulas/{id}` | admin | Remover |
| POST | `/admin/aulas/reordenar` | admin | Reordenar |

## Critérios de aceitação

- [ ] OpenAPI gerado bate com esta tabela.
- [ ] Endpoints autenticados retornam 401 sem token ou com token inválido.
- [ ] Endpoints admin retornam 403 com token de cliente.
- [ ] Formato de erro padronizado em todos os endpoints.
- [ ] Nenhum endpoint `/auth/*` exposto pelo backend.
