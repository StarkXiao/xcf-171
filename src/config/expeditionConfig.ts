import type {
  Submarine,
  SonarChip,
  SupplyPack,
  ExpeditionLoadout,
  LoadoutEffects,
  SubmarineTier,
  SonarChipTier,
  SupplyPackTier,
  TechEffectType,
} from '../types/game';
import { GAME_CONFIG } from './gameConfig';

export const SUBMARINES: Submarine[] = [
  {
    id: 'scout',
    name: '侦察潜航器',
    description: '轻型高速，探索范围小但机动灵活',
    icon: '🛸',
    stats: {
      mapHeightMul: 0.7,
      livesBonus: 0,
      moveSpeedMul: 1.3,
    },
  },
  {
    id: 'standard',
    name: '标准潜航器',
    description: '均衡配置，适合各种深度任务',
    icon: '🚤',
    stats: {
      mapHeightMul: 1.0,
      livesBonus: 0,
      moveSpeedMul: 1.0,
    },
  },
  {
    id: 'heavy',
    name: '重型潜航器',
    description: '坚固装甲，探索范围大但速度较慢',
    icon: '🛳️',
    stats: {
      mapHeightMul: 1.4,
      livesBonus: 2,
      moveSpeedMul: 0.8,
    },
  },
];

export const SONAR_CHIPS: SonarChip[] = [
  {
    id: 'basic',
    name: '基础声呐芯片',
    description: '标准探测性能，稳定可靠',
    icon: '📡',
    stats: {
      sonarRadiusMul: 1.0,
      sonarSpeedMul: 1.0,
      maxChargesBonus: 0,
      precisionBonus: 0,
    },
  },
  {
    id: 'precision',
    name: '精准声呐芯片',
    description: '高精度回波，声呐扩散快但范围较小',
    icon: '🎯',
    stats: {
      sonarRadiusMul: 0.8,
      sonarSpeedMul: 1.4,
      maxChargesBonus: 1,
      precisionBonus: 1,
    },
  },
  {
    id: 'wide',
    name: '广域声呐芯片',
    description: '大范围覆盖，一次探测更多区域',
    icon: '🌊',
    stats: {
      sonarRadiusMul: 1.4,
      sonarSpeedMul: 0.85,
      maxChargesBonus: 2,
      precisionBonus: 0,
    },
  },
];

export const SUPPLY_PACKS: SupplyPack[] = [
  {
    id: 'light',
    name: '轻装补给包',
    description: '低风险低收益，目标稀少但危险也少',
    icon: '🎒',
    stats: {
      creatureCountMul: 0.7,
      wreckCountMul: 0.7,
      dangerCountMul: 0.5,
      scoreMul: 0.85,
      creaturePointsBonus: 0,
      wreckPointsBonus: 0,
      initialSonarBonus: 1,
    },
  },
  {
    id: 'standard',
    name: '标准补给包',
    description: '均衡物资配置，适合常规远征',
    icon: '📦',
    stats: {
      creatureCountMul: 1.0,
      wreckCountMul: 1.0,
      dangerCountMul: 1.0,
      scoreMul: 1.0,
      creaturePointsBonus: 0,
      wreckPointsBonus: 0,
      initialSonarBonus: 0,
    },
  },
  {
    id: 'premium',
    name: '高级补给包',
    description: '高风险高收益，目标密集收益丰厚',
    icon: '💎',
    stats: {
      creatureCountMul: 1.4,
      wreckCountMul: 1.5,
      dangerCountMul: 1.3,
      scoreMul: 1.3,
      creaturePointsBonus: 50,
      wreckPointsBonus: 100,
      initialSonarBonus: 3,
    },
  },
];

export const DEFAULT_LOADOUT: ExpeditionLoadout = {
  submarine: 'standard',
  sonarChip: 'basic',
  supplyPack: 'standard',
};

export function getSubmarine(id: SubmarineTier): Submarine {
  return SUBMARINES.find((s) => s.id === id) ?? SUBMARINES[1];
}

export function getSonarChip(id: SonarChipTier): SonarChip {
  return SONAR_CHIPS.find((s) => s.id === id) ?? SONAR_CHIPS[0];
}

export function getSupplyPack(id: SupplyPackTier): SupplyPack {
  return SUPPLY_PACKS.find((s) => s.id === id) ?? SUPPLY_PACKS[1];
}

export function computeLoadoutEffects(loadout: ExpeditionLoadout): LoadoutEffects {
  const sub = getSubmarine(loadout.submarine);
  const chip = getSonarChip(loadout.sonarChip);
  const pack = getSupplyPack(loadout.supplyPack);

  return {
    mapHeight: Math.round(GAME_CONFIG.MAP_HEIGHT * sub.stats.mapHeightMul),
    livesBonus: sub.stats.livesBonus,
    sonarRadius: GAME_CONFIG.SONAR.MAX_RADIUS * chip.stats.sonarRadiusMul,
    sonarSpeed: GAME_CONFIG.SONAR.SPEED * chip.stats.sonarSpeedMul,
    maxSonarCharges: GAME_CONFIG.SONAR.MAX_CHARGES + chip.stats.maxChargesBonus,
    creatureCountMul: pack.stats.creatureCountMul,
    wreckCountMul: pack.stats.wreckCountMul,
    dangerCountMul: pack.stats.dangerCountMul,
    scoreMul: pack.stats.scoreMul,
    creaturePointsBonus: pack.stats.creaturePointsBonus,
    wreckPointsBonus: pack.stats.wreckPointsBonus,
    initialSonarBonus: pack.stats.initialSonarBonus,
    precisionBonus: chip.stats.precisionBonus,
    sonarRechargeTimeMul: 1.0,
    intelligenceRadar: false,
  };
}

export function applyTechEffects(
  baseEffects: LoadoutEffects,
  techEffects: Partial<Record<TechEffectType, number>>
): LoadoutEffects {
  const effects = { ...baseEffects };

  if (techEffects.sonarRadiusBonus) {
    effects.sonarRadius = effects.sonarRadius * (1 + techEffects.sonarRadiusBonus);
  }
  if (techEffects.maxChargesBonus) {
    effects.maxSonarCharges = effects.maxSonarCharges + techEffects.maxChargesBonus;
  }
  if (techEffects.rechargeSpeedBonus) {
    effects.sonarRechargeTimeMul = effects.sonarRechargeTimeMul * (1 - techEffects.rechargeSpeedBonus);
  }
  if (techEffects.scoreBonus) {
    effects.scoreMul = effects.scoreMul * (1 + techEffects.scoreBonus);
  }
  if (techEffects.livesBonus) {
    effects.livesBonus = effects.livesBonus + techEffects.livesBonus;
  }
  if (techEffects.initialSonarBonus) {
    effects.initialSonarBonus = effects.initialSonarBonus + techEffects.initialSonarBonus;
  }
  if (techEffects.creaturePointsBonus) {
    effects.creaturePointsBonus = effects.creaturePointsBonus + techEffects.creaturePointsBonus;
  }
  if (techEffects.wreckPointsBonus) {
    effects.wreckPointsBonus = effects.wreckPointsBonus + techEffects.wreckPointsBonus;
  }
  if (techEffects.intelligenceRadar) {
    effects.intelligenceRadar = true;
  }

  return effects;
}
