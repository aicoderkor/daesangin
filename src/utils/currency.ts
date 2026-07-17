export function formatCurrency(value: number): string {
  return `${Math.max(0, Math.floor(value)).toLocaleString()}동`
}
