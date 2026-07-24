using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.ValueGeneration;
using Visus.Cuid;

namespace MarcaAi.Infrastructure.Persistence.ValueGenerators;

/// <summary>
/// ValueGenerator do EF Core que produz CUIDs na aplicação, no momento do INSERT,
/// replicando exatamente o comportamento do Prisma (@default(cuid())).
/// </summary>
public sealed class CuidValueGenerator : ValueGenerator<string>
{
    public override bool GeneratesTemporaryValues => false;

    public override string Next(EntityEntry entry) => Cuid.NewCuid().ToString();
}
