import type {
  ClassDefinition,
  DungeonDefinition,
  MaterialKey,
  MercenaryBase,
  RecipeDefinition,
  TraitDefinition,
} from '../types/game'

export const MATERIAL_NAMES: Record<MaterialKey, string> = {
  wood: '목재',
  ore: '철광석',
  fiber: '섬유',
  hide: '가죽',
  herb: '약초',
  essence: '정수',
}

export const TRAITS: TraitDefinition[] = [
  { name: '괴력', description: 'CON +15%', modifiers: { con: 1.15 } },
  { name: '야성', description: 'DEX +15%', modifiers: { dex: 1.15 } },
  { name: '총명', description: 'INT +15%', modifiers: { int: 1.15 } },
  { name: '무자비', description: '치명타 +10%', modifiers: { crit: 0.1 } },
  { name: '위압', description: '위협도 +35%', modifiers: { threat: 1.35 } },
  { name: '공감', description: '회복량 +18%', modifiers: { heal: 1.18 } },
  { name: '집중', description: '명중 +8%', modifiers: { hit: 0.08 } },
  { name: '민첩', description: '회피 +8%', modifiers: { evade: 0.08 } },
  { name: '재능', description: '마나 회복 +25%', modifiers: { mana: 1.25 } },
  { name: '강인', description: 'HP +18%', modifiers: { hp: 1.18 } },
]

export const CLASSES: Record<MercenaryBase, ClassDefinition> = {
  창잡이: {
    icon: '🔱',
    role: '전열',
    con: 15,
    dex: 8,
    int: 3,
    hp: 130,
    mp: 35,
    atk: 18,
    def: 12,
    mdef: 4,
    threat: 1.5,
    branches: [
      {
        name: '철창수',
        description: '높은 위협과 방어',
        modifiers: { hp: 1.22, def: 1.28, threat: 1.3 },
        skill: { name: '수호진', cost: 30, type: 'guard' },
        branches: [
          {
            name: '금위장',
            description: '아군 보호에 특화',
            modifiers: { hp: 1.25, def: 1.25 },
          },
          {
            name: '파성장',
            description: '방어형 반격 장수',
            modifiers: { atk: 1.23, def: 1.12 },
          },
        ],
      },
      {
        name: '비창객',
        description: '빠른 공격과 치명타',
        modifiers: { atk: 1.22, dex: 1.18, threat: 0.85 },
        skill: { name: '연창격', cost: 30, type: 'multi' },
        branches: [
          {
            name: '풍뢰장',
            description: '연속 행동',
            modifiers: { dex: 1.25, atk: 1.16 },
          },
          {
            name: '적월장',
            description: '치명타 처형',
            modifiers: { atk: 1.3, crit: 0.08 },
          },
        ],
      },
    ],
  },
  활잡이: {
    icon: '🏹',
    role: '후열',
    con: 7,
    dex: 16,
    int: 4,
    hp: 90,
    mp: 45,
    atk: 21,
    def: 6,
    mdef: 5,
    threat: 0.65,
    branches: [
      {
        name: '명궁',
        description: '강한 단일 저격',
        modifiers: { atk: 1.25, dex: 1.15 },
        skill: { name: '관통사격', cost: 35, type: 'pierce' },
        branches: [
          {
            name: '천리궁',
            description: '보스 저격',
            modifiers: { atk: 1.32 },
          },
          {
            name: '월영궁',
            description: '치명과 회피',
            modifiers: { crit: 0.1, evade: 0.08 },
          },
        ],
      },
      {
        name: '연노수',
        description: '광역 연속사격',
        modifiers: { atk: 1.12, dex: 1.22 },
        skill: { name: '화살비', cost: 38, type: 'aoe' },
        branches: [
          {
            name: '화우장',
            description: '광역 피해 강화',
            modifiers: { atk: 1.2 },
          },
          {
            name: '추풍장',
            description: '빠른 마나 순환',
            modifiers: { mana: 1.3, dex: 1.18 },
          },
        ],
      },
    ],
  },
  검객: {
    icon: '⚔️',
    role: '전열',
    con: 12,
    dex: 12,
    int: 3,
    hp: 110,
    mp: 40,
    atk: 20,
    def: 9,
    mdef: 5,
    threat: 1.05,
    branches: [
      {
        name: '호위무사',
        description: '균형형 전열',
        modifiers: { hp: 1.15, def: 1.17 },
        skill: { name: '반월참', cost: 32, type: 'cleave' },
        branches: [
          {
            name: '금위장',
            description: '반격 수비',
            modifiers: { def: 1.24 },
          },
          {
            name: '검호',
            description: '균형 고화력',
            modifiers: { atk: 1.27 },
          },
        ],
      },
      {
        name: '유랑검사',
        description: '회피형 공격수',
        modifiers: { dex: 1.22, atk: 1.17, threat: 0.8 },
        skill: { name: '무영참', cost: 28, type: 'multi' },
        branches: [
          {
            name: '무영객',
            description: '회피 특화',
            modifiers: { evade: 0.12, dex: 1.18 },
          },
          {
            name: '혈검장',
            description: '흡혈 공격',
            modifiers: { atk: 1.3, lifesteal: 0.12 },
          },
        ],
      },
    ],
  },
  의술사: {
    icon: '🪷',
    role: '지원',
    con: 6,
    dex: 7,
    int: 17,
    hp: 82,
    mp: 70,
    atk: 10,
    def: 5,
    mdef: 10,
    threat: 0.45,
    heal: 22,
    branches: [
      {
        name: '의관',
        description: '정통 회복 계열',
        modifiers: { int: 1.18, heal: 1.25 },
        skill: { name: '회생술', cost: 32, type: 'heal' },
        branches: [
          {
            name: '명의',
            description: '단일 대회복',
            modifiers: { heal: 1.35 },
          },
          {
            name: '약선',
            description: '전체 지속회복',
            modifiers: { regen: 0.04, heal: 1.18 },
          },
        ],
      },
      {
        name: '주술사',
        description: '공격과 지원',
        modifiers: { int: 1.2, atk: 1.18 },
        skill: { name: '혼령탄', cost: 35, type: 'magic' },
        branches: [
          {
            name: '혼령사',
            description: '적 약화',
            modifiers: { atk: 1.24 },
          },
          {
            name: '천문사',
            description: '광역 회복',
            modifiers: { heal: 1.2, mana: 1.22 },
          },
        ],
      },
    ],
  },
}

