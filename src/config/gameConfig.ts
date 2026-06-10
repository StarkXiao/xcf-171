export const GAME_CONFIG = {
  MAP_WIDTH: 800,
  MAP_HEIGHT: 1200,
  SONAR: {
    MAX_RADIUS: 500,
    SPEED: 280,
    MAX_CHARGES: 5,
    RECHARGE_TIME: 3000,
    COLOR: 0x00ffaa,
  },
  TARGETS: {
    CREATURE_COUNT: 6,
    WRECK_COUNT: 3,
    DANGER_COUNT: 4,
    MIN_RADIUS: 18,
    MAX_RADIUS: 45,
    SPAWN_MARGIN: 60,
  },
  SCORE: {
    CREATURE_POINTS: 100,
    WRECK_POINTS: 200,
    DANGER_PENALTY: -150,
    LIFE_LOST: 1,
    BONUS_PER_LEVEL: 50,
  },
  GAME: {
    INITIAL_LIVES: 3,
    TARGETS_PER_LEVEL: 8,
  },
  COLORS: {
    BACKGROUND: 0x000814,
    GRID: 0x003344,
    SONAR: 0x00ffaa,
    CREATURE: 0x00e5ff,
    WRECK: 0xffcc00,
    DANGER: 0xff3355,
    PLAYER: 0x00ff88,
  },
};

export const CREATURE_NAMES = [
  '深海灯笼鱼',
  '巨型章鱼',
  '透明水母',
  '深海剑鱼',
  '发光乌贼',
  '珊瑚虫群',
  '海天使',
  '吞噬鳗',
];

export const WRECK_NAMES = [
  '古代沉船',
  '飞机残骸',
  '海底遗迹',
  '废弃潜艇',
  '货物集装箱',
];

export const DANGER_NAMES = [
  '危险水雷',
  '深海漩涡',
  '毒刺水母群',
  '海底火山口',
  '高压电流区',
];

export const RESCUE_CONFIG = {
  MAP_WIDTH: 800,
  MAP_HEIGHT: 1200,
  GAME: {
    BASE_TIME: 180,
    TIME_PER_LEVEL: 30,
    MAX_FALSE_REPORTS: 3,
    FALSE_REPORT_PENALTY: -150,
    LEVELS: [
      { realCapsules: 2, decoys: 1, interferenceZones: 2, timeBonus: 0 },
      { realCapsules: 3, decoys: 2, interferenceZones: 3, timeBonus: 30 },
      { realCapsules: 4, decoys: 3, interferenceZones: 4, timeBonus: 60 },
      { realCapsules: 5, decoys: 4, interferenceZones: 5, timeBonus: 90 },
      { realCapsules: 6, decoys: 5, interferenceZones: 6, timeBonus: 120 },
    ],
  },
  SONAR: {
    MAX_RADIUS: 450,
    SPEED: 240,
    MAX_CHARGES: 4,
    RECHARGE_TIME: 4000,
    COLOR: 0x00ccff,
    INTERFERENCE_ATTENUATION: 0.6,
  },
  SCORE: {
    DETECT_BONUS: 50,
    CONFIRM_BONUS: 200,
    RESCUE_BONUS: 500,
    TIME_BONUS_PER_SEC: 5,
    ACCURACY_BONUS: 300,
    PERFECT_RESCUE_BONUS: 1000,
    CAPSULE_MIN_RADIUS: 22,
    CAPSULE_MAX_RADIUS: 40,
  },
  CAPSULE: {
    REAL_NAMES: [
      '深海科研舱',
      '观光潜水艇',
      '海底工作站',
      '深海采矿舱',
      '科考探测舱',
      '救援中继站',
      '深海观测站',
      '海底实验室',
    ],
    DECOY_NAMES: [
      '废弃集装箱',
      '沉船碎片',
      '大型岩块',
      '海底残骸',
      '废弃浮标',
      '金属沉积物',
    ],
  },
  INTERFERENCE: {
    NOISE_NAMES: ['噪声干扰区', '信号盲区', '磁异常带'],
    DECOY_ZONE_NAMES: ['假信号源', '镜像区域', '回声陷阱'],
    BLOCKER_NAMES: ['海底山脉', '熔岩带', '冰层覆盖区'],
    MIN_RADIUS: 80,
    MAX_RADIUS: 180,
  },
  COLORS: {
    BACKGROUND: 0x000a1a,
    GRID: 0x002244,
    SONAR: 0x00ccff,
    REAL_CAPSULE: 0x00ff88,
    DECOY_CAPSULE: 0xff8844,
    CONFIRMED_CAPSULE: 0x00ffcc,
    RESCUED_CAPSULE: 0x00ffff,
    INTERFERENCE_NOISE: 0x6644aa,
    INTERFERENCE_DECOY: 0xaa6644,
    INTERFERENCE_BLOCKER: 0x444466,
    PLAYER: 0x44ffaa,
    WARNING: 0xff6644,
    DANGER: 0xff3355,
  },
};
