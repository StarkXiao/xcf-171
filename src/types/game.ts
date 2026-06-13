export interface Position {
  x: number;
  y: number;
}

export type TargetType = 'creature' | 'wreck' | 'danger';

export type DangerIdentificationPhase = 'undetected' | 'suspected' | 'confirmed';

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
  enhancedByEvent?: OceanEventType;
  dangerPhase?: DangerIdentificationPhase;
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
  isSuspected?: boolean;
}

export type DepthZoneId = 'shallow' | 'mid' | 'deep' | 'abyss';

export interface DepthZoneInfo {
  id: DepthZoneId;
  name: string;
  maxDepth: number;
  pressureDrain: number;
  wreckValueBonus: number;
  highValueWreckChance: number;
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
  combo: number;
  maxCombo: number;
  comboMultiplier: number;
  sonarCombo: number;
  maxSonarCombo: number;
  depth: number;
  pressureIntegrity: number;
  maxPressureIntegrity: number;
  depthZone: DepthZoneId;
  maxDepthReached: number;
  pressureWarning: boolean;
}

export type ComboEventType =
  | 'combo_increase'
  | 'combo_break'
  | 'sonar_combo_increase'
  | 'sonar_combo_break'
  | 'combo_milestone'
  | 'sonar_reward';

export interface ComboEvent {
  type: ComboEventType;
  combo: number;
  maxCombo: number;
  multiplier: number;
  bonusPoints?: number;
  bonusCharges?: number;
  position?: Position;
}

export interface ComboStats {
  maxCombo: number;
  maxSonarCombo: number;
  comboBonusPoints: number;
  comboSonarCharges: number;
}

export type SubmarineTier = 'scout' | 'standard' | 'heavy';
export type SonarChipTier = 'basic' | 'precision' | 'wide';
export type SupplyPackTier = 'light' | 'standard' | 'premium';
export type DetectorTier = 'basic' | 'amplified' | 'deepscan' | 'shielded';

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

export interface Detector {
  id: DetectorTier;
  name: string;
  description: string;
  icon: string;
  stats: {
    echoRangeMul: number;
    echoCountMul: number;
    echoLifeMul: number;
    echoSizeMul: number;
    discoveryEfficiencyMul: number;
    dangerLifePenaltyMul: number;
    dangerScorePenaltyMul: number;
  };
}

export interface ExpeditionLoadout {
  submarine: SubmarineTier;
  sonarChip: SonarChipTier;
  supplyPack: SupplyPackTier;
  detector: DetectorTier;
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
  echoRangeMul: number;
  echoCountMul: number;
  echoLifeMul: number;
  echoSizeMul: number;
  discoveryEfficiencyMul: number;
  dangerLifePenaltyMul: number;
  dangerScorePenaltyMul: number;
  moveSpeedMul: number;
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
  | 'wreckPointsBonus'
  | 'unlockDetectorAmplified'
  | 'unlockDetectorDeepscan'
  | 'unlockDetectorShielded'
  | 'echoRangeBonus'
  | 'discoveryEfficiencyBonus'
  | 'dangerPenaltyReduction';

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
  event?: 'sonar' | 'collect' | 'damage' | 'level_up' | 'pause' | 'rescue' | 'false_report' | 'path_offtrack' | 'pressure_warning';
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
  maxCombo: number;
  maxSonarCombo: number;
  comboBonusPoints: number;
  comboSonarCharges: number;
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
  maxCombo: number;
  maxSonarCombo: number;
  comboBonusPoints: number;
  comboSonarChargesGained: number;
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

export type RelayRoleType = 'sonar_operator' | 'navigator' | 'collector';

export interface RelayRole {
  id: RelayRoleType;
  name: string;
  icon: string;
  description: string;
  ability: string;
  color: string;
  stats: {
    sonarRadiusMul?: number;
    sonarSpeedMul?: number;
    scoreMul?: number;
    moveSpeedMul?: number;
    livesBonus?: number;
    sonarChargesBonus?: number;
  };
}

export type RelayPhaseType = 'detection' | 'navigation' | 'collection';

export interface RelayPhase {
  id: RelayPhaseType;
  name: string;
  icon: string;
  description: string;
  role: RelayRoleType;
  duration?: number;
  targetGoal: string;
}

export interface RelayPlayer {
  id: number;
  name: string;
  role: RelayRoleType;
  avatar: string;
  stats: {
    score: number;
    discoveries: number;
    sonarUsed: number;
    damageTaken: number;
    timePlayed: number;
  };
}

export interface RelaySharedState {
  score: number;
  lives: number;
  maxLives: number;
  sonarCharges: number;
  maxSonarCharges: number;
  level: number;
  discoveredTargets: number;
  totalTargets: number;
  combo: number;
  maxCombo: number;
}

export interface RelayGameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  currentPhaseIndex: number;
  phases: RelayPhaseType[];
  currentPlayerIndex: number;
  players: RelayPlayer[];
  shared: RelaySharedState;
  phaseStartTime: number;
  totalPlayTime: number;
  currentPhaseTimeRemaining: number;
}

