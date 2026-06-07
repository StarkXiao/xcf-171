import type { GameState, Target } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

export interface ScoreEvent {
  points: number;
  targetName: string;
  type: 'collect' | 'damage' | 'levelUp' | 'bonus';
  position: { x: number; y: number };
}

export class ScoreSystem {
  private state: GameState;
  private scoreHistory: number[] = [];
  private onStateChange?: (state: GameState) => void;
  private onScoreEvent?: (event: ScoreEvent) => void;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      score: 0,
      lives: GAME_CONFIG.GAME.INITIAL_LIVES,
      level: 1,
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      sonarCharges: GAME_CONFIG.SONAR.MAX_CHARGES,
      maxSonarCharges: GAME_CONFIG.SONAR.MAX_CHARGES,
      discoveredTargets: 0,
      totalTargets: 0,
    };
  }

  setStateCallbacks(
    onStateChange: (state: GameState) => void,
    onScoreEvent: (event: ScoreEvent) => void
  ) {
    this.onStateChange = onStateChange;
    this.onScoreEvent = onScoreEvent;
  }

  startGame(totalTargets: number) {
    this.state = this.createInitialState();
    this.state.isPlaying = true;
    this.state.totalTargets = totalTargets;
    this.scoreHistory = [];
    this.notifyStateChange();
  }

  getState(): GameState {
    return { ...this.state };
  }

  collectTarget(target: Target): boolean {
    if (!this.state.isPlaying || this.state.isGameOver) return false;

    this.state.score += target.points;
    if (this.state.score < 0) this.state.score = 0;

    if (target.type === 'danger') {
      this.state.lives -= GAME_CONFIG.SCORE.LIFE_LOST;
      this.onScoreEvent?.({
        points: target.points,
        targetName: target.name,
        type: 'damage',
        position: target.position,
      });
      if (this.state.lives <= 0) {
        this.state.isGameOver = true;
        this.state.isPlaying = false;
      }
    } else {
      this.onScoreEvent?.({
        points: target.points,
        targetName: target.name,
        type: 'collect',
        position: target.position,
      });
    }

    this.notifyStateChange();
    return this.state.lives > 0;
  }

  discoverTarget() {
    this.state.discoveredTargets++;
    this.notifyStateChange();
  }

  useSonar(): boolean {
    if (this.state.sonarCharges <= 0) return false;
    this.state.sonarCharges--;
    this.notifyStateChange();
    return true;
  }

  rechargeSonar() {
    if (this.state.sonarCharges < this.state.maxSonarCharges) {
      this.state.sonarCharges++;
      this.notifyStateChange();
    }
  }

  checkLevelUp(collectedCount: number): boolean {
    const needed = GAME_CONFIG.GAME.TARGETS_PER_LEVEL + this.state.level * 2;
    if (collectedCount >= needed) {
      this.state.level++;
      this.state.sonarCharges = Math.min(
        this.state.sonarCharges + 2,
        this.state.maxSonarCharges
      );
      const bonus = this.state.level * GAME_CONFIG.SCORE.BONUS_PER_LEVEL;
      this.state.score += bonus;
      this.onScoreEvent?.({
        points: bonus,
        targetName: `关卡 ${this.state.level} 奖励`,
        type: 'levelUp',
        position: { x: 0, y: 0 },
      });
      this.notifyStateChange();
      return true;
    }
    return false;
  }

  getFinalScore(): number {
    return this.state.score;
  }

  getHighScore(): number {
    if (this.scoreHistory.length === 0) return 0;
    return Math.max(...this.scoreHistory);
  }

  endGame() {
    this.state.isPlaying = false;
    this.scoreHistory.push(this.state.score);
    this.notifyStateChange();
  }

  togglePause() {
    if (!this.state.isPlaying || this.state.isGameOver) return;
    this.state.isPaused = !this.state.isPaused;
    this.notifyStateChange();
  }

  private notifyStateChange() {
    this.onStateChange?.({ ...this.state });
  }
}
