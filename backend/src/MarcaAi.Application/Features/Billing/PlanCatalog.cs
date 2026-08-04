namespace MarcaAi.Application.Features.Billing;

/// <summary>
/// Catálogo canônico dos planos no backend — **fonte da verdade da taxa de split por plano**.
/// Espelha `frontend/lib/plans/plan-config.ts` (Q1). Escada decrescente ("plano maior, taxa menor"):
/// Solo 10% → Solo Pro 5% → Clínica 2,49% → Clínica Pro 1,99%. Modelo **só percentual** (sem taxa
/// fixa por consulta — decisão de produto 2026-08-04).
/// </summary>
public static class PlanCatalog
{
    public const int SoloFeeBps = 1000;      // 10%   (plano free)
    public const int SoloProFeeBps = 500;    // 5%
    public const int ClinicaFeeBps = 249;    // 2,49%
    public const int ClinicaProFeeBps = 199; // 1,99%

    /// <summary>Códigos canônicos (iguais ao front). Trilha individual vs clínica.</summary>
    public const string Solo = "SOLO";
    public const string SoloPro = "SOLO_PRO";
    public const string Clinica = "CLINICA";
    public const string ClinicaPro = "CLINICA_PRO";

    /// <summary>
    /// feeBps por código de plano (case-insensitive). Default = Solo (plano free, 10%) — usado
    /// como taxa do recebedor individual sem assinatura mapeada.
    /// </summary>
    public static int FeeBpsFor(string? planCode) => Normalize(planCode) switch
    {
        Solo => SoloFeeBps,
        SoloPro => SoloProFeeBps,
        Clinica => ClinicaFeeBps,
        ClinicaPro => ClinicaProFeeBps,
        _ => SoloFeeBps,
    };

    /// <summary>É um plano da trilha clínica (multiprofissional)?</summary>
    public static bool IsClinicPlan(string? planCode) => Normalize(planCode) is Clinica or ClinicaPro;

    /// <summary>É um plano pago (não o Solo free)?</summary>
    public static bool IsPaid(string? planCode) => Normalize(planCode) is SoloPro or Clinica or ClinicaPro;

    /// <summary>Limites de uso por plano. `null` = ilimitado (espelha o front).</summary>
    public static PlanLimits LimitsFor(string? planCode) => Normalize(planCode) switch
    {
        SoloPro => new PlanLimits(null, 1, null),
        Clinica => new PlanLimits(null, 5, null),
        ClinicaPro => new PlanLimits(null, null, null),
        _ => new PlanLimits(50, 1, 3), // Solo (free)
    };

    // Features premium por plano (espelha `premiumFeatures` do plan-config.ts).
    private static readonly string[] SoloProFeatures = { "whatsapp_reminders" };
    private static readonly string[] ClinicaFeatures = { "team_finance", "whatsapp_reminders", "custom_branding" };
    private static readonly string[] ClinicaProFeatures =
        { "team_finance", "whatsapp_reminders", "custom_branding", "advanced_reports", "priority_support" };

    /// <summary>O plano inclui a feature premium indicada? (Solo free não inclui nenhuma.)</summary>
    public static bool HasFeature(string? planCode, string feature) => Normalize(planCode) switch
    {
        SoloPro => SoloProFeatures.Contains(feature),
        Clinica => ClinicaFeatures.Contains(feature),
        ClinicaPro => ClinicaProFeatures.Contains(feature),
        _ => false,
    };

    private static string Normalize(string? planCode) => (planCode ?? "").Trim().ToUpperInvariant();
}

/// <summary>Limites de uso de um plano (centavos/contagens). `null` = ilimitado.</summary>
public sealed record PlanLimits(int? MaxBookingsPerMonth, int? MaxMembers, int? MaxEventTypes);
