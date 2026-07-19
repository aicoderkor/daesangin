import { useEffect, useState } from 'react'
import { DUNGEONS, MATERIAL_NAMES } from '../data/gameData'
import { gameStore, useGameStore } from '../store/gameStore'
import type {
  CombatUnit,
  MaterialKey,
} from '../types/game'

function renderLogMessage(message: string) {
  const parts = message.split(/(\d+(?:\.\d+)?(?:의 피해|피해))/g)
  return parts.map((part, index) => /\d+(?:\.\d+)?(?:의 피해|피해)/.test(part) ? <strong className="damage-value" key={index}>{part}</strong> : <span key={index}>{part}</span>)
}
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
                  </div>

                  <span>{unlocked ? '해금' : '잠김'}</span>
                </div>                {(() => { const ids = game.dungeonProgress[String(dungeonIndex)]?.assignedMercenaryIds ?? []; const names = ids.map((id) => game.mercenaries.find((mercenary) => mercenary.id === id)?.base).filter(Boolean).join(' · '); return names ? <div className="small">{names}</div> : null })()}
              </article>
            )
          })}
        </div>
      </div>

      <div className={`card ${battleOpen ? "battle-open" : "battle-hidden"}`} id="battle-viewer"><div className="head"><h3>전투 관전</h3><button type="button" className="btn sm" onClick={() => setBattleOpen(false)}>닫기</button>{watchedParty && <button type="button" className="btn sm" onClick={() => { const index = game.parties.findIndex((party) => party.id === watchedParty.id); if (index >= 0) gameStore.recallParty(index); setBattleOpen(false) }}>귀환</button>}

          <select className="select battle-select" value={watchedPartyId} onChange={(event) => setWatchedPartyId(event.target.value)}><option value="">전투 관전 선택</option>{activeParties.map((party) => <option value={party.id} key={party.id}>{party.dungeon !== null ? DUNGEONS[party.dungeon].name : party.id}</option>)}</select>
        </div>

        <div className="battle">
          {!watchedParty ? (
            <div className="empty">
              진행 중인 던전을 선택하세요.
            </div>
          ) : !battle ? (
            <div className="log"></div>
          ) : (
            <>
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
                      {renderLogMessage(message)}
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
          <div className="sheet"><div className="head"><h2>던전 용병 배치</h2><button type="button" className="btn sm" onClick={() => setSelectedDungeon(null)}>닫기</button></div>
            <div className="small">현재 던전 참여 용병</div>
            {(game.dungeonProgress[String(selectedDungeon)]?.assignedMercenaryIds ?? []).map((id) => { const mercenary = game.mercenaries.find((candidate) => candidate.id === id); return mercenary ? <div className="row" key={id}><span>{mercenary.base} Lv.{mercenary.level}</span><button type="button" className="btn sm" onClick={() => gameStore.removeMercenaryFromDungeon(selectedDungeon, id)}>제외</button></div> : null })}
            <div className="small">배치 가능한 용병</div>
            {game.mercenaries.filter((mercenary) => { const assigned = mercenary.assignedDungeonId; return !assigned }).map((mercenary) => <button type="button" className="btn" key={mercenary.id} onClick={() => gameStore.assignMercenaryToDungeon(selectedDungeon, mercenary.id)}>{mercenary.base} Lv.{mercenary.level}</button>)}

            <button type="button" className="btn" onClick={() => { if ((game.dungeonProgress[String(selectedDungeon)]?.assignedMercenaryIds ?? []).length > 0) { gameStore.assignDungeon(0, selectedDungeon); setSelectedDungeon(null) } }}>출전</button>
          </div>
        </div>
      )}    </section>
  )
}

































