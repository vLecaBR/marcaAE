using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Infrastructure.Bookings;
using MarcaAi.Infrastructure.Email;
using MarcaAi.Infrastructure.Identity;
using MarcaAi.Infrastructure.Persistence;
using MarcaAi.Infrastructure.Persistence.Concurrency;
using MarcaAi.Infrastructure.Persistence.Interceptors;
using MarcaAi.Infrastructure.Scheduling;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace MarcaAi.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default não configurada.");

        // Pool pequeno p/ o pooler do Supabase (session mode ~15 clients). Hangfire usa outro pool.
        var connString = new NpgsqlConnectionStringBuilder(connectionString)
        {
            MaxPoolSize = 5,
            ApplicationName = "marcaai-api",
        }.ConnectionString;

        // Enums NATIVOS do Postgres — EF 9+/10: o MapEnum vai DENTRO do UseNpgsql.
        // Isso configura o EF (tipo da coluna + CREATE TYPE nas migrations) E a camada ADO do Npgsql.
        // O translator preserva os labels exatos (DARK, GOOGLE_MEET, NO_SHOW...).
        var translator = new PreserveCaseNameTranslator();

        services.AddSingleton<AuditableInterceptor>();

        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.UseNpgsql(connString, npg =>
            {
                npg.MigrationsHistoryTable("__ef_migrations_history");
                npg.MapEnum<Domain.Enums.Theme>("Theme", nameTranslator: translator);
                npg.MapEnum<Domain.Enums.TeamRole>("TeamRole", nameTranslator: translator);
                npg.MapEnum<Domain.Enums.EventTypeColor>("EventTypeColor", nameTranslator: translator);
                npg.MapEnum<Domain.Enums.LocationType>("LocationType", nameTranslator: translator);
                npg.MapEnum<Domain.Enums.QuestionType>("QuestionType", nameTranslator: translator);
                npg.MapEnum<Domain.Enums.ExceptionType>("ExceptionType", nameTranslator: translator);
                npg.MapEnum<Domain.Enums.BookingStatus>("BookingStatus", nameTranslator: translator);
                npg.MapEnum<Domain.Enums.PaymentStatus>("PaymentStatus", nameTranslator: translator);
                npg.MapEnum<Domain.Enums.CanceledBy>("CanceledBy", nameTranslator: translator);
            });
            options.AddInterceptors(sp.GetRequiredService<AuditableInterceptor>());
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IBookingConcurrencyGuard, BookingConcurrencyGuard>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IAvailabilityService, AvailabilityService>();
        services.AddScoped<IUserProvisioning, UserProvisioning>();
        services.AddScoped<IMagicLinkSender, LoggingMagicLinkSender>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
