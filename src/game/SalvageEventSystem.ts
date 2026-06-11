import type {
  SalvageEventConfig,
  SalvageEventProgress,
  SalvageEventState,
  SalvageEventWreck,
  SalvagePhaseGoal,
  SalvageExchangeItem,
  SalvageEventType,
} from '../types/game';
import { SALVAGE_EVENT_CONFIG, getRarityWeight } from '../config/salvageEvent';

const STORAGE_KEY = 'deepSeaSonar_salvageEvent';

export class SalvageEventSystem {
  private config: SalvageEventConfig;
  private progress: SalvageEventProgress;
  private onEvent?: (event: SalvageEventType) => void;
  private timerInterval: number | null = null;

  constructor() {
    this.config = SALVAGE_EVENT_CONFIG;
    this.progress = this.createEmptyProgress();
    this.load();
    this.startTimer();
  }

  private createEmptyProgress(): SalvageEventProgress {
    return {
      eventId: this.config.id,
      startedAt: Date.now(),
      totalWrecksCollected: 0,
      rareWrecksCollected: 0,
      totalScoreEarned: 0,
      expeditionsCompleted: 0,
      eventCurrency: 0,
      totalEventCurrency: 0,
      completedPhases: [],
      claimedPhases: [],
      exchangePurchaseHistory: {},
      lastActivityAt: Date.now(),
    };
  }

