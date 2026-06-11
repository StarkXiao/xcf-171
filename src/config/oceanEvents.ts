import type { OceanEventConfig, OceanEventType } from '../types/game';

export const OCEAN_EVENTS: Record<OceanEventType, OceanEventConfig> = {
  current: {
    type: 'current',
    name: '深海洋流',
    description: '强劲的深海洋流，能加速声呐传播',
    icon: '🌊',
    color: 0x00aaff,
    baseRadius: 120,
    baseIntensity: 1.5,
    baseDuration: 20,
    spawnChance: 0.35,
    maxCount: 2,
    effectValue: 1.4,
  },
  interference: {
    type: 'interference',
    name: '信号干扰区',
    description: '海底地质异常导致声呐信号衰减',
    icon: '📡',
    color: 0xaa44ff,
    baseRadius: 100,
    baseIntensity: 0.6,
    baseDuration: 25,
    spawnChance: 0.3,
    maxCount: 2,
    effectValue: 0.6,
  },
  treasure: {
    type: 'treasure',
    name: '神秘宝藏',
    description: '传说中的深海宝藏，价值连城',
    icon: '💎',
    color: 0xffdd00,
    baseRadius: 30,
    baseIntensity: 1.0,
    baseDuration: 30,
    spawnChance: 0.2,
    maxCount: 1,
    effectValue: 500,
  },
};

export const OCEAN_EVENT_CONFIG = {
  INITIAL_SPAWN_DELAY: 5,
  SPAWN_INTERVAL_MIN: 15,
  SPAWN_INTERVAL_MAX: 25,
  LEVEL_EVENT_BONUS: 0.05,
  TREASURE_POINTS_MULTIPLIER: 3,
  TREASURE_COLLECTION_BONUS: 200,
  CURRENT_SONAR_SPEED_BONUS: 1.3,
  INTERFERENCE_SONAR_RADIUS_PENALTY: 0.7,
  EVENT_ZONE_VISUAL_ALPHA: 0.15,
  EVENT_NOTIFICATION_DURATION: 3,
};

export const getOceanEventConfig = (type: OceanEventType): OceanEventConfig => {
  return OCEAN_EVENTS[type];
};

export const getEventLabel = (type: OceanEventType): string => {
  const labels: Record<OceanEventType, string> = {
    current: '洋流',
    interference: '干扰',
    treasure: '宝藏',
  };
  return labels[type];
};

export const getEventColor = (type: OceanEventType): string => {
  const colors: Record<OceanEventType, string> = {
    current: '#00aaff',
    interference: '#aa44ff',
    treasure: '#ffdd00',
  };
  return colors[type];
};
