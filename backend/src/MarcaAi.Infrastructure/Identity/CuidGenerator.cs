using MarcaAi.Application.Common.Interfaces;
using Visus.Cuid;

namespace MarcaAi.Infrastructure.Identity;

/// <summary>Gera CUIDs compatíveis com o Prisma cuid() via biblioteca Visus.Cuid.</summary>
public sealed class CuidGenerator : ICuidGenerator
{
    public string NewCuid() => Cuid.NewCuid().ToString();
}
