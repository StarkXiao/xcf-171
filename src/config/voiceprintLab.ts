import type { VoiceprintTarget, VoiceprintRiskProfile, VoiceprintTargetCategory, VoiceprintSampleQuality } from '../types/game';

export const VOICEPRINT_CONFIG = {
  GAME: {
    INITIAL_LIVES: 3,
    INITIAL_SONAR_CHARGES: 8,
    MAX_SONAR_CHARGES: 12,
    SONAR_RECHARGE_TIME: 4000,
    SAMPLES_PER_TARGET: 5,
    TARGETS_PER_LEVEL: 4,
    LEVEL_UP_BONUS: 300,
    COMBO_BONUS_BASE: 50,
  },
  SONAR: {
    SAMPLE_COST: 1,
    PRECISE_SAMPLE_COST: 2,
    ECHO_DURATION: 1200,
  },
  RISK: {
    HIGH_RISK_THRESHOLD: 2,
    EXTREME_RISK_THRESHOLD: 1,
  },
} as const;

export const RISK_PROFILES: VoiceprintRiskProfile[] = [
  {
    sampleCount: 1,
    successRate: 0.30,
    rewardMultiplier: 5.0,
    penaltyMultiplier: 3.0,
    label: '孤注一掷',
  },
  {
    sampleCount: 2,
    successRate: 0.50,
    rewardMultiplier: 3.0,
    penaltyMultiplier: 2.0,
    label: '风险投资',
  },
  {
    sampleCount: 3,
    successRate: 0.70,
    rewardMultiplier: 2.0,
    penaltyMultiplier: 1.5,
    label: '谨慎分析',
  },
  {
    sampleCount: 4,
    successRate: 0.85,
    rewardMultiplier: 1.3,
    penaltyMultiplier: 0.8,
    label: '稳扎稳打',
  },
  {
    sampleCount: 5,
    successRate: 0.95,
    rewardMultiplier: 1.0,
    penaltyMultiplier: 0.5,
    label: '万无一失',
  },
];

export const GENUINE_TARGET_POOL: Omit<VoiceprintTarget, 'id' | 'position' | 'radius' | 'revealed' | 'analyzed' | 'verdictCorrect' | 'genuineFeatures' | 'decoyFeatures'>[] = [
  {
    name: '深海蓝鲸',
    category: 'creature',
    isGenuine: true,
    basePoints: 500,
    riskLevel: 'medium',
    description: '低频声波具有独特的周期性模式，是深海蓝鲸的典型特征。',
    icon: '🐋',
  },
  {
    name: '巨型乌贼',
    category: 'creature',
    isGenuine: true,
    basePoints: 600,
    riskLevel: 'high',
    description: '发出不规则的脉冲信号，伴随轻微的水流扰动。',
    icon: '🦑',
  },
  {
    name: '透明水母群',
    category: 'creature',
    isGenuine: true,
    basePoints: 350,
    riskLevel: 'low',
    description: '高频连续信号，呈现规律性波动。',
    icon: '🎐',
  },
  {
    name: '古代沉船',
    category: 'wreck',
    isGenuine: true,
    basePoints: 800,
    riskLevel: 'medium',
    description: '金属结构产生的多重回波，具有明显的反射特征。',
    icon: '⚓',
  },
  {
    name: '废弃潜艇',
    category: 'wreck',
    isGenuine: true,
    basePoints: 900,
    riskLevel: 'high',
    description: '圆柱形壳体产生的独特声纹，两端有明显的反射端点。',
    icon: '🚢',
  },
  {
    name: '海底遗迹',
    category: 'wreck',
    isGenuine: true,
    basePoints: 1000,
    riskLevel: 'extreme',
    description: '复杂的几何结构产生的多重反射波，信号极为丰富。',
    icon: '🏛️',
  },
  {
    name: '热液喷口',
    category: 'anomaly',
    isGenuine: true,
    basePoints: 700,
    riskLevel: 'high',
    description: '混沌的气泡和湍流信号，伴随高频噪声。',
    icon: '🌋',
  },
  {
    name: '海底冷泉',
    category: 'anomaly',
    isGenuine: true,
    basePoints: 650,
    riskLevel: 'medium',
    description: '稳定的低频脉动信号，气体缓慢上升产生的特征。',
    icon: '💨',
  },
];

