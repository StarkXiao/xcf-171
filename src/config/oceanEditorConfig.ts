import type { OceanLevelConfig, RewardRule, DangerZone } from '../types/game';

export const OCEAN_EDITOR_CONFIG = {
  STORAGE_KEY: 'deepSeaSonar_oceanEditorLevels',
  MAP: {
    MIN_WIDTH: 400,
    MAX_WIDTH: 1200,
    DEFAULT_WIDTH: 800,
    MIN_HEIGHT: 600,
    MAX_HEIGHT: 2000,
    DEFAULT_HEIGHT: 1200,
  },
  TARGETS: {
    MIN_COUNT: 0,
    MAX_COUNT: 30,
    DEFAULT_CREATURE: 6,
    DEFAULT_WRECK: 3,
    DEFAULT_DANGER: 4,
  },
  POINTS: {
    MIN_POINTS: 0,
    MAX_POINTS: 1000,
    DEFAULT_CREATURE: 100,
    DEFAULT_WRECK: 200,
    DEFAULT_DANGER: -150,
  },
  SONAR: {
    MIN_RADIUS: 100,
    MAX_RADIUS: 800,
    DEFAULT_RADIUS: 500,
    MIN_SPEED: 100,
    MAX_SPEED: 600,
    DEFAULT_SPEED: 280,
    MIN_CHARGES: 1,
    MAX_CHARGES: 20,
    DEFAULT_CHARGES: 5,
    MIN_RECHARGE: 500,
    MAX_RECHARGE: 10000,
    DEFAULT_RECHARGE: 3000,
  },
  GAME: {
    MIN_LIVES: 1,
    MAX_LIVES: 10,
    DEFAULT_LIVES: 3,
    MIN_TARGETS_PER_LEVEL: 3,
    MAX_TARGETS_PER_LEVEL: 30,
    DEFAULT_TARGETS_PER_LEVEL: 8,
  },
  DANGER_ZONE: {
    MIN_RADIUS: 50,
    MAX_RADIUS: 300,
    DEFAULT_RADIUS: 100,
    MIN_INTENSITY: 0.1,
    MAX_INTENSITY: 2.0,
    DEFAULT_INTENSITY: 1.0,
    MAX_ZONES: 8,
  },
  REWARD: {
    MAX_RULES: 10,
  },
};

export const DANGER_ZONE_TYPES = [
  { id: 'minefield', name: '水雷区', icon: '💣', description: '高危险区域，触碰会损失生命' },
  { id: 'volcano', name: '海底火山', icon: '🌋', description: '高温区域，会干扰声呐信号' },
  { id: 'vortex', name: '深海漩涡', icon: '🌀', description: '强大的洋流，会影响移动' },
  { id: 'toxic', name: '有毒水域', icon: '☠️', description: '有毒物质区域，持续造成伤害' },
];

export const REWARD_CONDITION_TYPES = [
  { id: 'collect_n_creatures', name: '收集N个生物', description: '收集指定数量的海洋生物' },
  { id: 'collect_n_wrecks', name: '收集N个残骸', description: '收集指定数量的残骸遗迹' },
  { id: 'no_damage', name: '无伤通关', description: '全程不受到任何伤害' },
  { id: 'discover_all', name: '发现所有目标', description: '发现关卡中的所有目标' },
  { id: 'time_bonus', name: '限时奖励', description: '在指定时间内完成' },
];

export const REWARD_TYPES = [
  { id: 'score_multiplier', name: '分数倍率', description: '将获得的分数乘以指定倍率' },
  { id: 'bonus_points', name: '额外分数', description: '获得固定数量的额外分数' },
  { id: 'extra_life', name: '额外生命', description: '获得额外的生命数' },
  { id: 'sonar_bonus', name: '声呐充能', description: '获得额外的声呐使用次数' },
  { id: 'combo_bonus', name: '连击奖励', description: '连续收集目标时获得额外奖励' },
];

