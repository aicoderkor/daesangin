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
        (hit ? ' hit' : '') + (unit.hp <= 0 ? ' dead' : '')
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

export default function DungeonPage({ onNavigate }: { onNavigate: (screen: "parties") => void }) {
  const game = useGameStore()
  const [watchedPartyId, setWatchedPartyId] = useState('')
  const [selectedDungeon, setSelectedDungeon] = useState<number | null>(null)
  const [battleOpen, setBattleOpen] = useState(false)
  const activeParties = game.parties.filter(
    (party) => party.status === 'explore',
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

  useEffect(() => { if (watchedPartyId) document.getElementById("battle-viewer")?.scrollIntoView({ behavior: "smooth", block: "start" }) }, [watchedPartyId])

  const watchedParty = activeParties.find(
    (party) => party.id === watchedPartyId,
  )
  const liveBattle = watchedParty ? gameStore.getLiveBattleState(watchedParty.id) : undefined
  const battle = liveBattle
  const isSearching = Boolean(watchedParty && !liveBattle)
  const battleLogs = watchedParty ? gameStore.getExpeditionLogs(watchedParty.id) : []
  const displayedLogs = battleLogs.slice(-120)
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
                onClick={() => { const active = game.parties.find((party) => party.dungeon === dungeonIndex && party.status === "explore"); if (active) { setWatchedPartyId(active.id); setBattleOpen(true) } else if (unlocked) setSelectedDungeon(dungeonIndex) }}
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

                {game.parties.filter((party) => party.dungeon === dungeonIndex && party.status === "explore").map((party) => <div className="small" key={party.id}>원정대: {party.name} · 진행 {party.areasCompleted}/{party.areaTotal} · 전투 진행 중 · 상자 {Object.values(party.loot).reduce((sum, value) => sum + (value ?? 0), 0)} <button type="button" className="btn sm" onClick={(event) => { event.stopPropagation(); setWatchedPartyId(party.id); setBattleOpen(true) }}>전투 관전</button><button type="button" className="btn sm" onClick={(event) => { event.stopPropagation(); onNavigate("parties") }}>편성대 보기</button></div>)}

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

      <div className={`card ${battleOpen ? "battle-open" : "battle-hidden"}`} id="battle-viewer"><div className="head"><h3>전투 관전</h3><button type="button" className="btn sm" onClick={() => setBattleOpen(false)}>닫기</button>

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
            <div className="log"><div>다음 조우를 탐색 중...</div></div>
          ) : (
            <>
              {isSearching && <div className="log"><div>다음 조우를 탐색 중...</div></div>}
              <div className="field">
                <div className="side">
                  {battle!.allies.map((unit) => (
                    <Fighter
                      unit={unit}
                      active={battle!.activeUnitId === unit.id}
                      hit={battle!.hitUnitId === unit.id}
                      key={unit.id}
                    />
                  ))}
                </div>

                <div className="versus">VS</div>

                <div className="side">
                  {battle!.enemies.map((unit) => (
                    <Fighter
                      unit={unit}
                      active={battle!.activeUnitId === unit.id}
                      hit={battle!.hitUnitId === unit.id}
                      key={unit.id}
                    />
                  ))}
                </div>
              </div>

              <div className="log">
                {[...displayedLogs].reverse().map((entry, index) => {
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
      {selectedDungeon !== null && (
        <div className="modal on" onClick={(event) => { if (event.target === event.currentTarget) setSelectedDungeon(null) }}>
          <div className="sheet"><div className="head"><h2>원정대 구성</h2><button type="button" className="btn sm" onClick={() => setSelectedDungeon(null)}>닫기</button></div>
            {game.parties[0].members.map((memberId, index) => <select className="select" key={index} value={memberId ?? ''} onChange={(event) => gameStore.setPartyMember(0, index, event.target.value || null)}><option value="">용병 선택</option>{game.mercenaries.map((mercenary) => <option value={mercenary.id} key={mercenary.id}>{mercenary.base} Lv.{mercenary.level}</option>)}</select>)}
            <button type="button" className="btn" onClick={() => { if (gameStore.assignDungeon(0, selectedDungeon)) setSelectedDungeon(null) }}>출전</button>
          </div>
        </div>
      )}    </section>
  )
}

