export interface RelayPhaseResult {
  phase: RelayPhaseType;
  playerId: number;
  scoreGained: number;
  discoveries: number;
  sonarUsed: number;
  damageTaken: number;
  duration: number;
  completed: boolean;
  events: string[];
}

export interface RelayResult {
  victory: boolean;
  finalScore: number;
  totalDiscoveries: number;
  totalLevels: number;
  livesRemaining: number;
  totalPlayTime: number;
  maxCombo: number;
  playerResults: {
    playerId: number;
    role: RelayRoleType;
    totalScore: number;
    discoveries: number;
    sonarUsed: number;
    damageTaken: number;
    timePlayed: number;
    contribution: number;
  }[];
  phaseResults: RelayPhaseResult[];
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  isNewRecord: boolean;
}

export type RelayEvent =
  | { type: 'phase_start'; phase: RelayPhaseType; playerId: number }
  | { type: 'phase_end'; result: RelayPhaseResult }
  | { type: 'player_switch'; fromPlayerId: number; toPlayerId: number }
  | { type: 'shared_lost'; penalty: number }
  | { type: 'shared_gained'; bonus: number; resourceType: 'life' | 'sonar' | 'score' }
  | { type: 'game_over'; result: RelayResult }
  | { type: 'combo_break' }
  | { type: 'combo_increase'; combo: number }
  | { type: 'target_discovered'; targetType: string }
  | { type: 'danger_hit'; targetType: string };

export type SalvageRewardType = 'sonar_charges' | 'extra_life' | 'bonus_points' | 'wreck_multiplier' | 'special_item';

export interface SalvageEventWreck {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  basePoints: number;
  eventBonus: number;
  minRadius: number;
  maxRadius: number;
  shape: 'circle' | 'triangle' | 'square' | 'irregular';
}

export interface SalvagePhaseGoal {
  id: string;
  phase: number;
  title: string;
  description: string;
  targetType: 'total_wrecks' | 'rare_wrecks' | 'score' | 'expeditions';
  targetValue: number;
  rewardType: SalvageRewardType;
  rewardValue: number;
  rewardName: string;
}

export interface SalvageExchangeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  rewardType: SalvageRewardType;
  rewardValue: number;
  stock: number;
  maxStock: number;
  sortOrder: number;
}

export interface SalvageEventConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  startTime: number;
  endTime: number;
  eventWrecks: SalvageEventWreck[];
  phaseGoals: SalvagePhaseGoal[];
  exchangeItems: SalvageExchangeItem[];
  wreckWeightBonus: number;
  wreckCountMultiplier: number;
}

export interface SalvageEventProgress {
  eventId: string;
  startedAt: number;
  totalWrecksCollected: number;
  rareWrecksCollected: number;
  totalScoreEarned: number;
  expeditionsCompleted: number;
  eventCurrency: number;
  totalEventCurrency: number;
  completedPhases: string[];
  claimedPhases: string[];
  exchangePurchaseHistory: Record<string, number>;
  lastActivityAt: number;
}

