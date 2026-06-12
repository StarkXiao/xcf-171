import type { GameState, Target, ComboEvent, ComboStats, OceanThemeId } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { getOceanTheme, DEFAULT_OCEAN_THEME_ID } from '../config/oceanThemes';

export interface ScoreEvent {
  points: number;
  targetName: string;
  type: 'collect' | 'damage' | 'levelUp' | 'bonus' | 'combo';
  position: { x: number; y: number };
}

export interface ScoreSystemParams {
  initialLivesBonus?: number;
  initialLivesOverride?: number | null;
  maxSonarCharges?: number;
  initialSonarBonus?: number;
  scoreMul?: number;
  dangerLifePenaltyMul?: number;
  dangerScorePenaltyMul?: number;
}

export class ScoreSystem {
  private state: GameState;
  private scoreHistory: number[] = [];
  private onStateChange?: (state: GameState) => void;
  private onScoreEvent?: (event: ScoreEvent) => void;
  private onComboEvent?: (event: ComboEvent) => void;
  private params: {
    initialLivesBonus: number;
    initialLivesOverride: number | null;
    maxSonarCharges: number;
    initialSonarBonus: number;
    scoreMul: number;
    dangerLifePenaltyMul: number;
    dangerScorePenaltyMul: number;
  };
  private oceanThemeId: OceanThemeId = DEFAULT_OCEAN_THEME_ID;

  private lastCollectTime: number = 0;
  private lastSonarDiscoveryTime: number = 0;
  private comboTimer: ReturnType<typeof setTimeout> | null = null;
  private sonarComboTimer: ReturnType<typeof setTimeout> | null = null;
  private awardedMilestones: Set<number> = new Set();
  private awardedSonarMilestones: Set<number> = new Set();
  private comboStats: ComboStats = {
    maxCombo: 0,
    maxSonarCombo: 0,
    comboBonusPoints: 0,
    comboSonarCharges: 0,
  };

  constructor(params: ScoreSystemParams = {}) {
    this.params = {
      initialLivesBonus: params.initialLivesBonus ?? 0,
      initialLivesOverride: params.initialLivesOverride !== undefined ? params.initialLivesOverride : null,
      maxSonarCharges: params.maxSonarCharges ?? GAME_CONFIG.SONAR.MAX_CHARGES,
      initialSonarBonus: params.initialSonarBonus ?? 0,
      scoreMul: params.scoreMul ?? 1,
      dangerLifePenaltyMul: params.dangerLifePenaltyMul ?? 1,
      dangerScorePenaltyMul: params.dangerScorePenaltyMul ?? 1,
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
      dangerLifePenaltyMul: params.dangerLifePenaltyMul ?? this.params.dangerLifePenaltyMul,
      dangerScorePenaltyMul: params.dangerScorePenaltyMul ?? this.params.dangerScorePenaltyMul,
    };
  }

  setOceanTheme(themeId: OceanThemeId) {
    this.oceanThemeId = themeId;
    const theme = getOceanTheme(themeId);
    
    const dangerDamageRule = theme.riskRules.find(r => r.type === 'danger_damage');
    const livesRule = theme.riskRules.find(r => r.type === 'lives_initial');
    const sonarRechargeRule = theme.riskRules.find(r => r.type === 'sonar_recharge');
    
    if (dangerDamageRule) {
      this.params.dangerLifePenaltyMul *= dangerDamageRule.value;
      this.params.dangerScorePenaltyMul *= dangerDamageRule.value;
    }
    if (livesRule) {
      this.params.initialLivesBonus += livesRule.value;
    }
  }

  getOceanThemeId(): OceanThemeId {
    return this.oceanThemeId;
  }

  getRank(score: number, comboBonus: number = 0): 'S' | 'A' | 'B' | 'C' | 'D' {
    const theme = getOceanTheme(this.oceanThemeId);
    const totalScore = score + comboBonus;
    if (totalScore >= theme.rankThresholds.S) return 'S';
    if (totalScore >= theme.rankThresholds.A) return 'A';
    if (totalScore >= theme.rankThresholds.B) return 'B';
    if (totalScore >= theme.rankThresholds.C) return 'C';
    return 'D';
  }

