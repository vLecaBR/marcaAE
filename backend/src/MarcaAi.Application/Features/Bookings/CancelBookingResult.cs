namespace MarcaAi.Application.Features.Bookings;

public enum CancelOutcome { Success, NotFound, AlreadyCancelled }

public sealed record CancelBookingRequest(string? Reason, string? CanceledBy);

public sealed record CancelBookingResult(CancelOutcome Outcome, string? Message = null);