export interface SalvageEventState {
  isActive: boolean;
  isComingSoon: boolean;
  isEnded: boolean;
  timeRemaining: number;
  timeUntilStart: number;
  config: SalvageEventConfig | null;
  progress: SalvageEventProgress | null;
}

export type SalvageEventType =
  | { type: 'phase_completed'; phase: SalvagePhaseGoal }
  | { type: 'wreck_collected'; wreck: SalvageEventWreck; currency: number }
  | { type: 'reward_claimed'; phase: SalvagePhaseGoal }
  | { type: 'exchange_purchased'; item: SalvageExchangeItem }
  | { type: 'event_started' }
  | { type: 'event_ended' };

export type VoiceprintSampleQuality = 'poor' | 'fair' | 'good' | 'excellent';

export type VoiceprintTargetCategory = 'creature' | 'wreck' | 'anomaly';

export interface VoiceprintEchoFeature {
  id: number;
  frequency: number;
  amplitude: number;
  duration: number;
  pattern: 'regular' | 'irregular' | 'chaotic' | 'pulsing';
  isGenuine: boolean;
  quality: VoiceprintSampleQuality;
  noiseLevel: number;
}

export interface VoiceprintTarget {
  id: number;
  name: string;
  category: VoiceprintTargetCategory;
  isGenuine: boolean;
  genuineFeatures: VoiceprintEchoFeature[];
  decoyFeatures: VoiceprintEchoFeature[];
  position: Position;
  radius: number;
  basePoints: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  description: string;
  icon: string;
  revealed: boolean;
  analyzed: boolean;
  verdictCorrect?: boolean;
}

export interface VoiceprintSample {
  id: number;
  targetId: number;
  targetName: string;
  features: VoiceprintEchoFeature[];
  collectedAt: number;
  sonarCost: number;
}

export interface VoiceprintRiskProfile {
  sampleCount: number;
  successRate: number;
  rewardMultiplier: number;
  penaltyMultiplier: number;
  label: string;
}

export interface VoiceprintVerdict {
  targetId: number;
  targetName: string;
  samplesUsed: number;
  userVerdict: 'genuine' | 'fake';
  actualIsGenuine: boolean;
  isCorrect: boolean;
  pointsGained: number;
  pointsLost: number;
  timestamp: number;
  totalScore: number;
  isNewHighScore: boolean;
}

export interface VoiceprintLabState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  lives: number;
  maxLives: number;
  sonarCharges: number;
  maxSonarCharges: number;
  level: number;
  currentTargetId: number | null;
  targets: VoiceprintTarget[];
  collectedSamples: VoiceprintSample[];
  verdictHistory: VoiceprintVerdict[];
  correctVerdicts: number;
  wrongVerdicts: number;
  consecutiveCorrect: number;
  maxConsecutiveCorrect: number;
  highRiskBonus: number;
  totalSonarUsed: number;
  targetsAnalyzed: number;
  targetsRemaining: number;
}

export interface VoiceprintResult {
  finalScore: number;
  level: number;
  correctVerdicts: number;
  wrongVerdicts: number;
  accuracy: number;
  totalSonarUsed: number;
  highRiskBonus: number;
  maxConsecutiveCorrect: number;
  isNewRecord: boolean;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  sessionUnlocks: UnlockEvent[];
  verdictHistory: VoiceprintVerdict[];
}

export type OceanEventType = 'current' | 'interference' | 'treasure';

export interface OceanEvent {
  id: number;
  type: OceanEventType;
  name: string;
  description: string;
  position: Position;
  radius: number;
  intensity: number;
  duration: number;
  remainingTime: number;
  active: boolean;
  icon: string;
  color: number;
  effectValue: number;
}

export interface OceanEventConfig {
  type: OceanEventType;
  name: string;
  description: string;
  icon: string;
  color: number;
  baseRadius: number;
  baseIntensity: number;
  baseDuration: number;
  spawnChance: number;
  maxCount: number;
  effectValue: number;
}

export interface OceanEventState {
  activeEvents: OceanEvent[];
  currentLevel: number;
  eventCooldowns: Record<OceanEventType, number>;
}

