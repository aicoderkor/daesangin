import { useEffect, useMemo, useState } from 'react'
import { CLASSES } from '../data/gameData'
import { gameStore, useGameStore } from '../store/gameStore'

type TavernPageProps = {
  onToast?: (message: string) => void
}

function formatSeconds(milliseconds: number): number {
  return Math.max(0, Math.ceil(milliseconds / 1_000))
}

export default function TavernPage({ onToast }: TavernPageProps) {
  const game = useGameStore()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1_000)

    return () => window.clearInterval(timer)
  }, [])

  const remainingSeconds = useMemo(
    () => formatSeconds(game.candidateRefreshAt - now),
    [game.candidateRefreshAt, now],
  )

  const mercenaryCapacity = gameStore.getMercenaryCapacity(game)
  const isFull = game.mercenaries.length >= mercenaryCapacity

  const handleRefresh = () => {
    const success = gameStore.refreshCandidates(true)

    if (!success) {
      onToast?.('엽전이 부족합니다.')
      return
    }

    onToast?.('방문객이 새로 들어왔습니다.')
  }

  const handleHire = (mercenaryId: string) => {
    if (isFull) {
      onToast?.('용병 숙소가 가득 찼습니다.')
      return
    }

    const candidate = game.candidates.find(
      (mercenary) => mercenary.id === mercenaryId,
    )

    if (!candidate) {
      onToast?.('고용할 수 없는 후보입니다.')
      return
    }

    const cost = gameStore.getHireCost(candidate)

    if (game.gold < cost) {
      onToast?.('엽전이 부족합니다.')
      return
    }

    const success = gameStore.hireMercenary(mercenaryId)

    if (!success) {
      onToast?.('고용에 실패했습니다.')
      return
    }

    onToast?.(`${candidate.base}이 상단에 합류했습니다.`)
  }

  return (
    <section className="screen tavern-screen">
      <h2 className="subscreenTitle">객잔</h2>

      <div className="card">
        <div className="head">
          <div>
            <h3>방문객</h3>
            <div className="small">
              후보 3명 · 일정 시간마다 무료 갱신
            </div>
          </div>

          <button
            type="button"
            className="btn sm"
            onClick={handleRefresh}
          >
            즉시 갱신 80
          </button>
        </div>

        <div className="small candidate-timer">
          다음 무료 갱신 {remainingSeconds}초
        </div>

        <div className="small tavern-capacity">
          숙소 {game.mercenaries.length}/{mercenaryCapacity}
        </div>

        <div className="candidate-list">
          {game.candidates.length === 0 ? (
            <div className="empty">현재 방문객이 없습니다.</div>
          ) : (
            game.candidates.map((candidate) => {
              const classDefinition = CLASSES[candidate.base]
              const hireCost = gameStore.getHireCost(candidate)
              const canAfford = game.gold >= hireCost
              const disabled = isFull || !canAfford

              return (
                <article className="candidate" key={candidate.id}>
                  <div className="row">
                    <div className="candidate-title">
                      <div className="candidate-icon">
                        {classDefinition.icon}
                      </div>

                      <div>
                        <b>{candidate.base}</b>
                        <div className="small">
                          {classDefinition.role} · Lv.{candidate.level}
                        </div>
                      </div>
                    </div>

                    <div className="stars">
                      {'★'.repeat(candidate.traits.length)}
                    </div>
                  </div>

                  <div className="tags">
                    {candidate.traits.map((trait) => (
                      <span className="tag" key={trait}>
                        {trait}
                      </span>
                    ))}
                  </div>

                  <div className="candidate-stats">
                    <span>HP {classDefinition.hp}</span>
                    <span>공격 {classDefinition.atk}</span>
                    <span>방어 {classDefinition.def}</span>
                    <span>민첩 {classDefinition.dex}</span>
                  </div>

                  <button
                    type="button"
                    className="btn sm"
                    disabled={disabled}
                    onClick={() => handleHire(candidate.id)}
                  >
                    {isFull
                      ? '숙소 가득 참'
                      : canAfford
                        ? `고용 ${hireCost}`
                        : `엽전 부족 ${hireCost}`}
                  </button>
                </article>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}


