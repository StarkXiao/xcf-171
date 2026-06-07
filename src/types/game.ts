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
