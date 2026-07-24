using MarcaAi.Application.Common.Interfaces;
using MarcaAi.Infrastructure.Identity;
using MarcaAi.Infrastructure.Persistence;
using MarcaAi.Infrastructure.Persistence.Concurrency;
using MarcaAi.Infrastructure.Persistence.Interceptors;
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

        // NpgsqlDataSource com enums nativos mapeados (labels preservados).
        var translator = new PreserveCaseNameTranslator();
        var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
        // Pooler do Supabase (session mode) limita ~15 clients. Pool pequeno p/ o app;
        // o Hangfire usa outro pool pequeno (ver Program.cs). Total < 15.
        dataSourceBuilder.ConnectionStringBuilder.MaxPoolSize = 5;
        dataSourceBuilder.ConnectionStringBuilder.ApplicationName = "marcaai-api";
        dataSourceBuilder.MapEnum<Domain.Enums.Theme>("Theme", translator);
        dataSourceBuilder.MapEnum<Domain.Enums.TeamRole>("TeamRole", translator);
        dataSourceBuilder.MapEnum<Domain.Enums.EventTypeColor>("EventTypeColor", translator);
        dataSourceBuilder.MapEnum<Domain.Enums.LocationType>("LocationType", translator);
        dataSourceBuilder.MapEnum<Domain.Enums.QuestionType>("QuestionType", translator);
        dataSourceBuilder.MapEnum<Domain.Enums.ExceptionType>("ExceptionType", translator);
        dataSourceBuilder.MapEnum<Domain.Enums.BookingStatus>("BookingStatus", translator);
        dataSourceBuilder.MapEnum<Domain.Enums.PaymentStatus>("PaymentStatus", translator);
        dataSourceBuilder.MapEnum<Domain.Enums.CanceledBy>("CanceledBy", translator);
        var dataSource = dataSourceBuilder.Build();
        services.AddSingleton(dataSource);

        services.AddSingleton<AuditableInterceptor>();

        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.UseNpgsql(sp.GetRequiredService<NpgsqlDataSource>(), npg =>
            {
                npg.MigrationsHistoryTable("__ef_migrations_history");
            });
            options.AddInterceptors(sp.GetRequiredService<AuditableInterceptor>());
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IBookingConcurrencyGuard, BookingConcurrencyGuard>();
        services.AddSingleton<ICuidGenerator, CuidGenerator>();

        return services;
    }
}
