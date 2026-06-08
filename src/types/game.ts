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
}
