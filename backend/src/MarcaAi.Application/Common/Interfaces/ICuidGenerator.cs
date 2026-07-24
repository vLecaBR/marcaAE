namespace MarcaAi.Application.Common.Interfaces;

/// <summary>Gera CUIDs na aplicação (compat. com o comportamento do Prisma cuid()).</summary>
public interface ICuidGenerator
{
    string NewCuid();
}
