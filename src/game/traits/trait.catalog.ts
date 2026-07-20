import { TRAIT_VALUES as V } from './trait.constants'
import type { PrimaryTraitId, SecondaryTraitId, TraitDefinition, TraitId } from './trait.types'

export const PRIMARY_TRAIT_IDS: readonly PrimaryTraitId[] = ['large', 'wild', 'bookworm', 'large_plus', 'wild_plus', 'bookworm_plus']
export const SECONDARY_TRAIT_IDS: readonly SecondaryTraitId[] = ['troll_blood', 'dragon_blood', 'blessed', 'alert', 'careful', 'agile', 'dangerous', 'reactive', 'empathy', 'curse', 'nocturnal', 'talent', 'merciless', 'focus']
export const TRAIT_CATALOG: Record<TraitId, TraitDefinition> = {
  large: { id: 'large', name: '거구', group: 'primary', description: '체질 +10%, 민첩 -5%, 지능 -5%', effects: [{ type: 'stat_percent', stat: 'constitution', value: .1 }, { type: 'stat_percent', stat: 'dexterity', value: -.05 }, { type: 'stat_percent', stat: 'intelligence', value: -.05 }] },
  wild: { id: 'wild', name: '야생', group: 'primary', description: '민첩 +10%, 체질 -5%, 지능 -5%', effects: [{ type: 'stat_percent', stat: 'dexterity', value: .1 }, { type: 'stat_percent', stat: 'constitution', value: -.05 }, { type: 'stat_percent', stat: 'intelligence', value: -.05 }] },
  bookworm: { id: 'bookworm', name: '책벌레', group: 'primary', description: '지능 +10%, 체질 -5%, 민첩 -5%', effects: [{ type: 'stat_percent', stat: 'intelligence', value: .1 }, { type: 'stat_percent', stat: 'constitution', value: -.05 }, { type: 'stat_percent', stat: 'dexterity', value: -.05 }] },
  large_plus: { id: 'large_plus', name: '거구+', group: 'primary', description: '체질 +15%', effects: [{ type: 'stat_percent', stat: 'constitution', value: .15 }] },
  wild_plus: { id: 'wild_plus', name: '야생+', group: 'primary', description: '민첩 +15%', effects: [{ type: 'stat_percent', stat: 'dexterity', value: .15 }] },
  bookworm_plus: { id: 'bookworm_plus', name: '책벌레+', group: 'primary', description: '지능 +15%', effects: [{ type: 'stat_percent', stat: 'intelligence', value: .15 }] },
  troll_blood: { id: 'troll_blood', name: '트롤의 혈통', group: 'secondary', description: '매 턴 유닛 티어당 HP 1 재생', effects: [{ type: 'turn_regeneration_per_tier', value: V.trollRegenerationPerTier }] },
  dragon_blood: { id: 'dragon_blood', name: '용의 혈통', group: 'secondary', description: '유닛 티어당 피해 감소 1', effects: [{ type: 'damage_reduction_per_tier', value: V.dragonReductionPerTier }] },
  blessed: { id: 'blessed', name: '축복받은', group: 'secondary', description: '어둠 수치 8 감소', effects: [{ type: 'darkness_flat_reduction', value: V.blessedDarknessReduction }] },
  alert: { id: 'alert', name: '경계', group: 'secondary', description: '먼저 전투를 시작', effects: [{ type: 'initiative_priority', value: V.initiativePriority }] },
  careful: { id: 'careful', name: '주의깊은', group: 'secondary', description: '상태이상 면역 확률 +10%', effects: [{ type: 'status_immunity', value: V.statusImmunityRate }] },
  agile: { id: 'agile', name: '민첩한', group: 'secondary', description: '회피 확률 +8%p', effects: [{ type: 'dodge_additive', value: V.dodgeRate }] },
  dangerous: { id: 'dangerous', name: '위험', group: 'secondary', description: '도발 효과 ×2', effects: [{ type: 'threat_multiplier', value: V.threatMultiplier }] },
  reactive: { id: 'reactive', name: '반응적인', group: 'secondary', description: '반격 확률 +10%p', effects: [{ type: 'counter_additive', value: V.counterRate }] },
  empathy: { id: 'empathy', name: '공감', group: 'secondary', description: '치유량 +20%', effects: [{ type: 'healing_multiplier', value: V.healingMultiplier }] },
  curse: { id: 'curse', name: '저주', group: 'secondary', description: '매 턴 HP -4%, 생명력 흡수 +15%', effects: [{ type: 'turn_hp_loss_rate', value: V.curseHpLossRate }, { type: 'lifesteal_additive', value: V.curseLifestealRate }] },
  nocturnal: { id: 'nocturnal', name: '야행성', group: 'secondary', description: '어둠 수치 ×0.5%만큼 피해 증가', effects: [{ type: 'darkness_damage_scaling', value: V.nocturnalDarknessScaling }] },
  talent: { id: 'talent', name: '재능', group: 'secondary', description: 'MP 재생 +2', effects: [{ type: 'mana_regeneration_flat', value: V.manaRegenerationFlat }] },
  merciless: { id: 'merciless', name: '무자비', group: 'secondary', description: '최종 크리티컬 피해 ×1.2', effects: [{ type: 'critical_multiplier', value: V.mercilessCriticalMultiplier }] },
  focus: { id: 'focus', name: '집중', group: 'secondary', description: '빗나갈 확률 15% 감소', effects: [{ type: 'miss_chance_multiplier', value: V.focusMissChanceMultiplier }] },
}