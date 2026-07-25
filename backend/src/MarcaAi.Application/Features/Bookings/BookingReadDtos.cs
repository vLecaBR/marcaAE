using MarcaAi.Domain.Enums;

namespace MarcaAi.Application.Features.Bookings;

/// <summary>Item da lista de consultas do profissional (dashboard).</summary>
public sealed record BookingListItemDto(
    string Uid,
    string GuestName,
    string GuestEmail,
    string? GuestPhone,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    BookingStatus Status,
    string EventTitle,
    string? MeetingUrl,
    PaymentStatus PaymentStatus);

/// <summary>Detalhe público da consulta (página de confirmação por uid).</summary>
public sealed record BookingDetailDto(
    string Uid,
    string GuestName,
    string GuestEmail,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    BookingStatus Status,
    string EventTitle,
    string OwnerName,
    string? MeetingUrl,
    string GuestTimeZone);
