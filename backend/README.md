# MarcaAí — Backend API (.NET 10 · Clean Architecture)

Backend desacoplado do MarcaAí (Healthtech — agendamento para profissionais da saúde).
Substitui as Server Actions / API Routes do Next.js. O PostgreSQL existente é mantido.

## Camadas

- **MarcaAi.Domain** — entidades e enums. Zero dependências de infraestrutura.
- **MarcaAi.Application** — casos de uso, interfaces (portas), DTOs. Depende só do Domain.
- **MarcaAi.Infrastructure** — EF Core (Npgsql), CUID, concorrência SKIP LOCKED, integrações.
- **MarcaAi.Api** — ASP.NET Core: DI, ProblemDetails, Hangfire, Auth (Cookie HttpOnly + JWT + Google OIDC).

## Decisões arquiteturais firmadas

| Tema | Decisão |
|---|---|
| Schema | Scaffold manual (database-first) → daqui em diante **code-first** no EF Core. Prisma descartado. |
| IDs | **CUID** gerado na aplicação via `Visus.Cuid` (compat. com dados/URLs existentes). |
| Enums | Enums **nativos do Postgres** mapeados via `MapEnum<T>()` no Npgsql (name translator preserva os labels). |
| Concorrência | `Read Committed` + `SELECT ... FOR UPDATE SKIP LOCKED` (Raw SQL parametrizado). Retry com **Polly** depois, se necessário. |
| Token | Cookie **HttpOnly + Secure + SameSite=Strict** carregando JWT. CORS credenciado + Antiforgery (CSRF). |
| Login | Magic Link (v1) + Google OIDC. |
| Jobs | **Hangfire** sobre PostgreSQL (lembretes de consulta / no-show). |

## Como rodar (na sua máquina)

```bash
cd backend
dotnet restore
dotnet build
# Config: defina ConnectionStrings__Default e as chaves em appsettings.Development.json ou variáveis de ambiente.
dotnet run --project src/MarcaAi.Api
```

> O scaffold foi feito à mão a partir de `prisma/schema.prisma`. As colunas usam os nomes
> **camelCase** originais (ex.: `userId`, `startTime`) via `HasColumnName`, preservando o banco atual.