  private startTimer() {
    if (this.timerInterval !== null) return;
    this.timerInterval = window.setInterval(() => {
      this.checkPhaseCompletion();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  setEventCallback(callback: (event: SalvageEventType) => void) {
    this.onEvent = callback;
  }

  getState(): SalvageEventState {
    const now = Date.now();
    const isComingSoon = now < this.config.startTime;
    const isEnded = now >= this.config.endTime;
    const isActive = !isComingSoon && !isEnded;

    return {
      isActive,
      isComingSoon,
      isEnded,
      timeRemaining: Math.max(0, this.config.endTime - now),
      timeUntilStart: Math.max(0, this.config.startTime - now),
      config: this.config,
      progress: this.getProgress(),
    };
  }

  getProgress(): SalvageEventProgress {
    return JSON.parse(JSON.stringify(this.progress));
  }

  getConfig(): SalvageEventConfig {
    return this.config;
  }

  getPhaseProgress(phase: SalvagePhaseGoal): number {
    switch (phase.targetType) {
      case 'total_wrecks':
        return this.progress.totalWrecksCollected;
      case 'rare_wrecks':
        return this.progress.rareWrecksCollected;
      case 'score':
        return this.progress.totalScoreEarned;
      case 'expeditions':
        return this.progress.expeditionsCompleted;
      default:
        return 0;
    }
  }

  isPhaseCompleted(phase: SalvagePhaseGoal): boolean {
    if (this.progress.completedPhases.includes(phase.id)) return true;
    return this.getPhaseProgress(phase) >= phase.targetValue;
  }

  isPhaseClaimed(phase: SalvagePhaseGoal): boolean {
    return this.progress.claimedPhases.includes(phase.id);
  }

  canClaimPhase(phase: SalvagePhaseGoal): boolean {
    return this.isPhaseCompleted(phase) && !this.isPhaseClaimed(phase);
  }

  private checkPhaseCompletion() {
    for (const phase of this.config.phaseGoals) {
      if (!this.progress.completedPhases.includes(phase.id)) {
        if (this.getPhaseProgress(phase) >= phase.targetValue) {
          this.progress.completedPhases.push(phase.id);
          this.save();
          this.onEvent?.({ type: 'phase_completed', phase });
        }
      }
    }
  }

  claimPhaseReward(phaseId: string): boolean {
    const phase = this.config.phaseGoals.find(p => p.id === phaseId);
    if (!phase) return false;
    if (!this.canClaimPhase(phase)) return false;

    this.progress.claimedPhases.push(phase.id);

    if (phase.rewardType === 'bonus_points') {
      this.progress.eventCurrency += phase.rewardValue;
      this.progress.totalEventCurrency += phase.rewardValue;
    }

    this.save();
    this.onEvent?.({ type: 'reward_claimed', phase });
    return true;
  }

  recordWreckCollected(wreck: SalvageEventWreck, scoreGained: number): number {
    if (!this.getState().isActive) return 0;

    this.progress.totalWrecksCollected++;
    this.progress.totalScoreEarned += scoreGained;

    if (wreck.rarity === 'rare' || wreck.rarity === 'epic' || wreck.rarity === 'legendary') {
      this.progress.rareWrecksCollected++;
    }

    const currencyEarned = Math.floor(wreck.basePoints / 10) + wreck.eventBonus;
    this.progress.eventCurrency += currencyEarned;
    this.progress.totalEventCurrency += currencyEarned;
    this.progress.lastActivityAt = Date.now();

    this.save();
    this.checkPhaseCompletion();
    this.onEvent?.({ type: 'wreck_collected', wreck, currency: currencyEarned });

    return currencyEarned;
  }

  recordExpeditionCompleted() {
    if (!this.getState().isActive) return;
    this.progress.expeditionsCompleted++;
    this.progress.lastActivityAt = Date.now();
    this.save();
    this.checkPhaseCompletion();
  }

  getExchangeStock(item: SalvageExchangeItem): number {
    const purchased = this.progress.exchangePurchaseHistory[item.id] ?? 0;
    return Math.max(0, item.maxStock - purchased);
  }

  canPurchaseExchange(item: SalvageExchangeItem): { canPurchase: boolean; reason?: string } {
    if (!this.getState().isActive) {
      return { canPurchase: false, reason: '活动已结束' };
    }
    if (this.progress.eventCurrency < item.cost) {
      return { canPurchase: false, reason: `打捞积分不足（需要 ${item.cost}）` };
    }
    if (this.getExchangeStock(item) <= 0) {
      return { canPurchase: false, reason: '已兑换完毕' };
    }
    return { canPurchase: true };
  }

  purchaseExchange(itemId: string): SalvageExchangeItem | null {
    const item = this.config.exchangeItems.find(i => i.id === itemId);
    if (!item) return null;

    const check = this.canPurchaseExchange(item);
    if (!check.canPurchase) return null;

    this.progress.eventCurrency -= item.cost;
    this.progress.exchangePurchaseHistory[itemId] = (this.progress.exchangePurchaseHistory[itemId] ?? 0) + 1;
    this.progress.lastActivityAt = Date.now();

    this.save();
    this.onEvent?.({ type: 'exchange_purchased', item });
    return item;
  }

  getRandomEventWreck(): SalvageEventWreck | null {
    if (!this.getState().isActive) return null;

    const wrecks = this.config.eventWrecks;
    const totalWeight = wrecks.reduce((sum, w) => sum + getRarityWeight(w.rarity), 0);
    let random = Math.random() * totalWeight;

    for (const wreck of wrecks) {
      random -= getRarityWeight(wreck.rarity);
      if (random <= 0) return wreck;
    }

    return wrecks[0] ?? null;
  }

  getEventWreckMultiplier(): number {
    if (!this.getState().isActive) return 1;
    let multiplier = this.config.wreckWeightBonus;

    for (const phaseId of this.progress.claimedPhases) {
      const phase = this.config.phaseGoals.find(p => p.id === phaseId);
      if (phase && phase.rewardType === 'wreck_multiplier') {
        multiplier *= phase.rewardValue;
      }
    }

    return multiplier;
  }

  getBonusSonarCharges(): number {
    let bonus = 0;
    for (const phaseId of this.progress.claimedPhases) {
      const phase = this.config.phaseGoals.find(p => p.id === phaseId);
      if (phase && phase.rewardType === 'sonar_charges') {
        bonus += phase.rewardValue;
      }
    }
    return bonus;
  }

  getBonusLives(): number {
    let bonus = 0;
    for (const phaseId of this.progress.claimedPhases) {
      const phase = this.config.phaseGoals.find(p => p.id === phaseId);
      if (phase && phase.rewardType === 'extra_life') {
        bonus += phase.rewardValue;
      }
    }
    return bonus;
  }

  getEventCurrency(): number {
    return this.progress.eventCurrency;
  }

  getWreckCollectionStats() {
    const wrecks = this.config.eventWrecks;
    return {
      total: wrecks.length,
      byRarity: {
        common: wrecks.filter(w => w.rarity === 'common').length,
        rare: wrecks.filter(w => w.rarity === 'rare').length,
        epic: wrecks.filter(w => w.rarity === 'epic').length,
        legendary: wrecks.filter(w => w.rarity === 'legendary').length,
      },
    };
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (_e) {}
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SalvageEventProgress>;
        if (parsed.eventId === this.config.id) {
          this.progress = {
            ...this.createEmptyProgress(),
            ...parsed,
          };
        }
      }
    } catch (_e) {}
  }

  resetAll() {
    this.progress = this.createEmptyProgress();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
  }

  destroy() {
    this.stopTimer();
  }
}
