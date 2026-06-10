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

export type PathFollowStatus = 'idle' | 'following' | 'offtrack' | 'blocked' | 'reached';
export type PathSafetyLevel = 'safe' | 'caution' | 'danger' | 'high_risk' | 'blocked';

export interface RescuePath {
  id: number;
  points: Position[];
  isSafe: boolean;
  dangerLevel: number;
  targetCapsuleId: number;
  safetyLevel: PathSafetyLevel;
  active: boolean;
  completed: boolean;
  progress: number;
  currentSegment: number;
}

export interface PathViolation {
  id: number;
  type: 'offtrack' | 'high_risk_zone' | 'blocker_zone';
  position: Position;
  time: number;
  timePenalty: number;
  scorePenalty: number;
}

export interface RescuePathState {
  activePathId: number | null;
  followStatus: PathFollowStatus;
  currentTargetCapsuleId: number | null;
  yawWarnings: number;
  maxYawWarnings: number;
  distanceFromPath: number;
  maxAllowedDeviation: number;
  pathBonus: number;
  totalPathBonus: number;
  safeDistanceTraveled: number;
  totalPathLength: number;
  pathCompletionRate: number;
  currentSafetyLevel: PathSafetyLevel;
  isInHighRiskZone: boolean;
  isInBlockerZone: boolean;
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
  path: RescuePathState;
}

export interface RescueResult {
  victory: boolean;
  score: number;
  capsulesRescued: number;
  capsulesFound: number;
  totalRealCapsules: number;
  falseReports: number;
  timeRemaining: number;
  totalTime: number;
  sonarUsed: number;
  level: number;
  accuracy: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  rescuePoints: number;
  totalPathBonus: number;
  pathCompletionRate: number;
  offtrackCount: number;
  highRiskIncursions: number;
  blockerCollisions: number;
  safeTravelDistance: number;
  totalPathLength: number;
  perfectPathBonus: boolean;
}

export type RescueEvent =
  | { type: 'sonar_fired'; position: Position }
  | { type: 'capsule_detected'; capsuleId: number; position: Position }
  | { type: 'false_report'; position: Position; penalty: number }
  | { type: 'capsule_confirmed'; capsuleId: number; bonus: number }
  | { type: 'rescue_success'; capsuleId: number; bonus: number }
  | { type: 'time_warning'; remaining: number }
  | { type: 'game_over'; result: RescueResult }
  | { type: 'path_assigned'; pathId: number; capsuleId: number }
  | { type: 'path_start'; pathId: number; capsuleId: number }
  | { type: 'path_offtrack'; distance: number; penalty: number; warning: boolean }
  | { type: 'path_return'; bonus: number }
  | { type: 'high_risk_enter'; zoneId: number; penalty: number }
  | { type: 'high_risk_exit'; zoneId: number }
  | { type: 'blocker_collision'; zoneId: number; penalty: number }
  | { type: 'path_progress'; pathId: number; progress: number; bonus: number }
  | { type: 'path_complete'; pathId: number; bonus: number; perfect: boolean }
  | { type: 'yaw_warning'; remaining: number }
  | { type: 'yaw_failure' };

export interface DangerZone {
  id: number;
  position: Position;
  radius: number;
  intensity: number;
  name: string;
  type: 'minefield' | 'volcano' | 'vortex' | 'toxic';
}

export interface RewardRule {
  type: 'score_multiplier' | 'bonus_points' | 'extra_life' | 'sonar_bonus' | 'combo_bonus';
  condition: {
    type: 'collect_n_creatures' | 'collect_n_wrecks' | 'no_damage' | 'discover_all' | 'time_bonus';
    value: number;
  };
  value: number;
  name: string;
  description: string;
}

export interface OceanLevelConfig {
  id: string;
  name: string;
  description: string;
  mapWidth: number;
  mapHeight: number;
  targetDensity: {
    creature: number;
    wreck: number;
    danger: number;
  };
  targetPoints: {
    creature: number;
    wreck: number;
    danger: number;
  };
  sonar: {
    maxRadius: number;
    speed: number;
    maxCharges: number;
    rechargeTime: number;
  };
  game: {
    initialLives: number;
    targetsPerLevel: number;
  };
  dangerZones: DangerZone[];
  rewardRules: RewardRule[];
  seed?: number;
  createdAt: number;
}

export interface OceanEditorState {
  levels: OceanLevelConfig[];
  activeLevelId: string | null;
  isPlaying: boolean;
}

export type EditorTab = 'basic' | 'targets' | 'danger' | 'rewards' | 'preview';

