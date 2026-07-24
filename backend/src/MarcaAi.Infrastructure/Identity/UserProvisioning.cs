using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MarcaAi.Infrastructure.Identity;

/// <summary>
/// Localiza ou cria o usuário por e-mail. Ao criar, semeia a "Agenda Padrão" (seg–sex 09:00–18:00),
/// replicando o evento createUser do NextAuth (auth.ts). IDs (User/Schedule/Availability) são
/// gerados por CUID pelo value generator do EF ao salvar.
/// </summary>
public sealed class UserProvisioning(IApplicationDbContext db) : IUserProvisioning
{
    public async Task<User> FindOrCreateByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();

        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == normalized, cancellationToken);
        if (existing is not null) return existing;

        var user = new User
        {
            Email = normalized,
            EmailVerified = DateTime.UtcNow,
            Onboarded = false,
            Schedules =
            {
                new Schedule
                {
                    Name = "Agenda Padrão",
                    TimeZone = "America/Sao_Paulo",
                    IsDefault = true,
                    Availabilities =
                    {
                        new ScheduleAvailability { DayOfWeek = 1, StartTime = "09:00", EndTime = "18:00" },
                        new ScheduleAvailability { DayOfWeek = 2, StartTime = "09:00", EndTime = "18:00" },
                        new ScheduleAvailability { DayOfWeek = 3, StartTime = "09:00", EndTime = "18:00" },
                        new ScheduleAvailability { DayOfWeek = 4, StartTime = "09:00", EndTime = "18:00" },
                        new ScheduleAvailability { DayOfWeek = 5, StartTime = "09:00", EndTime = "18:00" },
                    },
                },
            },
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        return user;
    }
}