  getSettlementComment(rank: string): string {
    const theme = getOceanTheme(this.oceanThemeId);
    const comments = theme.settlementComments[rank as keyof typeof theme.settlementComments] || theme.settlementComments.D;
    return comments[Math.floor(Math.random() * comments.length)];
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
      combo: 0,
      maxCombo: 0,
      comboMultiplier: 1.0,
      sonarCombo: 0,
      maxSonarCombo: 0,
    };
  }

  setStateCallbacks(
    onStateChange: (state: GameState) => void,
    onScoreEvent: (event: ScoreEvent) => void,
    onComboEvent?: (event: ComboEvent) => void
  ) {
    this.onStateChange = onStateChange;
    this.onScoreEvent = onScoreEvent;
    this.onComboEvent = onComboEvent;
  }

  startGame(totalTargets: number) {
    this.state = this.createInitialState();
    this.state.isPlaying = true;
    this.state.totalTargets = totalTargets;
    this.scoreHistory = [];
    this.resetCombo();
    this.resetSonarCombo();
    this.awardedMilestones.clear();
    this.awardedSonarMilestones.clear();
    this.comboStats = {
      maxCombo: 0,
      maxSonarCombo: 0,
      comboBonusPoints: 0,
      comboSonarCharges: 0,
    };
    this.clearComboTimers();
    this.notifyStateChange();
  }

  private getComboMultiplier(combo: number): number {
    const multipliers = GAME_CONFIG.COMBO.MULTIPLIERS;
    let multiplier = 1.0;
    for (const m of multipliers) {
      if (combo >= m.combo) {
        multiplier = m.multiplier;
      }
    }
    return multiplier;
  }

  private getSonarComboMultiplier(combo: number): number {
    const multipliers = GAME_CONFIG.COMBO.SONAR_MULTIPLIERS;
    let multiplier = 1.0;
    for (const m of multipliers) {
      if (combo >= m.combo) {
        multiplier = m.multiplier;
      }
    }
    return multiplier;
  }

  private clearComboTimers() {
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
      this.comboTimer = null;
    }
    if (this.sonarComboTimer) {
      clearTimeout(this.sonarComboTimer);
      this.sonarComboTimer = null;
    }
  }

  private startComboTimer() {
    if (this.comboTimer) clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => {
      this.breakCombo();
    }, GAME_CONFIG.COMBO.COMBO_TIMEOUT);
  }

  private startSonarComboTimer() {
    if (this.sonarComboTimer) clearTimeout(this.sonarComboTimer);
    this.sonarComboTimer = setTimeout(() => {
      this.breakSonarCombo();
    }, GAME_CONFIG.COMBO.SONAR_COMBO_TIMEOUT);
  }

  resetCombo() {
    this.state.combo = 0;
    this.state.comboMultiplier = 1.0;
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
      this.comboTimer = null;
    }
  }

  resetSonarCombo() {
    this.state.sonarCombo = 0;
    if (this.sonarComboTimer) {
      clearTimeout(this.sonarComboTimer);
      this.sonarComboTimer = null;
    }
  }

  breakCombo() {
    if (this.state.combo > 0) {
      this.onComboEvent?.({
        type: 'combo_break',
        combo: this.state.combo,
        maxCombo: this.state.maxCombo,
        multiplier: this.state.comboMultiplier,
      });
      this.resetCombo();
      this.notifyStateChange();
    }
  }

  breakSonarCombo() {
    if (this.state.sonarCombo > 0) {
      this.onComboEvent?.({
        type: 'sonar_combo_break',
        combo: this.state.sonarCombo,
        maxCombo: this.state.maxSonarCombo,
        multiplier: this.getSonarComboMultiplier(this.state.sonarCombo),
      });
      this.resetSonarCombo();
      this.notifyStateChange();
    }
  }

  private checkMilestone(combo: number, position?: { x: number; y: number }) {
    const milestones = GAME_CONFIG.COMBO.MILESTONE_BONUSES;
    for (const milestone of milestones) {
      if (combo === milestone.combo && !this.awardedMilestones.has(milestone.combo)) {
        this.awardedMilestones.add(milestone.combo);
        const bonusPoints = Math.round(milestone.points * this.params.scoreMul);
        this.state.score += bonusPoints;
        this.comboStats.comboBonusPoints += bonusPoints;
        if (milestone.charges > 0) {
          this.state.sonarCharges = Math.min(
            this.state.sonarCharges + milestone.charges,
            this.state.maxSonarCharges + milestone.charges
          );
          this.comboStats.comboSonarCharges += milestone.charges;
        }
        this.onScoreEvent?.({
          points: bonusPoints,
          targetName: `连击里程碑 ×${combo}`,
          type: 'combo',
          position: position || { x: 0, y: 0 },
        });
        this.onComboEvent?.({
          type: 'combo_milestone',
          combo: combo,
          maxCombo: this.state.maxCombo,
          multiplier: this.state.comboMultiplier,
          bonusPoints,
          bonusCharges: milestone.charges > 0 ? milestone.charges : undefined,
          position,
        });
      }
    }
  }

  private checkSonarMilestone(combo: number, position?: { x: number; y: number }) {
    const milestones = GAME_CONFIG.COMBO.SONAR_MILESTONE_BONUSES;
    for (const milestone of milestones) {
      if (combo === milestone.combo && !this.awardedSonarMilestones.has(milestone.combo)) {
        this.awardedSonarMilestones.add(milestone.combo);
        const bonusPoints = Math.round(milestone.points * this.params.scoreMul);
        this.state.score += bonusPoints;
        this.comboStats.comboBonusPoints += bonusPoints;
        if (milestone.charges > 0) {
          this.state.sonarCharges = Math.min(
            this.state.sonarCharges + milestone.charges,
            this.state.maxSonarCharges + milestone.charges
          );
          this.comboStats.comboSonarCharges += milestone.charges;
        }
        this.onScoreEvent?.({
          points: bonusPoints,
          targetName: `连探里程碑 ×${combo}`,
          type: 'combo',
          position: position || { x: 0, y: 0 },
        });
        this.onComboEvent?.({
          type: 'sonar_reward',
          combo: combo,
          maxCombo: this.state.maxSonarCombo,
          multiplier: this.getSonarComboMultiplier(combo),
          bonusPoints,
          bonusCharges: milestone.charges > 0 ? milestone.charges : undefined,
          position,
        });
      }
    }
  }

  increaseCombo(position?: { x: number; y: number }, targetType?: 'creature' | 'wreck' | 'danger') {
    if (!this.state.isPlaying || this.state.isGameOver) return;
    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
      this.comboStats.maxCombo = this.state.maxCombo;
    }
    this.state.comboMultiplier = this.getComboMultiplier(this.state.combo);
    this.lastCollectTime = Date.now();
    this.startComboTimer();
    if (this.state.combo > 1) {
      this.onComboEvent?.({
        type: 'combo_increase',
        combo: this.state.combo,
        maxCombo: this.state.maxCombo,
        multiplier: this.state.comboMultiplier,
        position,
      });
    }
    this.checkMilestone(this.state.combo, position);
    this.notifyStateChange();
  }

  increaseSonarCombo(position?: { x: number; y: number }) {
    if (!this.state.isPlaying || this.state.isGameOver) return;
    this.state.sonarCombo++;
    if (this.state.sonarCombo > this.state.maxSonarCombo) {
      this.state.maxSonarCombo = this.state.sonarCombo;
      this.comboStats.maxSonarCombo = this.state.maxSonarCombo;
    }
    this.lastSonarDiscoveryTime = Date.now();
    this.startSonarComboTimer();
    if (this.state.sonarCombo > 1) {
      this.onComboEvent?.({
        type: 'sonar_combo_increase',
        combo: this.state.sonarCombo,
        maxCombo: this.state.maxSonarCombo,
        multiplier: this.getSonarComboMultiplier(this.state.sonarCombo),
        position,
      });
    }
    this.checkSonarMilestone(this.state.sonarCombo, position);
    this.notifyStateChange();
  }

  getComboStats(): ComboStats {
    return { ...this.comboStats };
  }

  getState(): GameState {
    return { ...this.state };
  }

  collectTarget(target: Target): boolean {
    if (!this.state.isPlaying || this.state.isGameOver) return false;

    if (target.type === 'danger') {
      const lifeLost = Math.ceil(GAME_CONFIG.SCORE.LIFE_LOST * this.params.dangerLifePenaltyMul);
      const scorePenalty = Math.round(target.points * this.params.dangerScorePenaltyMul);
      this.state.lives -= lifeLost;
      this.state.score += scorePenalty;
      if (this.state.score < 0) this.state.score = 0;
      
      this.breakCombo();
      this.breakSonarCombo();
      
      this.onScoreEvent?.({
        points: scorePenalty,
        targetName: target.name,
        type: 'damage',
        position: target.position,
      });
      if (this.state.lives <= 0) {
        this.state.isGameOver = true;
        this.state.isPlaying = false;
        this.clearComboTimers();
      }
    } else {
      this.increaseCombo(target.position, target.type);
      
      let typeMultiplier = 1.0;
      if (target.type === 'wreck') {
        typeMultiplier = GAME_CONFIG.COMBO.WRECK_BONUS_MULTIPLIER;
      } else if (target.type === 'creature') {
        typeMultiplier = GAME_CONFIG.COMBO.CREATURE_BONUS_MULTIPLIER;
      }
      
      const basePoints = target.points;
      const comboMultiplier = this.state.comboMultiplier;
      const finalMultiplier = comboMultiplier * typeMultiplier;
      const adjustedPoints = Math.round(basePoints * finalMultiplier);
      
      this.state.score += adjustedPoints;
      if (this.state.score < 0) this.state.score = 0;
      
      this.onScoreEvent?.({
        points: adjustedPoints,
        targetName: target.name,
        type: 'collect',
        position: target.position,
      });
    }

    this.notifyStateChange();
    return this.state.lives > 0;
  }

  discoverTarget(position?: { x: number; y: number }) {
    this.state.discoveredTargets++;
    this.increaseSonarCombo(position);
    this.notifyStateChange();
  }

  updateTotalTargets(total: number) {
    this.state.totalTargets = total;
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
    this.breakCombo();
    this.breakSonarCombo();
    this.onScoreEvent?.({
      points: 0,
      targetName: reason,
      type: 'damage',
      position: { x: this.state.score, y: 0 },
    });
    if (this.state.lives <= 0) {
      this.state.isGameOver = true;
      this.state.isPlaying = false;
      this.clearComboTimers();
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
    this.clearComboTimers();
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

export type { ComboStats };
