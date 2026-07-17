import { useEffect, useState } from 'react'
import { DUNGEONS } from '../data/gameData'
import { gameStore, useGameStore } from '../store/gameStore'
import { getClassName } from '../utils/mercenary'

type PartyPageProps = {
  onToast?: (message: string) => void
}

export default function PartyPage({ onToast }: PartyPageProps) {
  const game = useGameStore()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const handleMemberChange = (
    partyIndex: number,
    slotIndex: number,
    mercenaryId: string,
  ) => {
    const success = gameStore.setPartyMember(
      partyIndex,
      slotIndex,
      mercenaryId || null,
    )

    if (!success) {
      onToast?.('다른 원정대에 소속된 용병입니다.')
    }
  }

  const handleAssign = (
    partyIndex: number,
    dungeonValue: string,
  ) => {
    if (!dungeonValue) return

    const success = gameStore.assignDungeon(
      partyIndex,
      Number(dungeonValue),
    )

    if (!success) {
      onToast?.('용병을 편성한 뒤 원정지를 선택하세요.')
      return
    }

    onToast?.('원정대가 출발했습니다.')
  }

  return (
    <section className="screen party-screen">
      <h2 className="subscreenTitle">원정대</h2>

      <div className="card">
        <div className="head">
          <div>
            <h3>편성</h3>
            <div className="small">
              여러 원정대를 동시에 운영할 수 있습니다.
            </div>
          </div>
        </div>

        <div>
          {game.parties.map((party, partyIndex) => {
            const dungeon =
              party.dungeon === null
                ? null
                : DUNGEONS[party.dungeon]
            const remainingSeconds = Math.max(
              0,
              Math.ceil(
                ((party.status === 'camp'
                  ? party.campUntil
                  : party.nextActionAt) -
                  now) /
                  1_000,
              ),
            )

            return (
              <article className="party" key={party.id}>
                <div className="row">
                  <div>
                    <b>{party.name}</b>
                    <div className="small">
                      {party.status === 'idle'
                        ? '대기'
                        : party.status === 'camp'
                          ? '야영 회복 중'
                          : (dungeon?.name ?? '던전') +
                            ' 탐색 중'}
                    </div>
                  </div>

                  <span className="status">{party.runs}회</span>
                </div>

                <div className="partySlots">
                  {party.members.map((mercenaryId, slotIndex) => {
                    const mercenary = game.mercenaries.find(
                      (target) => target.id === mercenaryId,
                    )
                    const availableMercenaries =
                      game.mercenaries.filter(
                        (target) =>
                          target.status === 'idle' ||
                          party.members.includes(target.id),
                      )

                    return (
                      <div className="slot" key={slotIndex}>
                        <b>
                          {mercenary
                            ? mercenary.name ?? mercenary.base
                            : '빈 자리'}
                        </b>
                        <div>
                          {mercenary
                            ? getClassName(mercenary)
                            : ''}
                        </div>

                        <select
                          className="select"
                          value={mercenaryId ?? ''}
                          disabled={party.status !== 'idle'}
                          onChange={(event) =>
                            handleMemberChange(
                              partyIndex,
                              slotIndex,
                              event.target.value,
                            )
                          }
                        >
                          <option value="">비움</option>
                          {availableMercenaries.map((target) => (
                            <option value={target.id} key={target.id}>
                              {target.name ?? target.base}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>

                {party.status === 'idle' ? (
                  <select
                    className="select party-dungeon-select"
                    value=""
                    onChange={(event) =>
                      handleAssign(partyIndex, event.target.value)
                    }
                  >
                    <option value="">원정지 선택</option>
                    {DUNGEONS.slice(
                      0,
                      game.unlockedDungeonIndex + 1,
                    ).map((target, dungeonIndex) => (
                      <option
                        value={dungeonIndex}
                        key={target.name}
                      >
                        {target.name} (권장 {target.recommendedLevel})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="row party-action-row">
                    <div className="small">
                      다음 행동 {remainingSeconds}초
                    </div>
                    <button
                      type="button"
                      className="btn bad sm"
                      onClick={() => {
                        gameStore.recallParty(partyIndex)
                        onToast?.('원정대가 귀환했습니다.')
                      }}
                    >
                      귀환
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