export type VoyageMode = 'normal' | 'daily_challenge' | 'rescue' | 'custom';

export interface TrajectoryPoint {
  timestamp: number;
  position: Position;
  event?: 'sonar' | 'collect' | 'damage' | 'level_up' | 'pause' | 'rescue' | 'false_report' | 'path_offtrack';
}

export interface ScoreBreakdownItem {
  category: 'creature' | 'wreck' | 'danger' | 'bonus' | 'level_up' | 'combo' | 'rescue' | 'path_bonus';
  name: string;
  count: number;
  totalPoints: number;
  avgPoints: number;
}

export interface ScoreBreakdown {
  items: ScoreBreakdownItem[];
  totalScore: number;
  fromCreatures: number;
  fromWrecks: number;
  fromDanger: number;
  fromBonus: number;
  fromLevelUp: number;
  fromCombo: number;
}

export interface HitRateStats {
  totalSonarFired: number;
  sonarWithDiscovery: number;
  discoveryRate: number;
  totalTaps: number;
  tapsWithHit: number;
  tapAccuracy: number;
  tapsWithMiss: number;
  totalTargets: number;
  collectedTargets: number;
  collectionRate: number;
  discoveredTargets: number;
  discoveryCoverage: number;
  avgSonarPerDiscovery: number;
}

export type AnomalyEventType =
  | 'danger_hit'
  | 'sonar_empty'
  | 'target_missed'
  | 'false_report'
  | 'path_offtrack'
  | 'high_risk_enter'
  | 'blocker_collision'
  | 'yaw_warning'
  | 'yaw_failure';

export interface AnomalyEvent {
  id: string;
  type: AnomalyEventType;
  timestamp: number;
  position: Position;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data?: Record<string, any>;
}

export interface DifficultyMetrics {
  avgTimePerLevel: number;
  livesLostPerLevel: number;
  dangerHitRate: number;
  sonarEfficiency: number;
  averageLevelReached: number;
  completionRate: number;
}

export interface DifficultyRecommendation {
  id: string;
  category: 'sonar' | 'target' | 'danger' | 'lives' | 'level_progression' | 'rescue';
  severity: 'suggestion' | 'adjustment' | 'warning';
  title: string;
  description: string;
  currentValue: number;
  suggestedValue: number;
  impact: string;
}

export interface VoyageRecord {
  id: string;
  mode: VoyageMode;
  modeLabel: string;
  startedAt: number;
  endedAt: number;
  duration: number;
  finalScore: number;
  peakScore: number;
  finalLevel: number;
  peakLevel: number;
  loadout?: ExpeditionLoadout;
  dailyChallengeTitle?: string;
  rescueLevel?: number;
  isVictory: boolean;
  isNewRecord: boolean;
  rank?: 'S' | 'A' | 'B' | 'C' | 'D';
  trajectory: TrajectoryPoint[];
  scoreBreakdown: ScoreBreakdown;
  hitRate: HitRateStats;
  anomalies: AnomalyEvent[];
  difficultySnapshot?: {
    mapWidth: number;
    mapHeight: number;
    targetDensity: { creature: number; wreck: number; danger: number };
    initialLives: number;
    sonarMaxCharges: number;
    sonarRechargeTime: number;
    targetsPerLevel: number;
  };
  rescueDetails?: {
    capsulesFound: number;
    capsulesRescued: number;
    totalRealCapsules: number;
    falseReports: number;
    sonarUsed: number;
    accuracy: number;
    pathCompletionRate: number;
    offtrackCount: number;
    highRiskIncursions: number;
    blockerCollisions: number;
    safeTravelDistance: number;
    totalPathLength: number;
    perfectPathBonus: boolean;
  };
}

export interface VoyageFilters {
  modes: VoyageMode[];
  dateRange: { start: number | null; end: number | null };
  scoreRange: { min: number | null; max: number | null };
  levelRange: { min: number | null; max: number | null };
  anomalyTypes: AnomalyEventType[];
  hasAnomaliesOnly: boolean;
  searchText: string;
}

export interface VoyageArchiveStats {
  totalVoyages: number;
  totalPlayTime: number;
  avgScore: number;
  avgDuration: number;
  avgLevel: number;
  highScore: number;
  highestLevel: number;
  totalAnomalies: number;
  avgDiscoveryRate: number;
  avgTapAccuracy: number;
  winRate: number;
  modeBreakdown: Record<VoyageMode, { count: number; avgScore: number; highScore: number }>;
  topAnomalies: { type: AnomalyEventType; count: number; description: string }[];
}

