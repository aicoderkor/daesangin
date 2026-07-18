export type ExpeditionEventType = 'flavor' | 'heal' | 'trap' | 'treasure' | 'resource'

export interface ExpeditionEventDefinition {
  id: string
  type: ExpeditionEventType
  weight: number
  messages: string[]
}

export const EXPEDITION_EVENTS: ExpeditionEventDefinition[] = [
  { id: 'wind', type: 'flavor', weight: 30, messages: ['나뭇잎 사이로 햇빛이 희미하게 비칩니다.', '멀리서 물이 흐르는 소리가 들립니다.'] },
  { id: 'tracks', type: 'flavor', weight: 25, messages: ['오래된 야영지의 흔적을 발견했습니다.', '불씨는 이미 완전히 식어 있습니다.'] },
  { id: 'herb', type: 'resource', weight: 15, messages: ['길가에서 약초를 발견했습니다.', '일행이 잠시 멈춰 약초를 채취합니다.'] },
  { id: 'spring', type: 'heal', effect: 'heal', weight: 10, messages: ['맑은 샘물을 발견했습니다.', '일행이 잠시 휴식을 취합니다.'] },
  { id: 'chest', type: 'treasure', weight: 10, messages: ['나무 아래에서 낡은 상자를 발견했습니다.', '상자 안을 조사합니다.'] },
  { id: 'trap', type: 'trap', effect: 'trap', weight: 10, messages: ['발밑에서 무언가 걸리는 소리가 들립니다.', '숨겨진 함정이 작동했습니다.'] },
]

export function randomExpeditionEvent(): ExpeditionEventDefinition {
  const total = EXPEDITION_EVENTS.reduce((sum, event) => sum + event.weight, 0)
  let cursor = Math.random() * total
  for (const event of EXPEDITION_EVENTS) {
    cursor -= event.weight
    if (cursor <= 0) return event
  }
  return EXPEDITION_EVENTS[0]
}


