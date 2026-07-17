import { gameStore, useGameStore } from '../store/gameStore'
import type { GameState } from '../types/game'

type FacilitiesPageProps = {
  onToast?: (message: string) => void
}

const FACILITIES: Array<{
  key: keyof GameState['facilities']
  name: string
  effect: string
}> = [
  {
    key: 'quarters',
    name: '용병 숙소',
    effect: '보유 용병 +2',
  },
  {
    key: 'party',
    name: '작전실',
    effect: '동시 원정대 +1',
  },
  {
    key: 'storage',
    name: '창고',
    effect: '보관량 +35',
  },
  {
    key: 'forge',
    name: '대장간',
    effect: '제작법 추가',
  },
]

export default function FacilitiesPage({
  onToast,
}: FacilitiesPageProps) {
  const game = useGameStore()

  return (
    <section className="screen facilities-screen">
      <h2 className="subscreenTitle">본부 시설</h2>

      <div className="card">
        <div className="head">
          <div>
            <h3>건물 업그레이드</h3>
            <div className="small">
              수용량과 기능을 확장합니다.
            </div>
          </div>
        </div>

        <div>
          {FACILITIES.map((facility) => {
            const level = game.facilities[facility.key]
            const cost = 250 * level * level

            return (
              <article
                className="facility row"
                key={facility.key}
              >
                <div>
                  <b>
                    {facility.name} Lv.{level}
                  </b>
                  <div className="small">
                    {facility.effect}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn sm"
                  onClick={() => {
                    const success =
                      gameStore.upgradeFacility(facility.key)
                    onToast?.(
                      success
                        ? '시설 확장 완료'
                        : '엽전이 부족합니다.',
                    )
                  }}
                >
                  {cost} 엽전
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

