export function formatCurrency(value: number): string {
  const amount = Math.max(0, Math.floor(value))
  const gold = Math.floor(amount / 10_000)
  const silver = Math.floor((amount % 10_000) / 100)
  const dong = amount % 100
  const parts: string[] = []
  if (gold > 0) parts.push(`${gold}금`)
  if (silver > 0) parts.push(`${silver}은`)
  if (dong > 0 || parts.length === 0) parts.push(`${dong.toLocaleString()}동`)
  return parts.join(' ')
}