export const DECOY_TARGET_POOL: Omit<VoiceprintTarget, 'id' | 'position' | 'radius' | 'revealed' | 'analyzed' | 'verdictCorrect' | 'genuineFeatures' | 'decoyFeatures'>[] = [
  {
    name: '岩石堆',
    category: 'wreck',
    isGenuine: false,
    basePoints: 400,
    riskLevel: 'low',
    description: '不规则的反射信号，但缺乏人造物体的结构特征。',
    icon: '🪨',
  },
  {
    name: '鱼群',
    category: 'creature',
    isGenuine: false,
    basePoints: 300,
    riskLevel: 'low',
    description: '大量小型反射体产生的密集信号，缺乏个体特征。',
    icon: '🐟',
  },
  {
    name: '海草森林',
    category: 'creature',
    isGenuine: false,
    basePoints: 250,
    riskLevel: 'low',
    description: '柔软的回波信号，随水流摆动产生频率变化。',
    icon: '🌿',
  },
  {
    name: '气泡云',
    category: 'anomaly',
    isGenuine: false,
    basePoints: 350,
    riskLevel: 'medium',
    description: '快速消散的高频信号，缺乏持续性。',
    icon: '🫧',
  },
  {
    name: '地形起伏',
    category: 'wreck',
    isGenuine: false,
    basePoints: 450,
    riskLevel: 'medium',
    description: '大面积的缓慢反射，缺乏明确的边缘特征。',
    icon: '🏔️',
  },
  {
    name: '温跃层',
    category: 'anomaly',
    isGenuine: false,
    basePoints: 500,
    riskLevel: 'high',
    description: '温度突变产生的反射层，信号清晰但非实体。',
    icon: '🌊',
  },
  {
    name: '浮游生物层',
    category: 'creature',
    isGenuine: false,
    basePoints: 200,
    riskLevel: 'low',
    description: '弥散的弱反射信号，分布均匀且无明显结构。',
    icon: '✨',
  },
];

export const SAMPLE_QUALITY_INFO: Record<VoiceprintSampleQuality, { label: string; color: string; weight: number }> = {
  poor: { label: '劣质', color: '#ff6666', weight: 0.5 },
  fair: { label: '一般', color: '#ffcc00', weight: 0.8 },
  good: { label: '良好', color: '#66ff99', weight: 1.0 },
  excellent: { label: '优异', color: '#00ffcc', weight: 1.3 },
};

export const CATEGORY_INFO: Record<VoiceprintTargetCategory, { label: string; color: string; icon: string }> = {
  creature: { label: '生物', color: '#00e5ff', icon: '🐟' },
  wreck: { label: '残骸', color: '#ffcc00', icon: '⚓' },
  anomaly: { label: '异象', color: '#ff66ff', icon: '🌀' },
};

export const RISK_LEVEL_INFO = {
  low: { label: '低风险', color: '#66ff99', bgColor: 'rgba(102, 255, 153, 0.15)' },
  medium: { label: '中风险', color: '#ffcc00', bgColor: 'rgba(255, 204, 0, 0.15)' },
  high: { label: '高风险', color: '#ff8844', bgColor: 'rgba(255, 136, 68, 0.15)' },
  extreme: { label: '极高风险', color: '#ff3355', bgColor: 'rgba(255, 51, 85, 0.15)' },
} as const;

export function getRiskProfile(sampleCount: number): VoiceprintRiskProfile {
  const clampedCount = Math.max(1, Math.min(VOICEPRINT_CONFIG.GAME.SAMPLES_PER_TARGET, sampleCount));
  return RISK_PROFILES[clampedCount - 1];
}

