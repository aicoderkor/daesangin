import type { GameState } from '../types/game'

const STORAGE_KEY = 'daesangin-react-v3'

/** 저장소 추상화 계층. 추후 Supabase 저장소로 교체할 때 이 파일만 확장합니다. */
export const gameStorage = {
  load(): Partial<GameState> | null {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<GameState>
  },

  save(state: GameState): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },

  clear(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(STORAGE_KEY)
  },
}
