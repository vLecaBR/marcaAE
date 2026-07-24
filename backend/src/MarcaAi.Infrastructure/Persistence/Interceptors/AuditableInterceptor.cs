using MarcaAi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace MarcaAi.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Preenche createdAt/updatedAt (o Prisma fazia isso via @default(now()) e @updatedAt).
/// Mantém o comportamento agora na camada de infraestrutura.
/// </summary>
public sealed class AuditableInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        if (context is not null) Touch(context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void Touch(DbContext context)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified)) continue;

            // createdAt somente na inserção; updatedAt sempre (onde as props existirem).
            SetIfExists(entry, "CreatedAt", now, onlyWhenAdded: true, added: entry.State == EntityState.Added);
            SetIfExists(entry, "UpdatedAt", now, onlyWhenAdded: false, added: entry.State == EntityState.Added);
        }
    }

    private static void SetIfExists(
        Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry,
        string prop, DateTime value, bool onlyWhenAdded, bool added)
    {
        var member = entry.Metadata.FindProperty(prop);
        if (member is null || member.ClrType != typeof(DateTime)) return;
        if (onlyWhenAdded && !added) return;
        entry.Property(prop).CurrentValue = value;
    }
}
