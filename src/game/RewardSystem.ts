import type { RewardRule } from '../types/game';
import type { ScoreEvent } from './ScoreSystem';

export interface RewardTriggeredEvent {
  rule: RewardRule;
  message: string;
  points: number;
  bonusType: 'score' | 'life' | 'sonar' | 'combo';
}

export interface RewardSystemCallbacks {
  onRewardTriggered?: (event: RewardTriggeredEvent) => void;
  onScoreEvent?: (event: ScoreEvent) => void;
  addPoints?: (points: number, reason: string) => void;
  addLife?: (amount: number) => void;
  addSonarCharge?: (amount: number) => void;
  getScoreMul?: () => number;
}

export interface RewardSystemStats {
  creaturesCollected: number;
  wrecksCollected: number;
  totalDiscovered: number;
  totalTargets: number;
  tookDamage: boolean;
  playTime: number;
  timeLimit: number;
  comboMultiplier: number;
}

export class RewardSystem {
  private rules: RewardRule[] = [];
  private triggeredRuleIndices: Set<number> = new Set();
  private stats: RewardSystemStats = this.createDefaultStats();
  private startTime: number = 0;
  private callbacks: RewardSystemCallbacks = {};

  setCallbacks(callbacks: RewardSystemCallbacks) {
    this.callbacks = callbacks;
  }

  setRules(rules: RewardRule[]) {
    this.rules = rules ? [...rules] : [];
    this.triggeredRuleIndices.clear();
  }

  getRules(): RewardRule[] {
    return [...this.rules];
  }

  getTriggeredRules(): RewardRule[] {
    return this.rules.filter((_, i) => this.triggeredRuleIndices.has(i));
  }

  private createDefaultStats(): RewardSystemStats {
    return {
      creaturesCollected: 0,
      wrecksCollected: 0,
      totalDiscovered: 0,
      totalTargets: 0,
      tookDamage: false,
      playTime: 0,
      timeLimit: 0,
      comboMultiplier: 1,
    };
  }

  startGame(totalTargets: number, timeLimit: number = 0) {
    this.triggeredRuleIndices.clear();
    this.stats = this.createDefaultStats();
    this.stats.totalTargets = totalTargets;
    this.stats.timeLimit = timeLimit;
    this.startTime = Date.now();
  }

  recordCollect(targetType: 'creature' | 'wreck' | 'danger') {
    if (targetType === 'creature') {
      this.stats.creaturesCollected++;
    } else if (targetType === 'wreck') {
      this.stats.wrecksCollected++;
    } else if (targetType === 'danger') {
      this.stats.tookDamage = true;
    }
    this.checkImmediateTriggers();
  }

  recordDiscover() {
    this.stats.totalDiscovered++;
    this.checkImmediateTriggers();
  }

  recordDamage() {
    this.stats.tookDamage = true;
  }

  checkImmediateTriggers() {
    this.stats.playTime = (Date.now() - this.startTime) / 1000;

    for (let i = 0; i < this.rules.length; i++) {
      if (this.triggeredRuleIndices.has(i)) continue;
      const rule = this.rules[i];
      if (this.conditionMet(rule, false)) {
        this.triggerRule(rule, i);
      }
    }
  }

  checkEndGameTriggers(): RewardTriggeredEvent[] {
    this.stats.playTime = (Date.now() - this.startTime) / 1000;
    const events: RewardTriggeredEvent[] = [];

    for (let i = 0; i < this.rules.length; i++) {
      if (this.triggeredRuleIndices.has(i)) continue;
      const rule = this.rules[i];
      if (this.conditionMet(rule, true)) {
        const event = this.buildTriggeredEvent(rule);
        events.push(event);
        this.triggerRule(rule, i);
      }
    }

    return events;
  }

  private conditionMet(rule: RewardRule, isEndGame: boolean): boolean {
    const { type, value } = rule.condition;
    const s = this.stats;

    switch (type) {
      case 'collect_n_creatures':
        return s.creaturesCollected >= value;
      case 'collect_n_wrecks':
        return s.wrecksCollected >= value;
      case 'no_damage':
        if (!isEndGame) return false;
        return !s.tookDamage;
      case 'discover_all':
        if (!isEndGame) return false;
        return s.totalTargets > 0 && s.totalDiscovered >= s.totalTargets;
      case 'time_bonus':
        if (!isEndGame) return false;
        return s.timeLimit > 0 && s.playTime <= value;
      default:
        return false;
    }
  }

  private triggerRule(rule: RewardRule, index: number) {
    if (this.triggeredRuleIndices.has(index)) return;
    this.triggeredRuleIndices.add(index);

    const event = this.buildTriggeredEvent(rule);
    this.applyReward(rule);
    this.callbacks.onRewardTriggered?.(event);
  }

  private buildTriggeredEvent(rule: RewardRule): RewardTriggeredEvent {
    let bonusType: RewardTriggeredEvent['bonusType'] = 'score';
    let points = 0;

    switch (rule.type) {
      case 'score_multiplier':
        bonusType = 'combo';
        points = 0;
        break;
      case 'bonus_points':
        bonusType = 'score';
        const mul = this.callbacks.getScoreMul?.() ?? 1;
        points = Math.round(rule.value * mul);
        break;
      case 'extra_life':
        bonusType = 'life';
        points = 0;
        break;
      case 'sonar_bonus':
        bonusType = 'sonar';
        points = 0;
        break;
      case 'combo_bonus':
        bonusType = 'combo';
        points = 0;
        break;
    }

    return {
      rule,
      message: `${rule.name}达成！`,
      points,
      bonusType,
    };
  }

  private applyReward(rule: RewardRule) {
    switch (rule.type) {
      case 'score_multiplier':
      case 'combo_bonus':
        this.stats.comboMultiplier *= rule.value;
        break;
      case 'bonus_points':
        const mul = this.callbacks.getScoreMul?.() ?? 1;
        const pts = Math.round(rule.value * mul);
        if (pts > 0) {
          this.callbacks.addPoints?.(pts, rule.name);
        }
        break;
      case 'extra_life':
        this.callbacks.addLife?.(rule.value);
        break;
      case 'sonar_bonus':
        this.callbacks.addSonarCharge?.(rule.value);
        break;
    }
  }

  getComboMultiplier(): number {
    return this.stats.comboMultiplier;
  }

  applyComboToScore(baseScore: number): number {
    return Math.round(baseScore * this.stats.comboMultiplier);
  }

  getStats(): RewardSystemStats {
    return { ...this.stats, playTime: (Date.now() - this.startTime) / 1000 };
  }

  reset() {
    this.rules = [];
    this.triggeredRuleIndices.clear();
    this.stats = this.createDefaultStats();
  }
}
