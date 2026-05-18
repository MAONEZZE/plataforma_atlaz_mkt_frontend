# Shared 04 — Tratamento de Erros

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** `shared/02`
**Bloqueia:** todas as specs

---

## Formato único

```json
{
  "error": {
    "code": "CODIGO",
    "message": "Mensagem em PT-BR.",
    "details": { "campo": "..." }
  }
}
```

`details` é opcional, usado em erros de validação por campo.

## Catálogo de códigos

| Código | HTTP | Quando usar |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Pydantic ou validação simples |
| `BUSINESS_RULE_VIOLATION` | 422 | Regra de negócio (janela de edição, etc.) |
| `AUTH_INVALID_CREDENTIALS` | 401 | Login falhou |
| `AUTH_INACTIVE_ACCOUNT` | 403 | Conta inativa |
| `TOKEN_INVALID` | 401 | JWT inválido |
| `TOKEN_EXPIRED` | 401 | JWT expirado |
| `RESOURCE_NOT_FOUND` | 404 | Recurso inexistente |
| `RESOURCE_CONFLICT` | 409 | Conflito (email duplicado, métrica já existe) |
| `FORBIDDEN` | 403 | Sem permissão |
| `RATE_LIMIT_EXCEEDED` | 429 | Limite excedido |
| `INTERNAL_ERROR` | 500 | Erro não esperado |

## Handler global

```python
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(self, code: str, message: str, status: int, details: dict | None = None):
        self.code, self.message, self.status, self.details = code, message, status, details

@app.exception_handler(AppException)
async def app_exception_handler(req, exc: AppException):
    body = {"error": {"code": exc.code, "message": exc.message}}
    if exc.details: body["error"]["details"] = exc.details
    return JSONResponse(status_code=exc.status, content=body)

@app.exception_handler(RequestValidationError)
async def validation_handler(req, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": {
            "code": "VALIDATION_ERROR",
            "message": "Dados inválidos.",
            "details": {".".join(map(str, e["loc"])): e["msg"] for e in exc.errors()},
        }},
    )
```

## Mensagens — diretrizes

- PT-BR, voz ativa, sem jargão técnico.
- Não vazar detalhes internos.
- Validações: nomear o campo e o que corrigir.

Bons exemplos:
- "Email já cadastrado."
- "Você só pode editar métricas das últimas 4 semanas."
- "Senha deve ter ao menos 8 caracteres, 1 maiúscula e 1 número."

## Logging

- 4xx: `warning` com path, usuario_id, código.
- 5xx: `error` + Sentry com traceback.
- Nunca logar: senhas, tokens, conteúdo de comentários.

## Critérios de aceitação

- [ ] Handler global ativo.
- [ ] Todos os códigos do catálogo testados ao menos uma vez.
- [ ] Mensagens em PT-BR.
- [ ] Sentry capturando 5xx em produção.
