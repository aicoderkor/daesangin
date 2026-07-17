import { useMemo, useState } from 'react'
import { TRAITS } from '../data/gameData'
import { gameStore, useGameStore } from '../store/gameStore'
import type { Mercenary, StatMap } from '../types/game'
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

function formatStat(value: number): string {
  return value < 1
    ? `${Math.round(value * 100)}%`
    : Math.round(value).toLocaleString()
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
                    <div className="name">
                      {mercenary.base}
                      <span className="small">
                        {' '}
                        {getClassName(mercenary)}
                      </span>
                    </div>

                    <div className="small">
                      Lv.{mercenary.level} ·{' '}
                      {mercenary.status === 'idle'
                        ? '대기'
                        : '원정대'}
                    </div>

                    <div className="tags">
                      {mercenary.traits.map((trait) => (
                        <span className="tag" key={trait}>
                          {trait}
                        </span>
                      ))}
                    </div>

                    <div className="bar">
                      <i style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="stars">
                    {'★'.repeat(mercenary.traits.length)}
                  </div>
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
                onOpenPromotion={() => setPromotionOpen(true)}
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

function MercenaryDetail({
  mercenary,
  items,
  onClose,
  onOpenPromotion,
}: {
  mercenary: Mercenary
  items: ReturnType<typeof useGameStore>['items']
  onClose: () => void
  onOpenPromotion: () => void
}) {
  const stats = addGearStats(
    getMercenaryStats(mercenary),
    mercenary,
    items,
  )

  const getGearName = (
    slot: keyof Mercenary['gear'],
  ): string => {
    const itemId = mercenary.gear[slot]
    return (
      items.find((item) => item.id === itemId)?.name ??
      '비어 있음'
    )
  }

  const nextPromotionLevel = getNextPromotionLevel(mercenary)
  const promotionReady = isPromotionReady(mercenary)

  return (
    <>
      <div className="head">
        <div>
          <h2>
            {getBaseIcon(mercenary.base)} {mercenary.base}
          </h2>
          <div className="small">
            {getClassName(mercenary)} Lv.{mercenary.level}
          </div>
        </div>

        <button
          type="button"
          className="btn alt sm"
          onClick={onClose}
        >
          닫기
        </button>
      </div>

      <div className="card">
        <b>능력치</b>
        <div className="small mercenary-detail-stats">
          HP {formatStat(stats.hp)} / MP {formatStat(stats.mp)}
          <br />
          공격 {formatStat(stats.atk)} · 물방{' '}
          {formatStat(stats.def)} · 마방{' '}
          {formatStat(stats.mdef)}
          <br />
          위협 {stats.threat.toFixed(2)} · 치명{' '}
          {formatStat(stats.crit)} · 회피{' '}
          {formatStat(stats.evade)}
        </div>
      </div>

      <div className="card">
        <b>특성</b>
        <div className="tags">
          {mercenary.traits.map((traitName) => {
            const trait = TRAITS.find(
              (target) => target.name === traitName,
            )

            return (
              <span className="tag" key={traitName}>
                {traitName}
                {trait ? `: ${trait.description}` : ''}
              </span>
            )
          })}
        </div>
      </div>

      <div className="card">
        <b>장비</b>
        <div className="small mercenary-detail-stats">
          무기: {getGearName('weapon')}
          <br />
          방어구: {getGearName('armor')}
          <br />
          장신구: {getGearName('charm')}
        </div>
      </div>

      <div className="card">
        <b>전직</b>
        <div className="small">
          {mercenary.path.length >= 2
            ? '최종 전직 완료'
            : promotionReady
              ? '전직 가능'
              : `다음 전직 Lv.${nextPromotionLevel}`}
        </div>

        {promotionReady && (
          <button
            type="button"
            className="btn promotion-button"
            onClick={onOpenPromotion}
          >
            전직 선택
          </button>
        )}
      </div>
    </>
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
