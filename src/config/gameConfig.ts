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
