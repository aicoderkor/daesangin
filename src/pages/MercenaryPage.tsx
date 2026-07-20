import { useMemo, useState } from 'react'
import { CLASSES } from '../data/gameData'
import { getMercenaryTraitDefinitions, getTraitCount } from '../game/traits'
import { gameStore, useGameStore } from '../store/gameStore'
import type { Mercenary, SkillDefinition, StatMap } from '../types/game'
import { calculateDamageRange, calculateHealing, mapJobToCombatClass } from '../game/combat'
import {
  getBaseIcon,
  getClassName,
  getMercenaryStats,
  getNextPromotionBranches,
  getNextPromotionLevel,
  getXpRequired,
  isPromotionReady,
} from '../utils/mercenary'

type MercenaryPageProps = {
  onToast?: (message: string) => void
}

function addGearStats(
  baseStats: Required<StatMap>,
  mercenary: Mercenary,
  items: ReturnType<typeof useGameStore>['items'],
): Required<StatMap> {
  const result = { ...baseStats }

  for (const itemId of Object.values(mercenary.gear)) {
    if (!itemId) continue

    const item = items.find((target) => target.id === itemId)
    if (!item) continue

    for (const [key, value] of Object.entries(item.stats)) {
      if (value === undefined) continue
      const statKey = key as keyof Required<StatMap>
      result[statKey] += value
    }
  }

  return result
}

