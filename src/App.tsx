import { useEffect, useState } from 'react'
import DungeonPage from './pages/DungeonPage'
import ForgePage from './pages/ForgePage'
import FacilitiesPage from './pages/FacilitiesPage'
import HomePage from './pages/HomePage'
import MercenaryPage from './pages/MercenaryPage'
import PartyPage from './pages/PartyPage'
import TavernPage from './pages/TavernPage'
import WarehousePage from './pages/WarehousePage'
import { gameStore, useGameStore } from './store/gameStore'
import { formatCurrency } from './utils/currency'
import type { ScreenId } from './types/game'

const PAGE_TITLES: Record<ScreenId, string> = {
  home: '본부',
  tavern: '객잔',
  mercs: '용병',
  parties: '원정대',
  dungeons: '던전',
  warehouse: '저장소',
  forge: '공방',
  facilities: '본부 시설',
}

export default function App() {
  const game = useGameStore()
  const [screen, setScreen] = useState<ScreenId>('home')
  const [toastMessage, setToastMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => gameStore.tick(), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(''), 1_600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const navigate = (nextScreen: ScreenId) => {
    setScreen(nextScreen)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPage = () => {
    switch (screen) {
      case 'home':
        return <HomePage onNavigate={navigate} onToast={setToastMessage} />
      case 'tavern':
        return <TavernPage onToast={setToastMessage} />
      case 'mercs':
        return <MercenaryPage onToast={setToastMessage} />
      case 'parties':
        return <PartyPage onToast={setToastMessage} />
      case 'dungeons':
        return <DungeonPage onNavigate={navigate} />
      case 'warehouse':
        return <WarehousePage onToast={setToastMessage} />
      case 'forge':
        return <ForgePage onToast={setToastMessage} />
      case 'facilities':
        return <FacilitiesPage onToast={setToastMessage} />
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="title">
          <button type="button" className="menuBtn" onClick={() => setMenuOpen(true)}>
            ☰
          </button>

          <div className="titleText">
            <b>{PAGE_TITLES[screen]}</b>
            <div className="small">대상인</div>
          </div>

          <div className="gem">
            💎 <span>{game.gems}</span>
            <button type="button" className="btn sm" onClick={() => gameStore.addGold(100)}>+100동</button>
          </div>
        </div>

        <div className="res">
          <div><span>엽전</span><b>{formatCurrency(game.gold)}</b></div>
        </div>
      </header>

      <main>{renderPage()}</main>

      <nav className="tabs">
        <button type="button" className={`tab ${screen === 'home' ? 'on' : ''}`} onClick={() => navigate('home')}>
          <b>🏰</b>본부
        </button>
        <button type="button" className={`tab ${screen === 'mercs' ? 'on' : ''}`} onClick={() => navigate('mercs')}>
          <b>👥</b>용병
        </button>
        <button type="button" className={`tab ${screen === 'dungeons' ? 'on' : ''}`} onClick={() => navigate('dungeons')}>
          <b>🚪</b>던전
        </button>
      </nav>

      {menuOpen && (
        <div
          className="modal on"
          onClick={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false)
          }}
        >
          <div className="sheet">
            <div className="head">
              <h2>메뉴</h2>
              <button type="button" className="btn sm" onClick={() => setMenuOpen(false)}>닫기</button>
            </div>

            <button type="button" className="choice" onClick={() => navigate('home')}><b>🏰 본부</b></button>
            <button type="button" className="choice" onClick={() => navigate('tavern')}><b>🍺 객잔</b></button>
            <button type="button" className="choice" onClick={() => navigate('warehouse')}><b>📦 저장소</b></button>
            <button type="button" className="choice" onClick={() => navigate('forge')}><b>⚒️ 공방</b></button>
            <button type="button" className="choice" onClick={() => navigate('facilities')}><b>🏗️ 시설</b></button>
            <button
              type="button"
              className="choice"
              onClick={() => {
                if (window.confirm('모든 진행 상황을 초기화할까요?')) {
                  gameStore.reset()
                  navigate('home')
                  setToastMessage('게임이 초기화되었습니다.')
                }
              }}
            >
              <b>↻ 게임 초기화</b>
            </button>
          </div>
        </div>
      )}

      <div className={`toast ${toastMessage ? 'on' : ''}`}>{toastMessage}</div>
    </div>
  )
}













