# Shared 03 — Autenticação e Autorização

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `shared/01`, `shared/02`
**Bloqueia:** `backend/01-auth-context`, `frontend/03-login-screen`

---

## Arquitetura

A plataforma usa **Supabase Auth** como provedor de identidade.

- **Frontend** fala diretamente com o Supabase via SDK (`@supabase/supabase-js`) para: login, logout, refresh de tokens, troca de email e senha.
- **Backend** (FastAPI) **não emite tokens**. Apenas valida tokens recebidos no header `Authorization` e extrai a identidade do usuário.

### Por que isso

- Reduz código de auth a quase zero no backend.
- Supabase gerencia hash bcrypt, rotação de refresh, segurança de tokens.
- Sincronia entre `auth.users` e `public.usuario` é feita por triggers no Postgres.

## Identidade e papéis

- Dois papéis: `cliente` e `admin`. Coluna `public.usuario.role`.
- Cliente: vê apenas dados próprios + conteúdo + comunidade.
- Admin: vê tudo, gerencia trilhas + dashboard consolidado.

Role **não é mantido em `auth.users`**. Vive apenas em `public.usuario.role`. Backend lê de lá em toda request.

## JWT do Supabase

- Algoritmo: **HS256** (default Supabase).
- Secret usado para assinar: `SUPABASE_JWT_SECRET` (encontrado em Project Settings → API → JWT Settings).
- Access token: válido por 1 hora (default Supabase).
- Refresh token: gerenciado pelo SDK do frontend.

Payload típico do access token Supabase:
```json
{
  "sub": "uuid do auth.users",
  "email": "...",
  "aud": "authenticated",
  "exp": 1234567890,
  "iat": 1234567890,
  "role": "authenticated",
  "user_metadata": { ... }
}
```

> Note que `role` no token diz `"authenticated"` (papel do Supabase), **não** o papel da nossa aplicação. O papel da aplicação é buscado em `public.usuario.role`.

## Fluxos

### Login (no frontend)

1. Usuário preenche email + senha em `/login`.
2. Frontend chama `supabase.auth.signInWithPassword({ email, senha })`.
3. Supabase retorna `{ access_token, refresh_token, user }`.
4. SDK do Supabase armazena tokens automaticamente (localStorage por default, configurável).
5. Frontend faz `GET /me` à API FastAPI para buscar dados completos do perfil.
6. Redireciona para `/dashboard`.

Erros possíveis:
- Credenciais inválidas: SDK lança erro com `message: "Invalid login credentials"`.
- Conta inativa (cliente): tratado pelo backend em `/me` — retorna 403, frontend exibe mensagem e desloga.

### Logout (no frontend)

1. Frontend chama `supabase.auth.signOut()`.
2. SDK limpa tokens e revoga sessão no Supabase.
3. Redireciona para `/login`.

### Troca de email

1. Frontend chama `supabase.auth.updateUser({ email })`.
2. Supabase envia email de confirmação (configurável).
3. Trigger em `auth.users` propaga o novo email para `public.usuario`.

### Troca de senha

1. Frontend chama `supabase.auth.updateUser({ password })`.
2. SDK atualiza no Supabase.

### Reset de senha (fora do MVP)

Não está no MVP. Admin reseta direto no banco do Supabase se algum mentorado esquecer. Futuramente, basta habilitar `supabase.auth.resetPasswordForEmail()` no frontend — Supabase já tem isso pronto.

## Validação de token no backend

```python
# core/security.py
from jose import jwt, JWTError
from app.core.config import settings

def decode_supabase_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError as e:
        raise TokenInvalido(str(e))
```

### Dependency `get_current_user`

```python
# core/deps.py
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    repo: UsuarioRepository = Depends(get_usuario_repo),
) -> Usuario:
    payload = decode_supabase_jwt(token)
    user_id = UUID(payload["sub"])
    user = await repo.por_id(user_id)
    if not user:
        # Caso raro: existe em auth.users mas não em public.usuario.
        # Trigger deveria ter criado, mas como fallback retorna 401.
        raise AppException("TOKEN_INVALID", "Usuário não encontrado.", 401)
    if user.inativo:
        raise AppException("AUTH_INACTIVE_ACCOUNT", "Conta inativa.", 403)
    return user

async def require_admin(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.role != 'admin':
        raise AppException("FORBIDDEN", "Apenas administradores.", 403)
    return user
```

## Criação de usuários

Não há cadastro público. Admin cria via **script CLI** (`scripts/criar_usuario.py`), que chama a Admin API do Supabase.

Fluxo do script:
1. Chama `supabase.auth.admin.create_user({ email, password, user_metadata: { nome, role }, email_confirm: true })`.
2. Trigger `on_auth_user_created` cria registro em `public.usuario` automaticamente, com `role` vindo do `user_metadata`.
3. Script imprime sucesso.

Detalhes em `backend/02-usuarios-context`.

## Rate limiting

Como o login não passa pelo backend, **não precisamos limitar `/auth/login`**. Supabase já tem proteção própria.

Para endpoints da nossa API, usar `slowapi` com 60 req/min por usuário, suficiente para o MVP.

## CORS

- Apenas o domínio do frontend em produção.
- Em dev: `http://localhost:3000`.

## Headers de segurança

- HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy.

## Críticos para o backend lembrar

1. **Confiar apenas no JWT do Supabase**, não em headers customizados de role.
2. **Buscar o role do banco**, não do token (token só tem `authenticated`).
3. Em `/me`, **se o usuário existir em `auth.users` mas não em `public.usuario`** (falha de trigger), tratar como erro 401 — não tentar criar na hora (evita race conditions).

## Critérios de aceitação

- [ ] Backend valida tokens Supabase com `SUPABASE_JWT_SECRET`.
- [ ] `get_current_user` busca role de `public.usuario`, não do token.
- [ ] Usuário inativo recebe 403 em qualquer endpoint.
- [ ] Token expirado ou inválido recebe 401.
- [ ] Endpoint admin com cliente recebe 403.
- [ ] Headers de segurança presentes.
- [ ] CORS bloqueia origens não autorizadas em produção.
- [ ] **Nenhum endpoint `/auth/*` exposto no backend.**
