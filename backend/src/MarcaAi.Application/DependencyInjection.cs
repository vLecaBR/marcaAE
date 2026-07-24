using Microsoft.Extensions.DependencyInjection;

namespace MarcaAi.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Registro futuro de casos de uso / MediatR / validadores.
        // Mantido como ponto de extensão da Clean Architecture.
        return services;
    }
}
