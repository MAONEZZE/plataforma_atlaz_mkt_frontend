# Shared 00 — Glossário

**Status:** pronto-para-implementar
**Owner:** —
**Depende de:** —
**Bloqueia:** todas as outras specs (leitura obrigatória)

---

## Domínio

| Termo | Definição |
|---|---|
| **Atlaz / Atlas Sales** | Empresa que opera a plataforma. |
| **Mentorado** | Cliente da Atlaz. Usuário com `role='cliente'`. |
| **Admin** | Membro da equipe Atlaz. Usuário com `role='admin'`. |
| **Trilha** | Container de conteúdo. Agrupa módulos. |
| **Módulo** | Subdivisão de trilha. Agrupa aulas. |
| **Aula** | Vídeo individual. Hospedado no Google Drive, embed via iframe. |
| **Métrica semanal** | Registro de atividade do mentorado em uma semana. 4 campos: ligações agendadas/realizadas, reuniões agendadas, indicações. |
| **Semana** | Identificada pela segunda-feira (data ISO). |
| **Comunidade** | Diretório de mentorados. Cada um vira um card com foto, nome, links LinkedIn/Instagram. |

## Técnico

| Termo | Definição |
|---|---|
| **Bounded context** | Em DDD, área coesa do domínio com modelo próprio. Ex: auth, conteudo. |
| **Entidade de domínio** | Objeto Python puro com regras de negócio, sem dependência de framework. |
| **Repository** | Interface no domain abstraindo persistência. Implementação concreta no infrastructure. |
| **Use Case** | Coordena uma operação de negócio. Recebe DTO, chama domain + repository, retorna DTO. |
| **DTO** | Data Transfer Object. Modelo Pydantic. |
| **Soft delete** | `inativo=true` ou `apagado_em=now()` em vez de delete real. |
| **Janela de edição** | 4 semanas — período em que o cliente pode editar suas próprias métricas. |

## Identificação de semana

Toda métrica usa **data da segunda-feira** da semana. Normalização:

```python
def normalize_to_monday(d: date) -> date:
    return d - timedelta(days=d.weekday())
```

Backend sempre normaliza antes de salvar. Front mostra "Semana de DD/MM a DD/MM" para o usuário.

## Convenções de naming

- Tabelas e colunas: `snake_case`.
- Endpoints: `/api/v1/recurso-kebab-case`.
- Classes Python: `PascalCase`. Arquivos: `snake_case.py`.
- Componentes React: `PascalCase.tsx`.
- CSS variables: `--kebab-case`.
