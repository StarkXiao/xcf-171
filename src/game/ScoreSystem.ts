import type { GameState, Target } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

export interface ScoreEvent {
  points: number;
  targetName: string;
  type: 'collect' | 'damage' | 'levelUp' | 'bonus';
  position: { x: number; y: number };
}

export interface ScoreSystemParams {
  initialLivesBonus?: number;
  initialLivesOverride?: number | null;
  maxSonarCharges?: number;
  initialSonarBonus?: number;
  scoreMul?: number;
}

export class ScoreSystem {
  private state: GameState;
  private scoreHistory: number[] = [];
  private onStateChange?: (state: GameState) => void;
  private onScoreEvent?: (event: ScoreEvent) => void;
  private params: {
    initialLivesBonus: number;
    initialLivesOverride: number | null;
    maxSonarCharges: number;
    initialSonarBonus: number;
    scoreMul: number;
  };

  constructor(params: ScoreSystemParams = {}) {
    this.params = {
      initialLivesBonus: params.initialLivesBonus ?? 0,
      initialLivesOverride: params.initialLivesOverride !== undefined ? params.initialLivesOverride : null,
      maxSonarCharges: params.maxSonarCharges ?? GAME_CONFIG.SONAR.MAX_CHARGES,
      initialSonarBonus: params.initialSonarBonus ?? 0,
      scoreMul: params.scoreMul ?? 1,
    };
    this.state = this.createInitialState();
  }

  setParams(params: ScoreSystemParams) {
    this.params = {
      initialLivesBonus: params.initialLivesBonus ?? this.params.initialLivesBonus,
      initialLivesOverride: params.initialLivesOverride !== undefined ? params.initialLivesOverride : this.params.initialLivesOverride,
      maxSonarCharges: params.maxSonarCharges ?? this.params.maxSonarCharges,
      initialSonarBonus: params.initialSonarBonus ?? this.params.initialSonarBonus,
      scoreMul: params.scoreMul ?? this.params.scoreMul,
    };
  }

  private createInitialState(): GameState {
    const effectiveMaxCharges = Math.max(1, this.params.maxSonarCharges);
    const lives = this.params.initialLivesOverride !== null
      ? this.params.initialLivesOverride
      : GAME_CONFIG.GAME.INITIAL_LIVES + this.params.initialLivesBonus;
    const effectiveLives = Math.max(1, lives);
    const rawInitialCharges = effectiveMaxCharges + this.params.initialSonarBonus;
    const effectiveInitialCharges = Math.max(1, rawInitialCharges);
    return {
      score: 0,
      lives: effectiveLives,
      level: 1,
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      sonarCharges: effectiveInitialCharges,
      maxSonarCharges: effectiveMaxCharges,
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

    let points = target.points;
    if (target.type !== 'danger') {
      points = Math.round(target.points);
    }
    this.state.score += points;
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

  addSonarCharges(amount: number) {
    if (amount <= 0) return;
    this.state.sonarCharges = Math.min(
      this.state.sonarCharges + amount,
      this.state.maxSonarCharges + amount
    );
    this.notifyStateChange();
  }

  addBonus(points: number, name: string = '奖励') {
    const effectivePoints = Math.round(points * this.params.scoreMul);
    this.state.score += effectivePoints;
    this.onScoreEvent?.({
      points: effectivePoints,
      targetName: name,
      type: 'bonus',
      position: { x: 0, y: 0 },
    });
    this.notifyStateChange();
  }

  addLife(amount: number) {
    if (amount <= 0) return;
    this.state.lives += amount;
    this.onScoreEvent?.({
      points: 0,
      targetName: `生命 +${amount}`,
      type: 'bonus',
      position: { x: 0, y: 0 },
    });
    this.notifyStateChange();
  }

  takeDamage(lives: number, reason: string = '危险'): boolean {
    this.state.lives -= lives;
    this.onScoreEvent?.({
      points: 0,
      targetName: reason,
      type: 'damage',
      position: { x: this.state.score, y: 0 },
    });
    if (this.state.lives <= 0) {
      this.state.isGameOver = true;
      this.state.isPlaying = false;
    }
    this.notifyStateChange();
    return this.state.lives > 0;
  }

  checkLevelUp(collectedCount: number): boolean {
    const needed = GAME_CONFIG.GAME.TARGETS_PER_LEVEL + this.state.level * 2;
    if (collectedCount >= needed) {
      this.state.level++;
      this.state.sonarCharges = Math.min(
        this.state.sonarCharges + 2,
        this.state.maxSonarCharges
      );
      const bonus = Math.round(this.state.level * GAME_CONFIG.SCORE.BONUS_PER_LEVEL * this.params.scoreMul);
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
