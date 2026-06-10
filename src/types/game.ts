export interface Position {
  x: number;
  y: number;
}

export type TargetType = 'creature' | 'wreck' | 'danger';

export interface Target {
  id: number;
  type: TargetType;
  position: Position;
  radius: number;
  name: string;
  points: number;
  discovered: boolean;
  collected: boolean;
  shape: 'circle' | 'triangle' | 'square' | 'irregular';
  rotation: number;
}

export interface CollectionEntry {
  name: string;
  type: TargetType;
  unlocked: boolean;
  firstDiscoveredAt: Position | null;
  firstDiscoveredLevel: number;
  discoveryCount: number;
  bestScore: number;
  lastDiscoveredAt: number;
}

export interface CollectionData {
  creatures: Record<string, CollectionEntry>;
  wrecks: Record<string, CollectionEntry>;
  dangers: Record<string, CollectionEntry>;
}

export interface UnlockEvent {
  name: string;
  type: TargetType;
  isNew: boolean;
  entry: CollectionEntry;
}

export interface SonarWave {
  id: number;
  position: Position;
  radius: number;
  maxRadius: number;
  speed: number;
  active: boolean;
  alpha: number;
}

export interface EchoPoint {
  id: number;
  position: Position;
  targetId: number;
  type: TargetType;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface GameState {
  score: number;
  lives: number;
  level: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  sonarCharges: number;
  maxSonarCharges: number;
  discoveredTargets: number;
  totalTargets: number;
}

export type SubmarineTier = 'scout' | 'standard' | 'heavy';
export type SonarChipTier = 'basic' | 'precision' | 'wide';
export type SupplyPackTier = 'light' | 'standard' | 'premium';

export interface Submarine {
  id: SubmarineTier;
  name: string;
  description: string;
  icon: string;
  stats: {
    mapHeightMul: number;
    livesBonus: number;
    moveSpeedMul: number;
  };
}

export interface SonarChip {
  id: SonarChipTier;
  name: string;
  description: string;
  icon: string;
  stats: {
    sonarRadiusMul: number;
    sonarSpeedMul: number;
    maxChargesBonus: number;
    precisionBonus: number;
  };
}

export interface SupplyPack {
  id: SupplyPackTier;
  name: string;
  description: string;
  icon: string;
  stats: {
    creatureCountMul: number;
    wreckCountMul: number;
    dangerCountMul: number;
    scoreMul: number;
    creaturePointsBonus: number;
    wreckPointsBonus: number;
    initialSonarBonus: number;
  };
}

export interface ExpeditionLoadout {
  submarine: SubmarineTier;
  sonarChip: SonarChipTier;
  supplyPack: SupplyPackTier;
}

export interface LoadoutEffects {
  mapHeight: number;
  livesBonus: number;
  sonarRadius: number;
  sonarSpeed: number;
  maxSonarCharges: number;
  creatureCountMul: number;
  wreckCountMul: number;
  dangerCountMul: number;
  scoreMul: number;
  creaturePointsBonus: number;
  wreckPointsBonus: number;
  initialSonarBonus: number;
  precisionBonus: number;
  sonarRechargeTimeMul: number;
  intelligenceRadar: boolean;
}

export type DailyChallengeRuleType =
  | 'limited_lives'
  | 'limited_sonar'
  | 'no_recharge'
  | 'speed_sonar'
  | 'more_dangers'
  | 'bonus_score'
  | 'fog_of_war'
  | 'single_life';

export interface DailyChallengeRule {
  type: DailyChallengeRuleType;
  name: string;
  description: string;
  icon: string;
}

export interface DailyChallengeConfig {
  date: string;
  seed: number;
  title: string;
  description: string;
  rules: DailyChallengeRule[];
  targetLevel: number;
  timeLimit?: number;
}

export interface DailyChallengeRecord {
  date: string;
  score: number;
  level: number;
  discovered: number;
  completedAt: number;
  rank: string;
}

export interface DailyChallengeLeaderboardEntry {
  rank: number;
  score: number;
  level: number;
  playerName: string;
  completedAt: number;
  isCurrentPlayer: boolean;
}

export interface DailyChallengeSaveData {
  bestRecord: DailyChallengeRecord | null;
  attempts: number;
  lastAttemptAt: number | null;
  completedDates: string[];
  history: DailyChallengeRecord[];
  playerName: string;
}

export type TechCategory = 'sonar' | 'power' | 'radar' | 'core';

export type TechEffectType =
  | 'sonarRadiusBonus'
  | 'maxChargesBonus'
  | 'rechargeSpeedBonus'
  | 'intelligenceRadar'
  | 'scoreBonus'
  | 'livesBonus'
  | 'initialSonarBonus'
  | 'creaturePointsBonus'
  | 'wreckPointsBonus';

export interface TechNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TechCategory;
  tier: number;
  cost: number;
  requires: string[];
  effects: Partial<Record<TechEffectType, number>>;
}

export interface TechProgress {
  unlocked: string[];
  expeditionPoints: number;
  totalExpeditionPoints: number;
  expeditionsCompleted: number;
}

export interface ResearchStationStats {
  expeditionPoints: number;
  totalExpeditionPoints: number;
  expeditionsCompleted: number;
  unlockedCount: number;
  totalTechCount: number;
  categoryProgress: Record<TechCategory, { unlocked: number; total: number }>;
}

export interface ExpeditionReward {
  points: number;
  breakdown: {
    base: number;
    level: number;
    discoveries: number;
    score: number;
    dailyBonus: number;
  };
}

export type RescueTargetStatus = 'unknown' | 'suspected' | 'confirmed' | 'rescued';

export interface RescueCapsule {
  id: number;
  position: Position;
  radius: number;
  status: RescueTargetStatus;
  isReal: boolean;
  name: string;
  distressSignalStrength: number;
  discovered: boolean;
  rescued: boolean;
}

export interface InterferenceZone {
  id: number;
  position: Position;
  radius: number;
  intensity: number;
  type: 'noise' | 'decoy' | 'blocker';
}

export interface RescuePath {
  id: number;
  points: Position[];
  isSafe: boolean;
  dangerLevel: number;
}

export interface RescueGameState {
  score: number;
  timeRemaining: number;
  totalTime: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  capsulesFound: number;
  capsulesRescued: number;
  totalRealCapsules: number;
  falseReports: number;
  maxFalseReports: number;
  sonarCharges: number;
  maxSonarCharges: number;
  playerPosition: Position;
  rescueMeter: number;
  currentLevel: number;
}

export interface RescueResult {
  victory: boolean;
  score: number;
  capsulesRescued: number;
  totalRealCapsules: number;
  falseReports: number;
  timeRemaining: number;
  totalTime: number;
  sonarUsed: number;
  level: number;
  accuracy: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  rescuePoints: number;
}

export type RescueEvent =
  | { type: 'sonar_fired'; position: Position }
  | { type: 'capsule_detected'; capsuleId: number; position: Position }
  | { type: 'false_report'; position: Position; penalty: number }
  | { type: 'capsule_confirmed'; capsuleId: number; bonus: number }
  | { type: 'rescue_success'; capsuleId: number; bonus: number }
  | { type: 'time_warning'; remaining: number }
  | { type: 'game_over'; result: RescueResult };