export default function MercenaryPage({
  onToast,
}: MercenaryPageProps) {
  const game = useGameStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [promotionOpen, setPromotionOpen] = useState(false)

  const selectedMercenary = useMemo(
    () =>
      game.mercenaries.find(
        (mercenary) => mercenary.id === selectedId,
      ) ?? null,
    [game.mercenaries, selectedId],
  )

  const capacity = gameStore.getMercenaryCapacity(game)

  const closeModal = () => {
    setSelectedId(null)
    setPromotionOpen(false)
  }

  const handlePromote = (branchIndex: number) => {
    if (!selectedMercenary) return

    const success = gameStore.promoteMercenary(
      selectedMercenary.id,
      branchIndex,
    )

    if (!success) {
      onToast?.('전직할 수 없습니다.')
      return
    }

    setPromotionOpen(false)
    onToast?.('전직이 완료되었습니다.')
  }

  return (
    <section className="screen mercenary-screen">
      <h2 className="subscreenTitle">용병</h2>

      <div className="card">
        <div className="head">
          <div>
            <h3>보유 용병</h3>
            <div className="small">
              {game.mercenaries.length}/{capacity}
            </div>
          </div>
        </div>

        <div className="grid">
          {game.mercenaries.length === 0 ? (
            <div className="empty">보유 용병이 없습니다.</div>
          ) : (
            game.mercenaries.map((mercenary) => {
              const requiredXp = getXpRequired(mercenary.level)
              const progress = Math.min(
                100,
                (mercenary.xp / requiredXp) * 100,
              )

              return (
                <button
                  type="button"
                  className="merc"
                  key={mercenary.id}
                  onClick={() => {
                    setSelectedId(mercenary.id)
                    setPromotionOpen(false)
                  }}
                >
                  <div className="ico">
                    {getBaseIcon(mercenary.base)}
                  </div>

                  <div>
                    <div className="name">{getClassName(mercenary)}</div>

                    <div className="small">
                      Lv.{mercenary.level} ·{' '}
                      {mercenary.status === 'idle'
                        ? '대기'
                        : '던전'}
                    </div>

                    <div className="tags">
                      {Object.values(getMercenaryTraitDefinitions(mercenary.traits)).map((trait) => trait && (
                        <span className="tag" key={trait.id}>{trait.name}</span>
                      ))}
                    </div>

                    <div className="bar">
                      <i style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="stars">
                    {'★'.repeat(getTraitCount(mercenary.traits))}
                  </div>
                  <div className="merc-gear">{(["weapon", "armor", "charm"] as const).map((slot) => { const item = game.items.find((candidate) => candidate.id === mercenary.gear[slot]); return <span className="gear-slot" key={slot} title={item?.name ?? "빈 슬롯"}>{item ? "⚔️" : ""}</span> })}</div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {selectedMercenary && (
        <div
          className="modal on"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div className="sheet">
            {!promotionOpen ? (
              <MercenaryDetail
                mercenary={selectedMercenary}
                items={game.items}
                onClose={closeModal}
                onOpenPromotion={() => setPromotionOpen(true)} onDismiss={() => { if (gameStore.dismissMercenary(selectedMercenary.id)) closeModal() }}
              />
            ) : (
              <PromotionPanel
                mercenary={selectedMercenary}
                onBack={() => setPromotionOpen(false)}
                onPromote={handlePromote}
              />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function getMercenarySkill(mercenary: Mercenary): SkillDefinition {
  let branches = CLASSES[mercenary.base].branches
  let skill: SkillDefinition | undefined
  for (const branchIndex of mercenary.path) {
    const branch = branches[branchIndex]
    if (!branch) break
    if (branch.skill) skill = branch.skill
    branches = branch.branches ?? []
  }
  return skill ?? { name: '기본 공격', cost: 0, type: 'none' }
}

function getSkillDescription(skill: SkillDefinition): string {
  const descriptions: Record<SkillDefinition['type'], string> = {
    none: '적 한 명에게 기본 공격을 가합니다.',
    guard: '방어 태세를 갖추고 받는 피해를 줄입니다.',
    multi: '한 대상을 연속으로 공격합니다.',
    pierce: '강한 일격으로 적의 방어를 꿰뚫습니다.',
    aoe: '여러 적을 동시에 공격합니다.',
    cleave: '전방의 여러 적을 베어냅니다.',
    heal: '체력이 낮은 아군을 회복합니다.',
    magic: '마법 방어력을 기준으로 피해를 줍니다.',
  }
  return descriptions[skill.type]
}

function MercenaryDetail({
  mercenary,
  items,
  onClose,
  onOpenPromotion,
  onDismiss,
}: {
  mercenary: Mercenary
  items: ReturnType<typeof useGameStore>['items']
  onClose: () => void
  onOpenPromotion: () => void
  onDismiss: () => void
}) {
  const [statPage, setStatPage] = useState(0)
  const stats = addGearStats(getMercenaryStats(mercenary), mercenary, items)
  const combatClass = mapJobToCombatClass(mercenary.base)
  const damageRange = calculateDamageRange(combatClass, {
    constitution: stats.con,
    dexterity: stats.dex,
    intelligence: stats.int,
    maxHp: stats.hp,
    magicDefenseRate: 0,
  })
  const skill = getMercenarySkill(mercenary)
  const requiredXp = getXpRequired(mercenary.level)
  const xpProgress = Math.min(100, (mercenary.xp / requiredXp) * 100)
  const baseHealing = calculateHealing({ baseDamage: damageRange.average })
  const healingRate = CLASSES[mercenary.base].heal
    ? stats.heal / (CLASSES[mercenary.base].heal ?? stats.heal)
    : 1
  const gearSlots = ['weapon', 'armor', 'charm'] as const
  const gearIcons = { weapon: '⚔️', armor: '🛡️', charm: '🔮' } as const
  const nextPromotionLevel = getNextPromotionLevel(mercenary)
  const promotionReady = isPromotionReady(mercenary)
  const pageCount = 4
  const percent = (value: number) => `${Math.round(value * 100)}%`

  return (
    <div className="merc-detail">
      <div className="head merc-detail-head">
        <div>
          <h2>{getClassName(mercenary)}</h2>
          <div className="small">{CLASSES[mercenary.base].role} · Lv.{mercenary.level}</div>
        </div>
        <div className="merc-detail-actions">
          <button type="button" className="btn alt sm" onClick={onDismiss}>해고</button>
          <button type="button" className="btn alt sm" onClick={onClose}>닫기</button>
        </div>
      </div>

      <div className="merc-profile">
        <div className="merc-portrait">{getBaseIcon(mercenary.base)}</div>
        <div className="merc-level">
          <b>레벨 {mercenary.level}</b>
          <span>경험치 {mercenary.xp}/{requiredXp}</span>
          <div className="bar"><i style={{ width: `${xpProgress}%` }} /></div>
        </div>
      </div>

      <div className="merc-detail-gear">
        {gearSlots.map((slot) => {
          const item = items.find((candidate) => candidate.id === mercenary.gear[slot])
          return <div className="merc-detail-slot" key={slot} title={item?.name ?? '빈 슬롯'}>{item ? gearIcons[slot] : ''}<small>{item?.name ?? ''}</small></div>
        })}
      </div>

      <div className="merc-skills">
        <div><b>액티브 스킬</b><span>{skill.name}</span></div>
        <div><b>패시브 특성</b><span>{Object.values(getMercenaryTraitDefinitions(mercenary.traits)).filter(Boolean).map((trait) => trait!.name).join(' · ') || '없음'}</span></div>
      </div>

      <div className="merc-stat-page">
        {statPage === 0 && (
          <div className="merc-stat-columns">
            <div>
              <span>HP <b>{Math.round(stats.hp)}</b></span>
              <span>MP <b>{Math.round(stats.mp)}</b></span>
              <span>체질 <b>{Math.round(stats.con)}</b></span>
              <span>민첩 <b>{Math.round(stats.dex)}</b></span>
              <span>지능 <b>{Math.round(stats.int)}</b></span>
            </div>
            <div>
              <span>마나 획득 <b>{Math.round(stats.mana)}</b></span>
              <span>방어력 <b>{Math.round(stats.def)}</b></span>
              <span>마법 방어력 <b>{Math.round(stats.mdef)}</b></span>
              <span>공격 피해량 <b>{damageRange.min}–{damageRange.max}</b></span>
              <span>공격 유형 <b>{skill.type === 'magic' ? '마법 공격' : '물리 공격'}</b></span>
            </div>
          </div>
        )}
        {statPage === 1 && (
          <div className="merc-stat-columns">
            <div>
              <span>위협도 <b>{stats.threat.toFixed(2)}</b></span>
              <span>추가 회피율 <b>{percent(stats.evade)}</b></span>
              <span>치명타 확률 <b>{percent(stats.crit)}</b></span>
              <span>치명타 피해 <b>150%</b></span>
              <span>명중 보정 <b>+{percent(Math.max(0, stats.hit - 0.9))}</b></span>
            </div>
            <div>
              <span>반격 <b>0%</b></span>
              <span>생명력 흡수 <b>{percent(stats.lifesteal)}</b></span>
              <span>재생 <b>{percent(stats.regen)}</b></span>
              <span>상태이상 면역 <b>0%</b></span>
              <span>평균 공격력 <b>{damageRange.average}</b></span>
            </div>
          </div>
        )}
        {statPage === 2 && (
          <div className="merc-stat-columns">
            <div>
              <span>어둠 감소량 <b>0%</b></span>
              <span>화염 피해 보정 <b>0%</b></span>
              <span>어둠 피해 보정 <b>0%</b></span>
            </div>
            <div>
              <span>치유량 보정 <b>{Math.round(healingRate * 100)}%</b></span>
              <span>기본 치유량 <b>{baseHealing}</b></span>
              <span>집중 보너스 <b>{percent(Math.max(0, stats.hit - 0.9))}</b></span>
            </div>
          </div>
        )}
        {statPage === 3 && (
          <div className="merc-extra-page">
            <b>장비 및 특성</b>
            {gearSlots.map((slot) => {
              const item = items.find((candidate) => candidate.id === mercenary.gear[slot])
              return <span key={slot}>{slot === 'weapon' ? '무기' : slot === 'armor' ? '방어구' : '장신구'}: {item?.name ?? '비어 있음'}</span>
            })}
            {(['primary', 'secondary'] as const).map((slot) => {
              const trait = getMercenaryTraitDefinitions(mercenary.traits)[slot]
              return <span key={slot}>{slot === 'primary' ? '기본 특성' : '추가 특성'}: {trait ? `${trait.name} — ${trait.description}` : '없음'}</span>
            })}
          </div>
        )}
      </div>

      <div className="merc-page-nav">
        <button type="button" className="btn alt" disabled={statPage === 0} onClick={() => setStatPage((page) => Math.max(0, page - 1))}>◀</button>
        <b>{statPage + 1}/{pageCount}</b>
        <button type="button" className="btn alt" disabled={statPage === pageCount - 1} onClick={() => setStatPage((page) => Math.min(pageCount - 1, page + 1))}>▶</button>
      </div>

      <div className="merc-description">
        {statPage === 0 && `${getClassName(mercenary)}의 주 능력치는 ${combatClass === 'warrior' ? '체질' : combatClass === 'archer' ? '민첩' : combatClass === 'rogue' ? '체질과 민첩' : '지능'}이며, 표시된 공격 피해량이 실제 기본 공격 범위입니다.`}
        {statPage === 1 && '명중, 회피, 치명타와 전투 보조 능력치입니다.'}
        {statPage === 2 && '속성 피해와 치유에 적용되는 특수 보정입니다.'}
        {statPage === 3 && getSkillDescription(skill)}
      </div>

      <div className="merc-promotion-row">
        <span>{mercenary.path.length >= 2 ? '최종 전직 완료' : promotionReady ? '전직 가능' : `다음 전직 Lv.${nextPromotionLevel}`}</span>
        {promotionReady && <button type="button" className="btn sm" onClick={onOpenPromotion}>전직 선택</button>}
      </div>
    </div>
  )
}
function PromotionPanel({
  mercenary,
  onBack,
  onPromote,
}: {
  mercenary: Mercenary
  onBack: () => void
  onPromote: (branchIndex: number) => void
}) {
  const branches = getNextPromotionBranches(mercenary)

  return (
    <>
      <div className="head">
        <h2>전직 선택</h2>

        <button
          type="button"
          className="btn alt sm"
          onClick={onBack}
        >
          뒤로
        </button>
      </div>

      <div className="small">
        전직할 계열을 선택하십시오.
      </div>

      {branches.map((branch, index) => (
        <div className="choice" key={branch.name}>
          <b>{branch.name}</b>
          <p className="small">{branch.description}</p>

          <button
            type="button"
            className="btn sm"
            onClick={() => onPromote(index)}
          >
            선택
          </button>
        </div>
      ))}

      {branches.length === 0 && (
        <div className="empty">선택 가능한 전직이 없습니다.</div>
      )}
    </>
  )
}















