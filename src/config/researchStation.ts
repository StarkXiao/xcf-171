import type { TechNode, ExpeditionReward } from '../types/game';

export const TECH_TREE: TechNode[] = [
  {
    id: 'sonar_radius_1',
    name: '增强声呐天线',
    description: '声呐探测半径 +10%',
    icon: '📡',
    category: 'sonar',
    tier: 1,
    cost: 50,
    requires: [],
    effects: { sonarRadiusBonus: 0.1 },
  },
  {
    id: 'sonar_radius_2',
    name: '深海声呐阵列',
    description: '声呐探测半径 +15%',
    icon: '🌊',
    category: 'sonar',
    tier: 2,
    cost: 120,
    requires: ['sonar_radius_1'],
    effects: { sonarRadiusBonus: 0.15 },
  },
  {
    id: 'sonar_radius_3',
    name: '广域扫描系统',
    description: '声呐探测半径 +20%',
    icon: '🌀',
    category: 'sonar',
    tier: 3,
    cost: 250,
    requires: ['sonar_radius_2'],
    effects: { sonarRadiusBonus: 0.2 },
  },
  {
    id: 'power_charges_1',
    name: '备用电池组',
    description: '声呐充能上限 +1',
    icon: '🔋',
    category: 'power',
    tier: 1,
    cost: 60,
    requires: [],
    effects: { maxChargesBonus: 1 },
  },
  {
    id: 'power_charges_2',
    name: '高能电容',
    description: '声呐充能上限 +2',
    icon: '⚡',
    category: 'power',
    tier: 2,
    cost: 150,
    requires: ['power_charges_1'],
    effects: { maxChargesBonus: 2 },
  },
  {
    id: 'power_charges_3',
    name: '聚变反应堆',
    description: '声呐充能上限 +3',
    icon: '☢️',
    category: 'power',
    tier: 3,
    cost: 300,
    requires: ['power_charges_2'],
    effects: { maxChargesBonus: 3 },
  },
  {
    id: 'power_recharge_1',
    name: '快速充电器',
    description: '声呐回充速度 +15%',
    icon: '🔌',
    category: 'power',
    tier: 2,
    cost: 100,
    requires: ['power_charges_1'],
    effects: { rechargeSpeedBonus: 0.15 },
  },
  {
    id: 'power_recharge_2',
    name: '超导回路',
    description: '声呐回充速度 +25%',
    icon: '💫',
    category: 'power',
    tier: 3,
    cost: 220,
    requires: ['power_recharge_1'],
    effects: { rechargeSpeedBonus: 0.25 },
  },
  {
    id: 'radar_basic',
    name: '情报雷达 I',
    description: '游戏开始时短暂显示附近目标',
    icon: '🎯',
    category: 'radar',
    tier: 1,
    cost: 80,
    requires: [],
    effects: { intelligenceRadar: 1 },
  },
  {
    id: 'radar_advanced',
    name: '情报雷达 II',
    description: '初始声呐充能 +2',
    icon: '🛰️',
    category: 'radar',
    tier: 2,
    cost: 180,
    requires: ['radar_basic'],
    effects: { initialSonarBonus: 2 },
  },
  {
    id: 'core_lives',
    name: '加固船体',
    description: '初始生命 +1',
    icon: '🛡️',
    category: 'core',
    tier: 1,
    cost: 70,
    requires: [],
    effects: { livesBonus: 1 },
  },
  {
    id: 'core_score_1',
    name: '数据分析模块',
    description: '全局得分 +5%',
    icon: '📊',
    category: 'core',
    tier: 2,
    cost: 140,
    requires: ['core_lives'],
    effects: { scoreBonus: 0.05 },
  },
  {
    id: 'core_score_2',
    name: '高级数据处理',
    description: '全局得分 +10%',
    icon: '💾',
    category: 'core',
    tier: 3,
    cost: 280,
    requires: ['core_score_1'],
    effects: { scoreBonus: 0.1 },
  },
  {
    id: 'core_creature_bonus',
    name: '生物样本分析',
    description: '海洋生物得分 +50',
    icon: '🐟',
    category: 'core',
    tier: 2,
    cost: 130,
    requires: ['core_lives'],
    effects: { creaturePointsBonus: 50 },
  },
  {
    id: 'core_wreck_bonus',
    name: '残骸价值评估',
    description: '残骸遗迹得分 +100',
    icon: '🏺',
    category: 'core',
    tier: 2,
    cost: 160,
    requires: ['core_lives'],
    effects: { wreckPointsBonus: 100 },
  },
  {
    id: 'detector_unlock_amplified',
    name: '增幅探测器',
    description: '解锁增幅探测器装备',
    icon: '📢',
    category: 'sonar',
    tier: 2,
    cost: 120,
    requires: ['sonar_radius_1'],
    effects: { unlockDetectorAmplified: 1 },
  },
  {
    id: 'detector_unlock_deepscan',
    name: '深扫探测器',
    description: '解锁深扫探测器装备',
    icon: '🔍',
    category: 'sonar',
    tier: 3,
    cost: 220,
    requires: ['detector_unlock_amplified', 'power_recharge_1'],
    effects: { unlockDetectorDeepscan: 1 },
  },
  {
    id: 'detector_unlock_shielded',
    name: '护盾探测器',
    description: '解锁护盾探测器装备',
    icon: '🛡️',
    category: 'core',
    tier: 2,
    cost: 140,
    requires: ['core_lives'],
    effects: { unlockDetectorShielded: 1 },
  },
  {
    id: 'detector_echo_range',
    name: '回波增强天线',
    description: '回波显示范围 +15%',
    icon: '📡',
    category: 'sonar',
    tier: 2,
    cost: 100,
    requires: ['sonar_radius_1'],
    effects: { echoRangeBonus: 0.15 },
  },
  {
    id: 'detector_discovery',
    name: '智能识别算法',
    description: '目标发现效率 +10%',
    icon: '🎯',
    category: 'radar',
    tier: 2,
    cost: 130,
    requires: ['radar_basic'],
    effects: { discoveryEfficiencyBonus: 0.1 },
  },
  {
    id: 'detector_shielding',
    name: '电磁护盾',
    description: '危险生命惩罚 -15%',
    icon: '🛡️',
    category: 'core',
    tier: 3,
    cost: 200,
    requires: ['detector_unlock_shielded', 'core_score_1'],
    effects: { dangerPenaltyReduction: 0.15 },
  },
];

