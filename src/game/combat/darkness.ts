export function calculateDarknessDamageMultiplier(options: { darknessRate: number; additiveScalingFactors?: number[]; multiplicativeModifiers?: number[] }): number {
  const darkness = Math.min(1, Math.max(0, Number.isFinite(options.darknessRate) ? options.darknessRate : 0))
  const additive = (options.additiveScalingFactors ?? []).reduce((sum, value) => sum + (Number.isFinite(value) ? value * darkness : 0), 0)
  return Math.max(0, (options.multiplicativeModifiers ?? []).reduce((value, modifier) => value * (Number.isFinite(modifier) ? modifier : 1), 1 + additive))
}