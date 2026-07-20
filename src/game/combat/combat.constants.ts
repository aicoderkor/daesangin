export const COMBAT_BALANCE = {
  damageRange: {
    warrior: { min: 0.85, max: 1.15 },
    archer: { min: 0.9, max: 1.1 },
    rogue: { min: 0.75, max: 1.25 },
    mage: { min: 0.95, max: 1.05 },
  },
  baseCriticalMultiplier: 1.5,
  defenseStatHitDivisor: 5,
  zeroStatHitRate: 0,
  defaultFocusBonusRate: 0.15,
  baseFireDamageRate: 0.05,
  constitutionFireReductionDivisor: 10,
  baseHealingDamageRatio: 0.5,
  baseRegenerationRate: 0.06,
} as const