export const TECH_CATEGORY_INFO: Record<string, { name: string; icon: string; color: string }> = {
  sonar: { name: '声呐科技', icon: '📡', color: '#00e5ff' },
  power: { name: '能源科技', icon: '⚡', color: '#ffcc00' },
  radar: { name: '情报科技', icon: '🎯', color: '#ff6688' },
  core: { name: '核心科技', icon: '🔬', color: '#00ffaa' },
};

export const EXPEDITION_REWARD_CONFIG = {
  BASE_POINTS: 10,
  POINTS_PER_LEVEL: 5,
  POINTS_PER_DISCOVERY: 2,
  POINTS_PER_100_SCORE: 1,
  DAILY_CHALLENGE_MULTIPLIER: 1.5,
  MINIMUM_POINTS: 5,
};

export function calculateExpeditionReward(
  score: number,
  level: number,
  discovered: number,
  isDailyChallenge: boolean = false
): ExpeditionReward {
  const base = EXPEDITION_REWARD_CONFIG.BASE_POINTS;
  const levelReward = level * EXPEDITION_REWARD_CONFIG.POINTS_PER_LEVEL;
  const discoveryReward = discovered * EXPEDITION_REWARD_CONFIG.POINTS_PER_DISCOVERY;
  const scoreReward = Math.floor(score / 100) * EXPEDITION_REWARD_CONFIG.POINTS_PER_100_SCORE;

  let total = base + levelReward + discoveryReward + scoreReward;
  let dailyBonus = 0;

  if (isDailyChallenge) {
    dailyBonus = Math.floor(total * (EXPEDITION_REWARD_CONFIG.DAILY_CHALLENGE_MULTIPLIER - 1));
    total += dailyBonus;
  }

  total = Math.max(EXPEDITION_REWARD_CONFIG.MINIMUM_POINTS, total);

  return {
    points: total,
    breakdown: {
      base,
      level: levelReward,
      discoveries: discoveryReward,
      score: scoreReward,
      dailyBonus,
    },
  };
}

export function getTechById(id: string): TechNode | undefined {
  return TECH_TREE.find((t) => t.id === id);
}

export function getTechByCategory(category: string): TechNode[] {
  return TECH_TREE.filter((t) => t.category === category).sort((a, b) => a.tier - b.tier);
}
