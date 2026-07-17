import { useState } from 'react'
import { gameStore, useGameStore } from '../store/gameStore'
import type { ScreenId } from '../types/game'

type HomePageProps = {
  onNavigate: (screen: ScreenId) => void
  onToast?: (message: string) => void
}

export default function HomePage({
  onNavigate,
  onToast,
}: HomePageProps) {
  const game = useGameStore()
  const [lodgingOpen, setLodgingOpen] = useState(false)
  const mercenaryCapacity = gameStore.getMercenaryCapacity(game)
  const storageCapacity = gameStore.getStorageCapacity(game)
  const materialTotal = gameStore.getMaterialTotal(game)
  const activePartyCount = game.parties.filter(
    (party) => party.status !== 'idle',
  ).length

  return (
    <>
    <section className="screen home-screen">
      <div className="quick">
        <button
          type="button"
          aria-label="시설"
          onClick={() => onNavigate('facilities')}
        >
          ＄
        </button>

        <button
          type="button"
          aria-label="객잔"
          onClick={() => onNavigate('tavern')}
        >
          🍺
        </button>

        <button
          type="button"
          aria-label="알림"
          onClick={() => onToast?.('새 소식이 없습니다.')}
        >
          !
        </button>
      </div>

      <button
        type="button"
        className="building"
        onClick={() => setLodgingOpen(true)}
      >
        <div className="hang">🌙</div>
        <div>
          <b>숙소</b>
          <span>
            {game.mercenaries.length}/{mercenaryCapacity} 용병
          </span>
        </div>
      </button>

      <button
        type="button"
        className="building"
        onClick={() => onNavigate('tavern')}
      >
        <div className="hang">🍺</div>
        <div>
          <b>객잔</b>
          <span>새로운 방문객을 모집합니다.</span>
        </div>
      </button>

      <button
        type="button"
        className="building"
        onClick={() => onNavigate('warehouse')}
      >
        <div className="hang">📦</div>
        <div>
          <b>저장소</b>
          <span>
            {materialTotal}/{storageCapacity}개 항목
          </span>
        </div>
      </button>

      <button
        type="button"
        className="building"
        onClick={() => onNavigate('facilities')}
      >
        <div className="hang">🪙</div>
        <div>
          <b>시장</b>
          <span>재료를 판매하고 시설을 관리합니다.</span>
        </div>
      </button>

      <button
        type="button"
        className="building"
        onClick={() => onNavigate('forge')}
      >
        <div className="hang">⚒️</div>
        <div>
          <b>공방</b>
          <span>장비를 제작합니다.</span>
        </div>
      </button>

      <button
        type="button"
        className="building"
        onClick={() => onToast?.('영물당은 추후 개방됩니다.')}
      >
        <div className="hang">🐾</div>
        <div>
          <b>영물당</b>
          <span><em>추후 개방</em></span>
        </div>
      </button>

      <div className="home-summary">
        <div className="summary-card">
          <span>용병</span>
          <b>{game.mercenaries.length}/{mercenaryCapacity}</b>
        </div>
        <div className="summary-card">
          <span>원정대</span>
          <b>{activePartyCount}/{game.facilities.party}</b>
        </div>
        <div className="summary-card">
          <span>해금 지역</span>
          <b>{game.unlockedDungeonIndex + 1}</b>
        </div>
        <div className="summary-card">
          <span>최근 기록</span>
          <b>{game.recentLog || '기록 없음'}</b>
        </div>
      </div>
    </section>
      {lodgingOpen && (
        <div className="modal on" onClick={(event) => { if (event.target === event.currentTarget) setLodgingOpen(false) }}>
          <div className="sheet lodging-sheet">
            <div className="head"><h2>숙소</h2><button type="button" className="btn sm" onClick={() => setLodgingOpen(false)}>닫기</button></div>
            <p>용병들은 이곳에서 휴식합니다. 숙소를 확장하면 더 많은 용병을 고용할 수 있습니다.</p>
            <p>숙소 수용량 {game.mercenaries.length}/{mercenaryCapacity}</p>
            <button type="button" className="btn" disabled={game.gold < gameStore.getFacilityUpgradeCost("quarters", game.facilities.quarters)} onClick={() => { if (gameStore.upgradeFacility('quarters')) onToast?.('숙소 수용량이 증가했습니다.') }}>수용량 +1 · 1동</button>
          </div>
        </div>
      )}
    </>
  )
}