export const DUNGEONS: DungeonDefinition[] = [
  {
    name: '들쥐 소굴',
    recommendedLevel: 1,
    actionTime: 8,
    materials: {
      wood: [1, 3],
      fiber: [1, 3],
    },
    enemies: [
      {
        name: '들쥐',
        hp: 65,
        attack: 10,
        defense: 2,
        magicDefense: 2,
        dexterity: 8,
      },
      {
        name: '큰 들쥐',
        hp: 95,
        attack: 13,
        defense: 4,
        magicDefense: 3,
        dexterity: 7,
      },
    ],
  },
  {
    name: '산적 초소',
    recommendedLevel: 3,
    actionTime: 10,
    materials: {
      wood: [2, 5],
      ore: [1, 3],
      hide: [1, 2],
    },
    enemies: [
      {
        name: '산적',
        hp: 125,
        attack: 19,
        defense: 7,
        magicDefense: 4,
        dexterity: 10,
      },
      {
        name: '산적 궁수',
        hp: 90,
        attack: 22,
        defense: 4,
        magicDefense: 5,
        dexterity: 14,
      },
      {
        name: '산적 두목',
        hp: 175,
        attack: 25,
        defense: 10,
        magicDefense: 7,
        dexterity: 9,
      },
    ],
  },
  {
    name: '폐사원',
    recommendedLevel: 6,
    actionTime: 12,
    materials: {
      ore: [2, 5],
      herb: [1, 4],
      essence: [0, 2],
    },
    enemies: [
      {
        name: '원혼',
        hp: 145,
        attack: 25,
        defense: 7,
        magicDefense: 12,
        dexterity: 13,
      },
      {
        name: '저주승',
        hp: 175,
        attack: 23,
        defense: 9,
        magicDefense: 15,
        dexterity: 10,
      },
      {
        name: '수호귀',
        hp: 245,
        attack: 31,
        defense: 15,
        magicDefense: 13,
        dexterity: 8,
      },
    ],
  },
  {
    name: '검은 고개',
    recommendedLevel: 9,
    actionTime: 14,
    materials: {
      ore: [4, 8],
      hide: [2, 5],
      essence: [1, 3],
    },
    enemies: [
      {
        name: '흑표',
        hp: 210,
        attack: 36,
        defense: 9,
        magicDefense: 7,
        dexterity: 18,
      },
      {
        name: '검은 창객',
        hp: 250,
        attack: 38,
        defense: 17,
        magicDefense: 10,
        dexterity: 12,
      },
      {
        name: '고개 대장',
        hp: 350,
        attack: 44,
        defense: 21,
        magicDefense: 14,
        dexterity: 11,
      },
    ],
  },
]

export const RECIPES: RecipeDefinition[] = [
  {
    name: '무쇠 장창',
    slot: 'weapon',
    requiredMaterials: { ore: 12, wood: 6 },
    stats: { atk: 16, threat: 0.15 },
  },
  {
    name: '연노',
    slot: 'weapon',
    requiredMaterials: { wood: 12, fiber: 8 },
    stats: { atk: 14, dex: 3 },
  },
  {
    name: '철편 갑옷',
    slot: 'armor',
    requiredMaterials: { ore: 16, hide: 5 },
    stats: { hp: 55, def: 9 },
  },
  {
    name: '비단 도포',
    slot: 'armor',
    requiredMaterials: { fiber: 15, herb: 5 },
    stats: { hp: 28, mdef: 10, int: 3 },
  },
  {
    name: '수호 부적',
    slot: 'charm',
    requiredMaterials: { essence: 5, herb: 8 },
    stats: { mdef: 6, mp: 18 },
  },
  {
    name: '매의 노리개',
    slot: 'charm',
    requiredMaterials: { hide: 8, essence: 3 },
    stats: { dex: 4, crit: 0.05 },
  },
]

export const MERCENARY_BASES = Object.keys(CLASSES) as MercenaryBase[]