export function calculateVerdictPoints(
  basePoints: number,
  sampleCount: number,
  isCorrect: boolean,
  consecutiveBonus: number = 0
): { pointsGained: number; pointsLost: number } {
  const profile = getRiskProfile(sampleCount);
  
  if (isCorrect) {
    const baseReward = Math.round(basePoints * profile.rewardMultiplier);
    const comboBonus = consecutiveBonus * VOICEPRINT_CONFIG.GAME.COMBO_BONUS_BASE;
    return {
      pointsGained: baseReward + comboBonus,
      pointsLost: 0,
    };
  } else {
    return {
      pointsGained: 0,
      pointsLost: Math.round(basePoints * profile.penaltyMultiplier),
    };
  }
}

export function generateEchoFeatures(
  isGenuine: boolean,
  count: number
) {
  const patterns: Array<'regular' | 'irregular' | 'chaotic' | 'pulsing'> = ['regular', 'irregular', 'chaotic', 'pulsing'];
  const qualities: VoiceprintSampleQuality[] = ['poor', 'fair', 'good', 'excellent'];
  
  const features = [];
  for (let i = 0; i < count; i++) {
    const qualityRoll = Math.random();
    let quality: VoiceprintSampleQuality;
    if (qualityRoll < 0.15) quality = 'poor';
    else if (qualityRoll < 0.45) quality = 'fair';
    else if (qualityRoll < 0.8) quality = 'good';
    else quality = 'excellent';

    features.push({
      id: Date.now() + i + Math.random() * 10000,
      frequency: isGenuine 
        ? 50 + Math.random() * 150 
        : 20 + Math.random() * 200,
      amplitude: isGenuine 
        ? 0.6 + Math.random() * 0.4 
        : 0.3 + Math.random() * 0.5,
      duration: isGenuine 
        ? 80 + Math.random() * 120 
        : 40 + Math.random() * 160,
      pattern: patterns[Math.floor(Math.random() * patterns.length)],
      isGenuine,
      quality,
      noiseLevel: 1 - SAMPLE_QUALITY_INFO[quality].weight,
    });
  }
  return features;
}

export function generateVoiceprintTarget(
  mapWidth: number,
  mapHeight: number,
  existingTargets: VoiceprintTarget[]
): VoiceprintTarget {
  const genuineChance = 0.55;
  const pool = Math.random() < genuineChance ? GENUINE_TARGET_POOL : DECOY_TARGET_POOL;
  const template = pool[Math.floor(Math.random() * pool.length)];

  let position: { x: number; y: number } = { x: 0, y: 0 };
  let attempts = 0;
  const margin = 60;
  
  do {
    position = {
      x: margin + Math.random() * (mapWidth - 2 * margin),
      y: margin + Math.random() * (mapHeight - 2 * margin),
    };
    attempts++;
  } while (
    attempts < 50 &&
    existingTargets.some(t => {
      const dx = t.position.x - position.x;
      const dy = t.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) < 100;
    })
  );

  const genuineFeatures = generateEchoFeatures(true, 3);
  const decoyFeatures = generateEchoFeatures(false, 3);

  return {
    ...template,
    id: Date.now() + Math.random() * 10000,
    position,
    radius: 25 + Math.random() * 15,
    revealed: false,
    analyzed: false,
    genuineFeatures,
    decoyFeatures,
  };
}

export function getRank(accuracy: number, score: number, level: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  const scoreThresholds = [
    { rank: 'S' as const, minAccuracy: 0.9, minScore: 5000, minLevel: 5 },
    { rank: 'A' as const, minAccuracy: 0.75, minScore: 3000, minLevel: 4 },
    { rank: 'B' as const, minAccuracy: 0.6, minScore: 1500, minLevel: 3 },
    { rank: 'C' as const, minAccuracy: 0.4, minScore: 500, minLevel: 2 },
  ];

  for (const threshold of scoreThresholds) {
    if (accuracy >= threshold.minAccuracy && score >= threshold.minScore && level >= threshold.minLevel) {
      return threshold.rank;
    }
  }
  return 'D';
}
