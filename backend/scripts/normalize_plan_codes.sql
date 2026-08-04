-- =============================================================================
-- MarcaAí — Q7 · Normalização de PlanCode legado (Ponto Cego #6)
-- -----------------------------------------------------------------------------
-- Converte os códigos antigos (minúsculos, modelo de 3 planos) para os novos
-- códigos canônicos (modelo de 4 planos, PlanCatalog) e preenche defaultFeeBps
-- quando estiver nulo. Idempotente: rodar mais de uma vez não causa dano.
--
-- Mapeamento (assinaturas de CLÍNICA — tabela "subscriptions"):
--   "solo"      -> "CLINICA"      (raro; assinaturas de clínica não deveriam ser "solo",
--                                  mas se existirem, migram para o menor plano de clínica)
--   "clinica"   -> "CLINICA"      (2,49%)
--   "pro"       -> "CLINICA_PRO"  (1,99%)  ← o antigo "pro" é o topo de clínica
--
-- Executar com:  psql "$DATABASE_URL" -f backend/scripts/normalize_plan_codes.sql
-- (ou aplicar via ferramenta de migração). As colunas planCode/defaultFeeBps já
-- existem desde a migração AddFinancialSplit.
-- =============================================================================

BEGIN;

-- pro -> CLINICA_PRO (1,99% = 199 bps)
UPDATE subscriptions
   SET "planCode" = 'CLINICA_PRO',
       "defaultFeeBps" = COALESCE("defaultFeeBps", 199)
 WHERE lower("planCode") = 'pro';

-- clinica -> CLINICA (2,49% = 249 bps)
UPDATE subscriptions
   SET "planCode" = 'CLINICA',
       "defaultFeeBps" = COALESCE("defaultFeeBps", 249)
 WHERE lower("planCode") = 'clinica';

-- solo (legado em clínica) -> CLINICA (2,49%): clínicas são multiprofissionais
UPDATE subscriptions
   SET "planCode" = 'CLINICA',
       "defaultFeeBps" = COALESCE("defaultFeeBps", 249)
 WHERE lower("planCode") = 'solo';

-- Normaliza QUALQUER código já novo porém gravado com caixa/spacing divergente.
UPDATE subscriptions
   SET "planCode" = upper(trim("planCode"))
 WHERE "planCode" IS NOT NULL
   AND "planCode" <> upper(trim("planCode"));

-- Preenche defaultFeeBps ainda nulo a partir do planCode canônico (fallback de segurança).
UPDATE subscriptions SET "defaultFeeBps" = 1000 WHERE "defaultFeeBps" IS NULL AND upper(trim("planCode")) = 'SOLO';
UPDATE subscriptions SET "defaultFeeBps" = 500  WHERE "defaultFeeBps" IS NULL AND upper(trim("planCode")) = 'SOLO_PRO';
UPDATE subscriptions SET "defaultFeeBps" = 249  WHERE "defaultFeeBps" IS NULL AND upper(trim("planCode")) = 'CLINICA';
UPDATE subscriptions SET "defaultFeeBps" = 199  WHERE "defaultFeeBps" IS NULL AND upper(trim("planCode")) = 'CLINICA_PRO';

COMMIT;