export type OceanEventEffectType =
  | 'player_speed'
  | 'sonar_radius'
  | 'sonar_recharge'
  | 'score_multiplier'
  | 'target_points'
  | 'extra_life';

export interface OceanEventEffect {
  type: OceanEventEffectType;
  value: number;
  sourceEventId: number;
  duration: number;
}

export type MissionCategory = 'main' | 'side';

export type MissionObjectiveType =
  | 'collect_creatures'
  | 'collect_wrecks'
  | 'reach_level'
  | 'no_damage_levels'
  | 'discover_targets'
  | 'sonar_efficiency'
  | 'avoid_all_dangers'
  | 'collect_all_in_level'
  | 'use_sonar_under';

export interface MissionObjective {
  type: MissionObjectiveType;
  targetValue: number;
  currentValue: number;
  limitValue?: number;
}

export type MissionEffectType =
  | 'sonar_charge_bonus'
  | 'sonar_recharge_speed'
  | 'danger_count_modifier'
  | 'score_bonus'
  | 'extra_life';

export interface MissionEffect {
  type: MissionEffectType;
  value: number;
}

export interface Mission {
  id: string;
  category: MissionCategory;
  title: string;
  description: string;
  icon: string;
  objective: MissionObjective;
  rewardEffects: MissionEffect[];
  completionBonus: number;
  completed: boolean;
  failed: boolean;
}

export interface MissionState {
  missions: Mission[];
  mainCompletedCount: number;
  sideCompletedCount: number;
  totalMainMissions: number;
  totalSideMissions: number;
  completionRatio: number;
  ratingBonus: number;
}

export interface MissionResult {
  missions: Mission[];
  mainCompletedCount: number;
  sideCompletedCount: number;
  totalMainMissions: number;
  totalSideMissions: number;
  completionRatio: number;
  ratingBonus: number;
  ratingAdjustment: number;
  effectSummary: string[];
}

export type VoiceprintLabEvent =
  | { type: 'sample_collected'; sample: VoiceprintSample }
  | { type: 'verdict_made'; verdict: VoiceprintVerdict }
  | { type: 'target_revealed'; target: VoiceprintTarget }
  | { type: 'level_up'; newLevel: number; bonus: number }
  | { type: 'game_over'; result: VoiceprintResult }
  | { type: 'sonar_fired'; position: Position; cost: number }
  | { type: 'combo_increase'; combo: number }
  | { type: 'combo_break' }
  | { type: 'life_lost'; reason: string }
  | { type: 'bonus_gained'; points: number; reason: string };

export type OceanThemeId = 'shallow' | 'abyss' | 'polar' | 'volcanic' | 'coral';

export interface OceanThemeColors {
  background: number;
  grid: number;
  sonar: number;
  creature: number;
  wreck: number;
  danger: number;
  player: number;
  combo: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    EXTREME: number;
    LEGENDARY: number;
  };
}

export interface OceanThemeTargetPool {
  creatureNames: string[];
  wreckNames: string[];
  dangerNames: string[];
}

export interface OceanThemeScoreCoefficients {
  creature: number;
  wreck: number;
  danger: number;
  global: number;
}

export interface OceanThemeRiskRule {
  type: 'danger_count' | 'danger_damage' | 'lives_initial' | 'sonar_recharge' | 'target_density' | 'pressure_drain';
  value: number;
  description: string;
}

export interface OceanTheme {
  id: OceanThemeId;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  colors: OceanThemeColors;
  targetPool: OceanThemeTargetPool;
  scoreCoefficients: OceanThemeScoreCoefficients;
  riskRules: OceanThemeRiskRule[];
  instructions: string[];
  rankThresholds: {
    S: number;
    A: number;
    B: number;
    C: number;
  };
  settlementComments: {
    S: string[];
    A: string[];
    B: string[];
    C: string[];
    D: string[];
  };
}

export interface OceanThemeState {
  currentThemeId: OceanThemeId;
  availableThemes: OceanThemeId[];
}


