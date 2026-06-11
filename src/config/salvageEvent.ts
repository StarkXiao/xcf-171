import type { SalvageEventConfig, SalvageEventWreck, SalvagePhaseGoal, SalvageExchangeItem } from '../types/game';

const EVENT_WRECKS: SalvageEventWreck[] = [
  {
    id: 'bronze_anchor',
    name: '青铜船锚',
    description: '来自17世纪商船的古老船锚，锈迹斑斑却保存完好。',
    icon: '⚓',
    rarity: 'common',
    basePoints: 250,
    eventBonus: 50,
    minRadius: 22,
    maxRadius: 35,
    shape: 'irregular',
  },
  {
    id: 'porcelain_crate',
    name: '瓷器货箱',
    description: '密封的陶瓷货箱，内装精美的东方瓷器。',
    icon: '🏺',
    rarity: 'common',
    basePoints: 300,
    eventBonus: 60,
    minRadius: 25,
    maxRadius: 38,
    shape: 'square',
  },
  {
    id: 'captain_log',
    name: '船长日志',
    description: '防水皮革包裹的航海日志，记录着传奇航程。',
    icon: '📜',
    rarity: 'rare',
    basePoints: 450,
    eventBonus: 100,
    minRadius: 20,
    maxRadius: 30,
    shape: 'circle',
  },
  {
    id: 'gold_coin_barrel',
    name: '金币桶',
    description: '满满一桶西班牙金币，闪耀着诱人的光芒。',
    icon: '🪙',
    rarity: 'rare',
    basePoints: 600,
    eventBonus: 150,
    minRadius: 28,
    maxRadius: 42,
    shape: 'circle',
  },
  {
    id: 'royal_scepter',
    name: '皇家权杖',
    description: '镶嵌宝石的皇家权杖，传说属于失落王国的君主。',
    icon: '👑',
    rarity: 'epic',
    basePoints: 900,
    eventBonus: 250,
    minRadius: 24,
    maxRadius: 36,
    shape: 'triangle',
  },
  {
    id: 'pearl_of_deep',
    name: '深渊之珠',
    description: '传说中来自海渊最深处的巨型黑珍珠，散发神秘光泽。',
    icon: '🔮',
    rarity: 'epic',
    basePoints: 1200,
    eventBonus: 350,
    minRadius: 26,
    maxRadius: 40,
    shape: 'circle',
  },
  {
    id: 'atlantis_core',
    name: '亚特兰蒂斯核心',
    description: '失落文明的能量核心，蕴含着远古科技的力量。',
    icon: '💎',
    rarity: 'legendary',
    basePoints: 2000,
    eventBonus: 600,
    minRadius: 30,
    maxRadius: 48,
    shape: 'irregular',
  },
];

const PHASE_GOALS: SalvagePhaseGoal[] = [
  {
    id: 'phase_1',
    phase: 1,
    title: '初出茅庐',
    description: '收集 5 件活动残骸',
    targetType: 'total_wrecks',
    targetValue: 5,
    rewardType: 'bonus_points',
    rewardValue: 500,
    rewardName: '500 活动积分',
  },
  {
    id: 'phase_2',
    phase: 2,
    title: '渐入佳境',
    description: '收集 15 件活动残骸',
    targetType: 'total_wrecks',
    targetValue: 15,
    rewardType: 'sonar_charges',
    rewardValue: 3,
    rewardName: '+3 声呐充能上限',
  },
  {
    id: 'phase_3',
    phase: 3,
    title: '稀世珍藏',
    description: '收集 3 件稀有或以上残骸',
    targetType: 'rare_wrecks',
    targetValue: 3,
    rewardType: 'wreck_multiplier',
    rewardValue: 1.5,
    rewardName: '残骸分数 ×1.5',
  },
  {
    id: 'phase_4',
    phase: 4,
    title: '探险老手',
    description: '完成 8 次远征',
    targetType: 'expeditions',
    targetValue: 8,
    rewardType: 'extra_life',
    rewardValue: 2,
    rewardName: '+2 初始生命',
  },
  {
    id: 'phase_5',
    phase: 5,
    title: '打捞大师',
    description: '累计获得 15000 活动分数',
    targetType: 'score',
    targetValue: 15000,
    rewardType: 'bonus_points',
    rewardValue: 3000,
    rewardName: '3000 活动积分',
  },
  {
    id: 'phase_6',
    phase: 6,
    title: '传奇探险家',
    description: '收集 1 件传说残骸',
    targetType: 'rare_wrecks',
    targetValue: 1,
    rewardType: 'special_item',
    rewardValue: 1,
    rewardName: '深海传奇称号',
  },
];

