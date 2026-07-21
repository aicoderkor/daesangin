import { useEffect, useMemo, useState } from 'react'
import { CLASSES } from '../data/gameData'
import { getMercenaryTraitDefinitions, getTraitCount } from '../game/traits'
import { gameStore, useGameStore } from '../store/gameStore'
import { formatCurrency } from '../utils/currency'
import { getBasePortrait } from '../utils/mercenary'

type TavernPageProps = { onToast?: (message: string) => void }
function formatSeconds(ms: number) { return Math.max(0, Math.ceil(ms / 1000)) }
function formatInterval(ms: number) { const minutes = Math.round(ms / 60000); return minutes >= 60 ? Math.round(minutes / 60) + "시간" : minutes + "분" }
export default function TavernPage({ onToast }: TavernPageProps) {
  const game = useGameStore(); const [, setNow] = useState(Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t) }, [])
  const remaining = useMemo(() => formatSeconds((game.candidatePaused ? game.candidateTimeRemaining : game.candidateRefreshAt - Date.now())), [game.candidatePaused, game.candidateTimeRemaining, game.candidateRefreshAt, game.tavernSpeedMultiplier])
  const lodging = gameStore.getMercenaryCapacity(game); const tavern = gameStore.getTavernCapacity(game); const full = game.mercenaries.length >= lodging
  const hire = (id: string) => { if (full) { onToast?.('숙소가 가득 찼습니다.'); return }; if (gameStore.hireMercenary(id)) onToast?.('무료로 고용했습니다.') }
  return <section className="screen tavern-screen"><h2 className="subscreenTitle">객잔</h2><div className="card"><div className="head"><div><h3>방문객</h3><div className="small">{game.candidatePaused ? '새 용병 등장 일시정지' : formatInterval((4 * 60 * 60 * 1000) / game.tavernSpeedMultiplier) + '마다 새로운 용병 등장'}</div></div><button type="button" className="btn sm" onClick={() => gameStore.fillTavernCandidates()}>방문객 채우기</button><button type="button" className="btn sm" onClick={() => gameStore.toggleCandidatePause()}>{game.candidatePaused ? '다시 시작' : '등장 일시정지'}</button></div><div className="small candidate-timer">{game.candidatePaused ? '일시정지 · ' : '다음 방문객까지 '}{Math.floor(remaining / 3600)}시간 {Math.floor((remaining % 3600) / 60)}분 {remaining % 60}초</div><div className="small tavern-capacity">객잔 {game.candidates.length}/{tavern} · 숙소 {game.mercenaries.length}/{lodging} · 속도 x{game.tavernSpeedMultiplier.toFixed(2)}</div><button type="button" className="btn sm" disabled={game.gold < 10} onClick={() => { if (gameStore.upgradeTavernSpeed()) onToast?.("객잔 등장 속도가 증가했습니다.") }}>속도 +10% · 10동</button><button type="button" className="btn sm" disabled={game.gold < gameStore.getFacilityUpgradeCost("tavern", game.facilities.tavern)} onClick={() => { if (gameStore.upgradeFacility("tavern")) onToast?.("객잔 수용량이 증가했습니다.") }}>수용량 +1 · {formatCurrency(gameStore.getFacilityUpgradeCost("tavern", game.facilities.tavern))}</button><div className="candidate-list">{game.candidates.map((candidate) => { const c = CLASSES[candidate.base]; const portrait = getBasePortrait(candidate.base); return <article className="candidate" key={candidate.id}><div className="row"><div className="candidate-title"><div className="candidate-icon">{portrait ? <img src={portrait} alt="" /> : c.icon}</div><div><b>{candidate.base === '창잡이' ? '무도가' : candidate.base}</b><div className="small">{c.role} · Lv.{candidate.level}</div></div></div><div className="stars">{'★'.repeat(getTraitCount(candidate.traits))}</div></div><div className="tags">{Object.values(getMercenaryTraitDefinitions(candidate.traits)).map((trait) => trait && <span className="tag" key={trait.id}>{trait.name}</span>)}</div><div className="candidate-stats"><span>HP {c.hp}</span><span>공격 {c.atk}</span><span>방어 {c.def}</span><span>민첩 {c.dex}</span></div><button type="button" className="btn sm" disabled={full} onClick={() => hire(candidate.id)}>{full ? '숙소 가득 참' : '무료 고용'}</button></article> })}</div></div></section>
}