export function createDefaultLevel(): OceanLevelConfig {
  return {
    id: `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '新建海域',
    description: '自定义海域关卡描述',
    mapWidth: OCEAN_EDITOR_CONFIG.MAP.DEFAULT_WIDTH,
    mapHeight: OCEAN_EDITOR_CONFIG.MAP.DEFAULT_HEIGHT,
    targetDensity: {
      creature: OCEAN_EDITOR_CONFIG.TARGETS.DEFAULT_CREATURE,
      wreck: OCEAN_EDITOR_CONFIG.TARGETS.DEFAULT_WRECK,
      danger: OCEAN_EDITOR_CONFIG.TARGETS.DEFAULT_DANGER,
    },
    targetPoints: {
      creature: OCEAN_EDITOR_CONFIG.POINTS.DEFAULT_CREATURE,
      wreck: OCEAN_EDITOR_CONFIG.POINTS.DEFAULT_WRECK,
      danger: OCEAN_EDITOR_CONFIG.POINTS.DEFAULT_DANGER,
    },
    sonar: {
      maxRadius: OCEAN_EDITOR_CONFIG.SONAR.DEFAULT_RADIUS,
      speed: OCEAN_EDITOR_CONFIG.SONAR.DEFAULT_SPEED,
      maxCharges: OCEAN_EDITOR_CONFIG.SONAR.DEFAULT_CHARGES,
      rechargeTime: OCEAN_EDITOR_CONFIG.SONAR.DEFAULT_RECHARGE,
    },
    game: {
      initialLives: OCEAN_EDITOR_CONFIG.GAME.DEFAULT_LIVES,
      targetsPerLevel: OCEAN_EDITOR_CONFIG.GAME.DEFAULT_TARGETS_PER_LEVEL,
    },
    dangerZones: [],
    rewardRules: [],
    createdAt: Date.now(),
  };
}

export function createDefaultRewardRule(): RewardRule {
  return {
    type: 'bonus_points',
    condition: {
      type: 'collect_n_creatures',
      value: 5,
    },
    value: 500,
    name: '收集奖励',
    description: '收集5个海洋生物获得500分',
  };
}

export function createDefaultDangerZone(): DangerZone {
  return {
    id: Date.now(),
    position: { x: 400, y: 600 },
    radius: OCEAN_EDITOR_CONFIG.DANGER_ZONE.DEFAULT_RADIUS,
    intensity: OCEAN_EDITOR_CONFIG.DANGER_ZONE.DEFAULT_INTENSITY,
    name: '危险区域',
    type: 'minefield',
  };
}

export const PRESET_LEVELS: OceanLevelConfig[] = [
  {
    id: 'preset_shallow',
    name: '浅海探索',
    description: '适合新手的浅海区域，危险较少',
    mapWidth: 800,
    mapHeight: 1000,
    targetDensity: { creature: 8, wreck: 4, danger: 2 },
    targetPoints: { creature: 80, wreck: 180, danger: -100 },
    sonar: { maxRadius: 550, speed: 320, maxCharges: 6, rechargeTime: 2500 },
    game: { initialLives: 4, targetsPerLevel: 8 },
    dangerZones: [
      { id: 1, position: { x: 200, y: 700 }, radius: 80, intensity: 0.8, name: '浅水雷区', type: 'minefield' },
    ],
    rewardRules: [
      { type: 'bonus_points', condition: { type: 'collect_n_creatures', value: 5 }, value: 300, name: '初级收集奖励', description: '收集5个海洋生物获得300分' },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'preset_deep',
    name: '深海深渊',
    description: '危险的深海区域，高风险高回报',
    mapWidth: 800,
    mapHeight: 1600,
    targetDensity: { creature: 10, wreck: 6, danger: 8 },
    targetPoints: { creature: 150, wreck: 350, danger: -200 },
    sonar: { maxRadius: 450, speed: 240, maxCharges: 4, rechargeTime: 4000 },
    game: { initialLives: 2, targetsPerLevel: 10 },
    dangerZones: [
      { id: 1, position: { x: 250, y: 500 }, radius: 120, intensity: 1.2, name: '火山地带', type: 'volcano' },
      { id: 2, position: { x: 550, y: 900 }, radius: 100, intensity: 1.0, name: '漩涡中心', type: 'vortex' },
      { id: 3, position: { x: 400, y: 1300 }, radius: 140, intensity: 1.5, name: '剧毒水域', type: 'toxic' },
    ],
    rewardRules: [
      { type: 'score_multiplier', condition: { type: 'no_damage', value: 1 }, value: 1.5, name: '无伤通关奖励', description: '无伤通关获得1.5倍分数' },
      { type: 'bonus_points', condition: { type: 'collect_n_wrecks', value: 4 }, value: 800, name: '残骸收集专家', description: '收集4个残骸获得800分' },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'preset_ruins',
    name: '古代遗迹',
    description: '充满神秘残骸的古代文明遗迹',
    mapWidth: 800,
    mapHeight: 1400,
    targetDensity: { creature: 4, wreck: 12, danger: 5 },
    targetPoints: { creature: 100, wreck: 300, danger: -180 },
    sonar: { maxRadius: 500, speed: 280, maxCharges: 5, rechargeTime: 3200 },
    game: { initialLives: 3, targetsPerLevel: 10 },
    dangerZones: [
      { id: 1, position: { x: 300, y: 600 }, radius: 90, intensity: 1.0, name: '遗迹守卫雷区', type: 'minefield' },
      { id: 2, position: { x: 500, y: 1000 }, radius: 110, intensity: 1.3, name: '神殿外围', type: 'minefield' },
    ],
    rewardRules: [
      { type: 'bonus_points', condition: { type: 'discover_all', value: 1 }, value: 1000, name: '完全探索奖励', description: '发现所有目标获得1000分' },
      { type: 'extra_life', condition: { type: 'collect_n_wrecks', value: 6 }, value: 1, name: '考古学家奖励', description: '收集6个残骸获得1条额外生命' },
    ],
    createdAt: Date.now(),
  },
];
