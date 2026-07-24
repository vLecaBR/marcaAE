using System.Data;
using MarcaAi.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using NpgsqlTypes;

namespace MarcaAi.Infrastructure.Persistence.Concurrency;

/// <summary>
/// Implementação da trava pessimista anti double-booking.
///
/// Estratégia acordada: nível de isolamento PADRÃO (Read Committed) + bloqueio de linha
/// via SELECT ... FOR UPDATE SKIP LOCKED. Deve rodar DENTRO de uma transação aberta pelo
/// caso de uso, e ANTES do INSERT do agendamento. SKIP LOCKED evita espera: se outra
/// transação já travou a linha concorrente, ela é ignorada aqui e o INSERT do concorrente
/// falhará/serializará no fluxo dele.
///
/// Observação: SQL parametrizado (sem interpolação de strings) — sem risco de injeção.
/// </summary>
public sealed class BookingConcurrencyGuard(ApplicationDbContext db) : IBookingConcurrencyGuard
{
    private const string Sql = """
        SELECT id FROM bookings
        WHERE "userId" = @ownerId
          AND status IN ('CONFIRMED', 'PENDING')
          AND "startTime" < @endUtc
          AND "endTime"   > @startUtc
        FOR UPDATE SKIP LOCKED
        """;

    public async Task<bool> HasConflictAsync(
        string ownerId,
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken cancellationToken = default)
    {
        var connection = (NpgsqlConnection)db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var cmd = connection.CreateCommand();
        cmd.CommandText = Sql;

        // Enlista na transação atual do DbContext (obrigatório p/ o lock valer).
        var currentTx = db.Database.CurrentTransaction?.GetDbTransaction();
        if (currentTx is NpgsqlTransaction npgTx)
            cmd.Transaction = npgTx;

        cmd.Parameters.Add(new NpgsqlParameter("ownerId", NpgsqlDbType.Text) { Value = ownerId });
        cmd.Parameters.Add(new NpgsqlParameter("startUtc", NpgsqlDbType.TimestampTz) { Value = startUtc });
        cmd.Parameters.Add(new NpgsqlParameter("endUtc", NpgsqlDbType.TimestampTz) { Value = endUtc });

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken); // true = existe conflito
    }
}
