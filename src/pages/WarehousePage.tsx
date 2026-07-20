import { MATERIAL_NAMES } from '../data/gameData'
import { gameStore, useGameStore } from '../store/gameStore'
import { getClassName } from '../utils/mercenary'
import type {
  GearItem,
  MaterialKey,
  StatMap,
} from '../types/game'

type WarehousePageProps = {
  onToast?: (message: string) => void
}

function formatStatValue(value: number): string {
  return value < 1
    ? Math.round(value * 100) + '%'
    : Math.round(value).toString()
}

function formatItemStats(stats: StatMap): string {
  return Object.entries(stats)
    .map(
      ([key, value]) =>
        key + ' +' + formatStatValue(value ?? 0),
    )
    .join(' · ')
}

function getEquippedMercenaryId(
  item: GearItem,
  mercenaries: ReturnType<typeof useGameStore>['mercenaries'],
): string {
  return (
    mercenaries.find(
      (mercenary) => mercenary.gear[item.slot] === item.id,
    )?.id ?? ''
  )
}

export default function WarehousePage({
  onToast,
}: WarehousePageProps) {
  const game = useGameStore()
  const materialTotal = gameStore.getMaterialTotal(game)
  const storageCapacity = gameStore.getStorageCapacity(game)

  return (
    <section className="screen warehouse-screen">
      <h2 className="subscreenTitle">저장소</h2>

      <div className="card">
        <div className="head">
          <div>
            <h3>재료</h3>
            <div className="small">
              {materialTotal}/{storageCapacity}
            </div>
          </div>

          <button type="button" className="btn sm" disabled={game.gold < gameStore.getFacilityUpgradeCost("storage", game.facilities.storage)} onClick={() => { if (gameStore.upgradeFacility("storage")) onToast?.("저장소 수용량이 증가했습니다.") }}>수용량 +1 · 1동</button>
        </div>

        <div>
          {(Object.keys(MATERIAL_NAMES) as MaterialKey[]).filter((material) => game.materials[material] > 0).map((material) => (<div className="item row" key={material}><span>{MATERIAL_NAMES[material]}</span><b>{game.materials[material]}</b><button type="button" className="btn sm" onClick={() => { if (gameStore.sellMaterial(material, game.materials[material])) onToast?.("시장에 판매 등록했습니다.") }}>시장 판매</button></div>))}
        </div>
      </div>

      <div className="card">
        <div className="head">
          <h3>장비</h3>
        </div>

        <div>
          {game.items.length === 0 ? (
            <div className="empty">장비 없음</div>
          ) : (
            game.items.map((item) => (
              <article className="item" key={item.id}>
                <div className="row">
                  <div>
                    <b>{item.name}</b><button type="button" className="btn sm" onClick={() => { if (gameStore.sellGear(item.id)) onToast?.("시장에 판매 등록했습니다.") }}>시장 판매</button>
                    <div className="small">
                      {formatItemStats(item.stats)}
                    </div>
                  </div>

                  <select
                    className="select equipment-select"
                    value={getEquippedMercenaryId(
                      item,
                      game.mercenaries,
                    )}
                    onChange={(event) => {
                      gameStore.equipItem(
                        item.id,
                        event.target.value || null,
                      )
                    }}
                  >
                    <option value="">미장착</option>
                    {game.mercenaries.map((mercenary) => (
                      <option
                        value={mercenary.id}
                        key={mercenary.id}
                      >
                        {getClassName(mercenary)}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}







