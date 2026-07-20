import { useMemo, useState } from 'react'
import { MATERIAL_NAMES } from '../data/gameData'
import { gameStore, useGameStore } from '../store/gameStore'
import { getClassName } from '../utils/mercenary'
import type { GearItem, MaterialKey, StatMap } from '../types/game'

type WarehousePageProps = { onToast?: (message: string) => void }
type SaleTarget =
  | { kind: 'material'; id: MaterialKey; name: string; available: number }
  | { kind: 'gear'; id: string; name: string; available: 1 }

const MATERIAL_PRICES: Record<MaterialKey, number> = { wood: 1, ore: 2, fiber: 1, hide: 2, herb: 2, essence: 5 }
const MATERIAL_SECONDS: Record<MaterialKey, number> = { wood: 3, ore: 4, fiber: 5, hide: 5, herb: 5, essence: 8 }

function formatStats(stats: StatMap) {
  return Object.entries(stats).map(([key, value]) => `${key} +${value && value < 1 ? Math.round(value * 100) + '%' : Math.round(value ?? 0)}`).join(' · ')
}

function equippedBy(item: GearItem, mercenaries: ReturnType<typeof useGameStore>['mercenaries']) {
  return mercenaries.find((mercenary) => mercenary.gear[item.slot] === item.id)?.id ?? ''
}

export default function WarehousePage({ onToast }: WarehousePageProps) {
  const game = useGameStore()
  const [detail, setDetail] = useState<SaleTarget | null>(null)
  const [saleOpen, setSaleOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const materialTotal = gameStore.getMaterialTotal(game)
  const capacity = gameStore.getStorageCapacity(game)

  const saleInfo = useMemo(() => {
    if (!detail) return null
    if (detail.kind === 'gear') return { price: 10, seconds: 10 }
    return { price: MATERIAL_PRICES[detail.id], seconds: MATERIAL_SECONDS[detail.id] }
  }, [detail])

  const openDetail = (target: SaleTarget) => { setDetail(target); setQuantity(1); setSaleOpen(false) }
  const registerSale = () => {
    if (!detail) return
    const success = detail.kind === 'material' ? gameStore.sellMaterial(detail.id, quantity) : gameStore.sellGear(detail.id)
    if (!success) { onToast?.('판매 등록에 실패했습니다. 시장 슬롯과 장착 상태를 확인하세요.'); return }
    onToast?.('시장에 판매 등록했습니다.')
    setSaleOpen(false)
    setDetail(null)
  }

  return <section className="screen warehouse-screen">
    <h2 className="subscreenTitle">저장소</h2>
    <div className="card">
      <div className="head"><div><h3>재료</h3><div className="small">{materialTotal}/{capacity}</div></div><button type="button" className="btn sm" disabled={game.gold < gameStore.getFacilityUpgradeCost('storage', game.facilities.storage)} onClick={() => { if (gameStore.upgradeFacility('storage')) onToast?.('저장소 수용량이 증가했습니다.') }}>수용량 +1 · 1동</button></div>
      {(Object.keys(MATERIAL_NAMES) as MaterialKey[]).filter((key) => game.materials[key] > 0).map((material) => <button type="button" className="item row warehouse-choice" key={material} onClick={() => openDetail({ kind: 'material', id: material, name: MATERIAL_NAMES[material], available: game.materials[material] })}><span>{MATERIAL_NAMES[material]}</span><b>{game.materials[material]}</b></button>)}
    </div>
    <div className="card"><div className="head"><h3>장비</h3></div>{game.items.length === 0 ? <div className="empty">장비 없음</div> : game.items.map((item) => { const equipped = equippedBy(item, game.mercenaries); return <article className="item" key={item.id}><div className="row"><button type="button" className="warehouse-choice gear-choice" onClick={() => openDetail({ kind: 'gear', id: item.id, name: item.name, available: 1 })}><b>{item.name}</b><div className="small">{formatStats(item.stats)}</div></button><select className="select equipment-select" value={equipped} onChange={(event) => gameStore.equipItem(item.id, event.target.value || null)}><option value="">미장착</option>{game.mercenaries.map((mercenary) => <option value={mercenary.id} key={mercenary.id}>{getClassName(mercenary)}</option>)}</select></div></article> })}</div>
    {detail && <div className="modal on" onClick={(event) => { if (event.target === event.currentTarget) setDetail(null) }}><div className="sheet sale-sheet"><div className="head"><h2>{detail.name}</h2><button type="button" className="btn sm" onClick={() => setDetail(null)}>닫기</button></div><p>{detail.kind === 'material' ? '재료' : '장비'} · 판매가 {saleInfo?.price}동</p><p>보유 수량 {detail.available}개</p><button type="button" className="btn" onClick={() => setSaleOpen(true)} disabled={detail.kind === 'gear' && Boolean(game.mercenaries.find((mercenary) => Object.values(mercenary.gear).includes(detail.id)))}>판매</button></div></div>}
    {detail && saleOpen && saleInfo && <div className="modal on"><div className="sheet sale-sheet"><div className="head"><h2>판매: {detail.name}</h2><button type="button" className="btn sm" onClick={() => setSaleOpen(false)}>닫기</button></div><div className="sale-preview"><b>{detail.name} × {quantity}</b><span>→ {saleInfo.price * quantity}동</span></div><div className="sale-quantity"><button type="button" className="btn" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><b>{quantity}</b><button type="button" className="btn" onClick={() => setQuantity((value) => Math.min(detail.available, value + 1))}>＋</button></div><p>판매 시간: {saleInfo.seconds * quantity}초</p><input className="sale-range" type="range" min="1" max={detail.available} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /><div className="row end"><button type="button" className="btn" onClick={registerSale}>판매하기</button></div></div></div>}
  </section>
}