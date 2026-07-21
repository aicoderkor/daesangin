import type { CombatStatusEffect, StatusEffectId } from '../../types/game'

export const STATUS_EFFECTS: Record<StatusEffectId, { name: string; description: string }> = {
  ablaze: { name: '화염', description: '매 턴 최대 체력의 5% 피해' },
  poison: { name: '중독', description: '가하는 피해 20% 감소' },
  anointed: { name: '기름 부음(신성)', description: '가하는 피해 25% 증가' },
  inspire: { name: '영감', description: '가하는 피해 25% 증가' },
  exalt: { name: '고양', description: '가하는 피해 25% 증가, 받는 피해 5 감소' },
  frenzy: { name: '격분', description: '가하는 피해 30% 증가' },
  delirium: { name: '섬망', description: '가하는 피해 2배' },
  freeze: { name: '빙결', description: '회피 불가, 매 턴 물리 피해 10' },
  bleed: { name: '출혈', description: '출혈 스택만큼 피해 후 1스택 감소' },
  defensive_stance: { name: '방어태세', description: '다음 피해를 막음' },
  regeneration: { name: '재생', description: '매 턴 최대 체력의 6% 회복' },
  stun: { name: '기절', description: '차례를 건너뜀' },
  silence: { name: '침묵', description: '스킬 사용 및 마나 획득 불가' },
  taunt: { name: '도발', description: '도발한 유닛을 우선 공격' },
  petrify: { name: '석화', description: '회피 불가, 받는 피해 15% 증가, 차례를 건너뜀' },
  curse: { name: '저주', description: '저주 효과(소환 기능은 추후 구현)' },
  terrify: { name: '공포', description: '차례를 건너뛰고 최대 체력의 20% 마법 피해' },
}

export function addStatusEffect(current: CombatStatusEffect[] | undefined, effect: CombatStatusEffect): CombatStatusEffect[] {
  const list = [...(current ?? [])]
  const existing = list.find((item) => item.id === effect.id)
  if (existing) { existing.turns = Math.max(existing.turns, effect.turns); existing.stacks += effect.stacks } else list.push({ ...effect })
  return list
}

export function hasStatus(statuses: CombatStatusEffect[] | undefined, id: StatusEffectId): boolean {
  return (statuses ?? []).some((status) => status.id === id && status.turns > 0)
}
