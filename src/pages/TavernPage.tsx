import { useEffect, useMemo, useState } from 'react'
import { CLASSES } from '../data/gameData'
import { gameStore, useGameStore } from '../store/gameStore'

type TavernPageProps = { onToast?: (message: string) => void }
function formatSeconds(ms: number) { return Math.max(0, Math.ceil(ms / 1000)) }
export default function TavernPage({ onToast }: TavernPageProps) {
  const game = useGameStore(); const [, setNow] = useState(Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t) }, [])
  const remaining = useMemo(() => formatSeconds(game.candidatePaused ? game.candidateTimeRemaining : game.candidateRefreshAt - Date.now()), [game.candidatePaused, game.candidateTimeRemaining, game.candidateRefreshAt])
  const lodging = gameStore.getMercenaryCapacity(game); const tavern = gameStore.getTavernCapacity(game); const full = game.mercenaries.length >= lodging
  const hire = (id: string) => { if (full) { onToast?.('숙소가 가득 찼습니다.'); return }; if (gameStore.hireMercenary(id)) onToast?.('무료로 고용했습니다.') }
  return <section className="screen tavern-screen"><h2 className="subscreenTitle">객잔</h2><div className="card"><div className="head"><div><h3>방문객</h3><div className="small">{game.candidatePaused ? '새 용병 등장 일시정지' : '4시간마다 새로운 용병 등장'}</div></div><button type="button" className="btn sm" onClick={() => gameStore.toggleCandidatePause()}>{game.candidatePaused ? '다시 시작' : '등장 일시정지'}</button></div><div className="small candidate-timer">{game.candidatePaused ? '일시정지 · ' : '다음 방문객까지 '}{Math.floor(remaining / 3600)}시간 {Math.floor((remaining % 3600) / 60)}분</div><div className="small tavern-capacity">객잔 {game.candidates.length}/{tavern} · 숙소 {game.mercenaries.length}/{lodging}</div><div className="candidate-list">{game.candidates.map((candidate) => { const c = CLASSES[candidate.base]; return <article className="candidate" key={candidate.id}><div className="row"><div className="candidate-title"><div className="candidate-icon">{c.icon}</div><div><b>{candidate.base}</b><div className="small">{c.role} · Lv.{candidate.level}</div></div></div><div className="stars">{'★'.repeat(candidate.traits.length)}</div></div><div className="tags">{candidate.traits.map((trait) => <span className="tag" key={trait}>{trait}</span>)}</div><div className="candidate-stats"><span>HP {c.hp}</span><span>공격 {c.atk}</span><span>방어 {c.def}</span><span>민첩 {c.dex}</span></div><button type="button" className="btn sm" disabled={full} onClick={() => hire(candidate.id)}>{full ? '숙소 가득 참' : '무료 고용'}</button></article> })}</div></div></section>
}
