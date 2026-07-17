import { useEffect, useState } from 'react'
import { DUNGEONS, MATERIAL_NAMES } from '../data/gameData'
import { gameStore, useGameStore } from '../store/gameStore'
import type {
  CombatUnit,
  MaterialKey,
} from '../types/game'

function Fighter({
  unit,
  active,
  hit,
}: {
  unit: CombatUnit
  active: boolean
  hit: boolean
}) {
  const hpPercent = Math.max(
    0,
    (unit.hp / unit.maxHp) * 100,
  )
  const mpPercent =
    unit.maxMp > 0
      ? Math.max(0, (unit.mp / unit.maxMp) * 100)
      : 0

  return (
    <div
      className={
        'fighter' +
        (active ? ' act' : '') +
        (hit ? ' hit' : '')
      }
    >
      <b>{unit.name}</b>
      <div className="small">{unit.className ?? ''}</div>
      <div className="hp">
        <i style={{ width: hpPercent + '%' }} />
      </div>
      <div className="hp mp">
        <i style={{ width: mpPercent + '%' }} />
      </div>
    </div>
  )
}

export default function DungeonPage() {
  const game = useGameStore()
  const [watchedPartyId, setWatchedPartyId] = useState('')
  const activeParties = game.parties.filter(
    (party) => party.status !== 'idle',
  )

  useEffect(() => {
    if (
      activeParties.length > 0 &&
      !activeParties.some(
        (party) => party.id === watchedPartyId,
      )
    ) {
      setWatchedPartyId(activeParties[0].id)
    }

    if (activeParties.length === 0 && watchedPartyId) {
      setWatchedPartyId('')
    }
  }, [activeParties, watchedPartyId])

  const watchedParty = activeParties.find(
    (party) => party.id === watchedPartyId,
  )
  const battle = watchedParty
    ? gameStore.getBattleState(watchedParty.id)
    : undefined

  return (
    <section className="screen dungeon-screen">
      <div className="card">
        <div className="head">
          <div>
            <h2>던전</h2>
            <div className="small">
              파티가 실시간으로 탐색하고 전투합니다.
            </div>
          </div>
        </div>

        <div>
          {DUNGEONS.map((dungeon, dungeonIndex) => {
            const unlocked =
              dungeonIndex <= game.unlockedDungeonIndex

            return (
              <article
                className="dungeon"
                key={dungeon.name}
                style={{ opacity: unlocked ? 1 : 0.45 }}
              >
                <div className="row">
                  <div>
                    <b>{dungeon.name}</b>
                    <div className="small">
                      권장 Lv.{dungeon.recommendedLevel} · 행동{' '}
                      {dungeon.actionTime}초
                    </div>
                  </div>

                  <span>{unlocked ? '해금' : '잠김'}</span>
                </div>

                <div className="material">
                  {Object.keys(dungeon.materials)
                    .map(
                      (material) =>
                        MATERIAL_NAMES[material as MaterialKey],
                    )
                    .join(' · ')}
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="head">
          <h3>전투 관전</h3>

          <select
            className="select battle-select"
            value={watchedPartyId}
            onChange={(event) =>
              setWatchedPartyId(event.target.value)
            }
          >
            <option value="">관전 선택</option>
            {activeParties.map((party) => (
              <option value={party.id} key={party.id}>
                {party.name}
              </option>
            ))}
          </select>
        </div>

        <div className="battle">
          {!watchedParty ? (
            <div className="empty">
              진행 중인 원정대를 선택하세요.
            </div>
          ) : !battle ? (
            <div
              className={
                'empty' +
                (watchedParty.status === 'explore'
                  ? ' pulse'
                  : '')
              }
            >
              {watchedParty.status === 'camp'
                ? '야영지에서 회복 중'
                : '다음 조우를 탐색 중...'}
            </div>
          ) : (
            <>
              <div className="field">
                <div className="side">
                  {battle.allies.map((unit) => (
                    <Fighter
                      unit={unit}
                      active={battle.activeUnitId === unit.id}
                      hit={battle.hitUnitId === unit.id}
                      key={unit.id}
                    />
                  ))}
                </div>

                <div className="versus">VS</div>

                <div className="side">
                  {battle.enemies.map((unit) => (
                    <Fighter
                      unit={unit}
                      active={battle.activeUnitId === unit.id}
                      hit={battle.hitUnitId === unit.id}
                      key={unit.id}
                    />
                  ))}
                </div>
              </div>

              <div className="log">
                {battle.logs.map((entry, index) => {
                  const separator = entry.indexOf('|')
                  const tone =
                    separator >= 0
                      ? entry.slice(0, separator)
                      : 'normal'
                  const message =
                    separator >= 0
                      ? entry.slice(separator + 1)
                      : entry
                  const className =
                    tone === 'good'
                      ? 'lg'
                      : tone === 'bad'
                        ? 'lr'
                        : tone === 'skill'
                          ? 'ly'
                          : ''

                  return (
                    <div
                      className={className}
                      key={index + '-' + entry}
                    >
                      {message}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

