import type { RelayRole, RelayPhase, RelayRoleType, RelayPhaseType } from '../types/game';

export const RELAY_ROLES: Record<RelayRoleType, RelayRole> = {
  sonar_operator: {
    id: 'sonar_operator',
    name: '声呐操作员',
    icon: '🔊',
    description: '负责释放声呐波，探测隐藏目标',
    ability: '声呐范围+30%，速度+20%',
    color: '#00ccff',
    stats: {
      sonarRadiusMul: 1.3,
      sonarSpeedMul: 1.2,
    },
  },
  navigator: {
    id: 'navigator',
    name: '导航员',
    icon: '🧭',
    description: '负责操控潜航器移动，规避危险区域',
    ability: '移动速度+40%，额外+1生命',
    color: '#ffcc00',
    stats: {
      moveSpeedMul: 1.4,
      livesBonus: 1,
    },
  },
  collector: {
    id: 'collector',
    name: '采集员',
    icon: '📦',
    description: '负责点击回波收集目标，获得分数',
    ability: '得分+25%，额外+2声呐充能',
    color: '#00ff88',
    stats: {
      scoreMul: 1.25,
      sonarChargesBonus: 2,
    },
  },
};

export const RELAY_PHASES: Record<RelayPhaseType, RelayPhase> = {
  detection: {
    id: 'detection',
    name: '探测阶段',
    icon: '🔊',
    description: '声呐操作员释放声呐，标记所有可疑目标',
    role: 'sonar_operator',
    duration: 45,
    targetGoal: '探测至少4个目标',
  },
  navigation: {
    id: 'navigation',
    name: '导航阶段',
    icon: '🧭',
    description: '导航员操控潜航器安全穿过危险区域',
    role: 'navigator',
    duration: 30,
    targetGoal: '移动到下潜深度，损失生命≤1',
  },
  collection: {
    id: 'collection',
    name: '采集阶段',
    icon: '📦',
    description: '采集员点击已标记的回波，收集生物和残骸',
    role: 'collector',
    duration: 40,
    targetGoal: '收集≥80%已发现目标',
  },
};

export const RELAY_CONFIG = {
  GAME: {
    INITIAL_LIVES: 3,
    INITIAL_SONAR_CHARGES: 6,
    MAX_LEVELS: 5,
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 3,
    PHASE_TRANSITION_DELAY: 2500,
    LEVEL_CLEAR_BONUS: 500,
    PERFECT_PHASE_BONUS: 300,
    COMBO_MULTIPLIER: 0.1,
    MAX_COMBO: 10,
  },
  SCORE: {
    CREATURE_POINTS: 100,
    WRECK_POINTS: 200,
    DANGER_PENALTY: -150,
    TARGET_DISCOVERY_BONUS: 50,
    PHASE_COMPLETION_BONUS: 200,
    TIME_BONUS_PER_SEC: 10,
  },
  MAP: {
    WIDTH: 800,
    HEIGHT: 1200,
  },
  SONAR: {
    MAX_RADIUS: 500,
    SPEED: 280,
    RECHARGE_TIME: 3000,
    COLOR: 0x00ffaa,
  },
  TARGETS: {
    CREATURE_COUNT: 6,
    WRECK_COUNT: 3,
    DANGER_COUNT: 4,
    MIN_RADIUS: 18,
    MAX_RADIUS: 45,
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

export const RELAY_AVATARS = ['🐙', '🦈', '🐠', '🐢', '🦀', '🐡', '🦑', '🐋'];

export const RELAY_PLAYER_NAMES = ['玩家1', '玩家2', '玩家3'];

export const RELAY_PHASE_SEQUENCE: RelayPhaseType[] = ['detection', 'navigation', 'collection'];
