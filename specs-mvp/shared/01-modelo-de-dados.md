# Shared 01 — Modelo de Dados

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `shared/00-glossario`
**Bloqueia:** todas as specs de backend

---

## Convenções

- PKs em UUID v4. Para `usuario`, o UUID **bate com `auth.users.id` do Supabase** (FK + PK).
- Toda tabela tem `criado_em` default `now()`.
- Tabelas mutáveis têm `atualizado_em` mantido pela aplicação.
- Soft delete: `inativo` (bool) ou `apagado_em` (timestamp).

## Sobre autenticação

A autenticação é gerenciada pelo **Supabase Auth** (`auth.users`). Esta plataforma **não armazena senha** — Supabase faz isso.

A tabela `usuario` aqui descrita guarda **dados de perfil e aplicação** (nome, telefone, foto, role, etc.) e tem FK para `auth.users(id)`.

Há um **trigger** que cria automaticamente um registro em `public.usuario` toda vez que um novo usuário é criado em `auth.users` (via Admin API ou dashboard do Supabase). Esse trigger preenche `nome` a partir do `raw_user_meta_data` se disponível.

## DDL completo

```sql
-- Extensões
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Usuário (perfil + dados de aplicação)
create table public.usuario (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email citext not null unique,
  telefone text,
  linkedin_url text,
  instagram_username text,
  foto_url text,
  role text not null default 'cliente' check (role in ('cliente','admin')),
  inativo bool not null default false,
  criado_em timestamp not null default now(),
  atualizado_em timestamp not null default now()
);
create index usuario_role_idx on public.usuario(role);

-- Trigger: ao criar em auth.users, criar registro em public.usuario
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.usuario (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'cliente')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Trigger: ao atualizar email em auth.users, propagar
create or replace function public.handle_auth_user_email_change()
returns trigger as $$
begin
  if new.email is distinct from old.email then
    update public.usuario set email = new.email, atualizado_em = now() where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_email_changed
after update on auth.users
for each row execute function public.handle_auth_user_email_change();

-- Trilha
create table trilha (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  capa_url text,
  ordem int not null default 0,
  criado_em timestamp not null default now()
);

-- Módulo
create table modulo (
  id uuid primary key default gen_random_uuid(),
  trilha_id uuid not null references trilha(id) on delete cascade,
  titulo text not null,
  descricao text,
  ordem int not null default 0
);
create index modulo_trilha_idx on modulo(trilha_id);

-- Aula
create table aula (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references modulo(id) on delete cascade,
  titulo text not null,
  descricao text,
  drive_file_id text not null,
  duracao_minutos int,
  ordem int not null default 0,
  criado_em timestamp not null default now()
);
create index aula_modulo_idx on aula(modulo_id);

-- Progresso do aluno
create table aluno_aula (
  usuario_id uuid references public.usuario(id) on delete cascade,
  aula_id uuid references aula(id) on delete cascade,
  concluida_em timestamp not null default now(),
  primary key (usuario_id, aula_id)
);

-- Comentário (linear, sem threads)
create table comentario (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references aula(id) on delete cascade,
  usuario_id uuid not null references public.usuario(id) on delete cascade,
  texto text not null check (length(texto) between 1 and 2000),
  criado_em timestamp not null default now(),
  editado_em timestamp,
  apagado_em timestamp
);
create index comentario_aula_idx on comentario(aula_id, criado_em desc);

-- Métrica semanal
create table metrica_semanal (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuario(id) on delete cascade,
  semana_inicio date not null,
  ligacoes_agendadas int not null default 0 check (ligacoes_agendadas >= 0),
  ligacoes_realizadas int not null default 0 check (ligacoes_realizadas >= 0),
  reunioes_agendadas int not null default 0 check (reunioes_agendadas >= 0),
  indicacoes int not null default 0 check (indicacoes >= 0),
  criado_em timestamp not null default now(),
  atualizado_em timestamp not null default now(),
  unique (usuario_id, semana_inicio),
  check (extract(dow from semana_inicio) = 1)
);
create index metrica_usuario_semana_idx on metrica_semanal(usuario_id, semana_inicio desc);
```

## Observações

- **Tabela `refresh_token` removida** — Supabase Auth gerencia refresh tokens.
- Não há `senha_hash` em `public.usuario` — fica em `auth.users.encrypted_password`.
- `email` em `public.usuario` é denormalização (cópia) de `auth.users.email`, mantida por trigger. Permite queries rápidas sem JOIN.

## Row Level Security

Habilitar RLS em todas as tabelas. Backend usa `service_role` key (bypassa RLS), mas RLS protege contra acesso direto via PostgREST/SDK do Supabase.

```sql
alter table public.usuario enable row level security;
alter table trilha enable row level security;
alter table modulo enable row level security;
alter table aula enable row level security;
alter table aluno_aula enable row level security;
alter table comentario enable row level security;
alter table metrica_semanal enable row level security;
-- Sem policies abertas — backend usa service_role.
```

## Seed inicial

Admin inicial criado via script CLI (`scripts/criar_usuario.py`), que chama Admin API do Supabase. Ver `backend/02-usuarios-context`.

## Critérios de aceitação

- [ ] Migration inicial aplicada.
- [ ] Triggers `on_auth_user_created` e `on_auth_user_email_changed` ativos.
- [ ] Criar usuário via Supabase dashboard cria registro em `public.usuario` automaticamente.
- [ ] Alterar email em `auth.users` propaga para `public.usuario`.
- [ ] FKs com `on delete` definido.
- [ ] Constraints de check funcionando.
- [ ] RLS habilitado em todas as tabelas.
