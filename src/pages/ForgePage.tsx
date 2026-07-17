import {
  MATERIAL_NAMES,
  RECIPES,
} from '../data/gameData'
import { gameStore, useGameStore } from '../store/gameStore'
import type {
  MaterialKey,
  StatMap,
} from '../types/game'

type ForgePageProps = {
  onToast?: (message: string) => void
}

function formatStats(stats: StatMap): string {
  return Object.entries(stats)
    .map(([key, value]) => {
      const amount =
        (value ?? 0) < 1
          ? Math.round((value ?? 0) * 100) + '%'
          : Math.round(value ?? 0)
      return key + ' +' + amount
    })
    .join(' · ')
}

export default function ForgePage({
  onToast,
}: ForgePageProps) {
  const game = useGameStore()
  const visibleRecipes = RECIPES.slice(
    0,
    Math.min(RECIPES.length, 2 + game.facilities.forge * 2),
  )

  return (
    <section className="screen forge-screen">
      <h2 className="subscreenTitle">공방</h2>

      <div className="card">
        <div className="head">
          <div>
            <h3>제작 목록</h3>
            <div className="small">
              던전 재료로 장비를 제작합니다.
            </div>
          </div>
        </div>

        <div>
          {visibleRecipes.map((recipe, recipeIndex) => {
            const canCraft = Object.entries(
              recipe.requiredMaterials,
            ).every(
              ([material, quantity]) =>
                game.materials[material as MaterialKey] >=
                (quantity ?? 0),
            )

            return (
              <article className="item" key={recipe.name}>
                <div className="row">
                  <div>
                    <b>{recipe.name}</b>
                    <div className="small">
                      {formatStats(recipe.stats)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn sm"
                    disabled={!canCraft}
                    onClick={() => {
                      const success =
                        gameStore.craftItem(recipeIndex)
                      onToast?.(
                        success
                          ? recipe.name + ' 제작 완료'
                          : '재료가 부족합니다.',
                      )
                    }}
                  >
                    제작
                  </button>
                </div>

                <div className="material forge-materials">
                  {Object.entries(recipe.requiredMaterials)
                    .map(
                      ([material, quantity]) =>
                        MATERIAL_NAMES[
                          material as MaterialKey
                        ] +
                        ' ' +
                        quantity,
                    )
                    .join(' · ')}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

