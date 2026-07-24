using Npgsql;

namespace MarcaAi.Infrastructure.Persistence;

/// <summary>
/// Mantém os labels dos enums exatamente como estão no Postgres (criados pelo Prisma:
/// DARK, GOOGLE_MEET, NO_SHOW ...). Sem isso, o Npgsql aplicaria snake_case e quebraria
/// o mapeamento com o banco existente.
/// </summary>
public sealed class PreserveCaseNameTranslator : INpgsqlNameTranslator
{
    public string TranslateTypeName(string clrName) => clrName;
    public string TranslateMemberName(string clrName) => clrName;
}