const EXCHANGE_ITEMS: SalvageExchangeItem[] = [
  {
    id: 'exchange_sonar',
    name: '声呐充能包',
    description: '立即获得 2 次声呐使用次数（仅本局）',
    icon: '🔊',
    cost: 200,
    rewardType: 'sonar_charges',
    rewardValue: 2,
    stock: 99,
    maxStock: 99,
    sortOrder: 1,
  },
  {
    id: 'exchange_life',
    name: '应急氧气罐',
    description: '立即恢复 1 点生命（仅本局）',
    icon: '❤️',
    cost: 500,
    rewardType: 'extra_life',
    rewardValue: 1,
    stock: 3,
    maxStock: 3,
    sortOrder: 2,
  },
  {
    id: 'exchange_boost',
    name: '残骸探测增幅',
    description: '本局残骸分数 +50%',
    icon: '📈',
    cost: 800,
    rewardType: 'wreck_multiplier',
    rewardValue: 1.5,
    stock: 1,
    maxStock: 1,
    sortOrder: 3,
  },
  {
    id: 'exchange_grand',
    name: '大师打捞包',
    description: '声呐+2、生命+1、残骸分数+30%',
    icon: '🎁',
    cost: 1500,
    rewardType: 'special_item',
    rewardValue: 1,
    stock: 1,
    maxStock: 1,
    sortOrder: 4,
  },
];

const now = Date.now();
const ONE_DAY = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * ONE_DAY;

export const SALVAGE_EVENT_CONFIG: SalvageEventConfig = {
  id: 'salvage_season_001',
  title: '限时打捞季',
  subtitle: 'Salvage Season',
  description: '深海中隐藏着无数失落的宝藏。在限定时间内，探索专属残骸池，完成阶段目标，用打捞积分兑换丰厚奖励！',
  startTime: now - ONE_DAY,
  endTime: now + SEVEN_DAYS * 2,
  eventWrecks: EVENT_WRECKS,
  phaseGoals: PHASE_GOALS,
  exchangeItems: EXCHANGE_ITEMS,
  wreckWeightBonus: 2.0,
  wreckCountMultiplier: 1.8,
};

export const getEventWreckById = (id: string): SalvageEventWreck | undefined => {
  return EVENT_WRECKS.find(w => w.id === id);
};

export const getPhaseGoalById = (id: string): SalvagePhaseGoal | undefined => {
  return PHASE_GOALS.find(p => p.id === id);
};

export const getExchangeItemById = (id: string): SalvageExchangeItem | undefined => {
  return EXCHANGE_ITEMS.find(i => i.id === id);
};

export const getWrecksByRarity = (rarity: SalvageEventWreck['rarity']): SalvageEventWreck[] => {
  return EVENT_WRECKS.filter(w => w.rarity === rarity);
};

export const getRarityWeight = (rarity: SalvageEventWreck['rarity']): number => {
  const weights: Record<SalvageEventWreck['rarity'], number> = {
    common: 50,
    rare: 25,
    epic: 15,
    legendary: 5,
  };
  return weights[rarity];
};

export const getRarityLabel = (rarity: SalvageEventWreck['rarity']): string => {
  const labels: Record<SalvageEventWreck['rarity'], string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  };
  return labels[rarity];
};

export const getRarityColor = (rarity: SalvageEventWreck['rarity']): string => {
  const colors: Record<SalvageEventWreck['rarity'], string> = {
    common: '#9ca3af',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
  };
  return colors[rarity];
};
