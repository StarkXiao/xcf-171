import type { Target, TargetRarity, LegendaryChainState, LegendaryChainEvent, LegendaryChainReward } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

export interface LegendaryChainCallbacks {
  onChainEvent?: (event: LegendaryChainEvent) => void;
  onStateChange?: (state: LegendaryChainState) => void;
  addBonusPoints?: (points: number, reason: string) => void;
  addLife?: (amount: number) => void;
  addSonarCharges?: (amount: number) => void;
}

export class LegendaryChainSystem {
  private state: LegendaryChainState;
  private callbacks: LegendaryChainCallbacks = {};
  private awardedChainLengths: Set<number> = new Set();

  constructor() {
    this.state = this.createInitialState();
  }

  setCallbacks(callbacks: LegendaryChainCallbacks) {
    this.callbacks = callbacks;
  }

  private createInitialState(): LegendaryChainState {
    return {
      status: 'idle',
      currentChainLength: 0,
      maxChainLength: 0,
      requiredChainLength: GAME_CONFIG.LEGENDARY_CHAIN.CHAIN_LENGTHS[0]?.chainLength ?? 2,
      trackedTargetId: null,
      trackedTimerRemaining: 0,
      trackedTimerMax: GAME_CONFIG.LEGENDARY_CHAIN.TIMER_DURATION,
      completedChains: 0,
      totalLegendaryCollected: 0,
      chainRewards: [],
      lastChainBreakReason: null,
    };
  }

  reset() {
    this.state = this.createInitialState();
    this.awardedChainLengths.clear();
  }

  getState(): LegendaryChainState {
    return { ...this.state };
  }

  update(delta: number, targets: Target[]): LegendaryChainEvent[] {
    const events: LegendaryChainEvent[] = [];

    if (this.state.trackedTargetId !== null) {
      this.state.trackedTimerRemaining -= delta;

      const tracked = targets.find(t => t.id === this.state.trackedTargetId);
      if (!tracked || tracked.collected) {
        this.state.trackedTargetId = null;
        this.state.trackedTimerRemaining = 0;
      } else {
        if (this.state.trackedTimerRemaining <= GAME_CONFIG.LEGENDARY_CHAIN.TIMER_WARNING_THRESHOLD &&
            this.state.trackedTimerRemaining + delta > GAME_CONFIG.LEGENDARY_CHAIN.TIMER_WARNING_THRESHOLD) {
          const warningEvent: LegendaryChainEvent = {
            type: 'tracking_warning',
            chainLength: this.state.currentChainLength,
            targetId: tracked.id,
            targetName: tracked.name,
            timerRemaining: this.state.trackedTimerRemaining,
          };
          events.push(warningEvent);
          this.callbacks.onChainEvent?.(warningEvent);
        }

        if (this.state.trackedTimerRemaining <= 0) {
          const expiredEvent: LegendaryChainEvent = {
            type: 'legendary_expired',
            chainLength: this.state.currentChainLength,
            targetId: tracked.id,
            targetName: tracked.name,
            reason: '限时追踪超时',
          };
          events.push(expiredEvent);
          this.callbacks.onChainEvent?.(expiredEvent);

          tracked.isLegendaryTracked = false;
          this.state.trackedTargetId = null;
          this.state.trackedTimerRemaining = 0;

          this.breakChain('传说目标追踪超时');
        }
      }
    }

    this.notifyStateChange();
    return events;
  }

  onTargetDiscovered(target: Target): LegendaryChainEvent | null {
    if (target.rarity !== 'legendary') return null;

    const event: LegendaryChainEvent = {
      type: 'legendary_discovered',
      chainLength: this.state.currentChainLength,
      targetId: target.id,
      targetName: target.name,
    };
    this.callbacks.onChainEvent?.(event);

    if (this.state.trackedTargetId === null) {
      this.startTracking(target);
    }

    return event;
  }

  onTargetCollected(target: Target, allTargets: Target[]): LegendaryChainEvent[] {
    const events: LegendaryChainEvent[] = [];

    if (target.type === 'danger') {
      this.breakChain('触碰了危险物');
      return events;
    }

    if (target.rarity !== 'legendary' && target.rarity !== 'rare') {
      return events;
    }

    if (target.id === this.state.trackedTargetId) {
      this.state.trackedTargetId = null;
      this.state.trackedTimerRemaining = 0;
      target.isLegendaryTracked = false;
    }

    if (target.rarity === 'legendary') {
      this.state.totalLegendaryCollected++;

      if (this.state.status === 'idle') {
        this.state.status = 'tracking';
        const startEvent: LegendaryChainEvent = {
          type: 'chain_started',
          chainLength: 0,
          targetId: target.id,
          targetName: target.name,
        };
        events.push(startEvent);
        this.callbacks.onChainEvent?.(startEvent);
      }

      this.state.currentChainLength++;
      if (this.state.currentChainLength > this.state.maxChainLength) {
        this.state.maxChainLength = this.state.currentChainLength;
      }

      const progressEvent: LegendaryChainEvent = {
        type: 'chain_progress',
        chainLength: this.state.currentChainLength,
        targetId: target.id,
        targetName: target.name,
      };
      events.push(progressEvent);
      this.callbacks.onChainEvent?.(progressEvent);

      const collectEvent: LegendaryChainEvent = {
        type: 'legendary_collected',
        chainLength: this.state.currentChainLength,
        targetId: target.id,
        targetName: target.name,
      };
      events.push(collectEvent);
      this.callbacks.onChainEvent?.(collectEvent);

      const chainRewards = this.checkChainRewards();
      for (const reward of chainRewards) {
        this.state.chainRewards.push(reward);
        const completedEvent: LegendaryChainEvent = {
          type: 'chain_completed',
          chainLength: this.state.currentChainLength,
          reward,
        };
        events.push(completedEvent);
        this.callbacks.onChainEvent?.(completedEvent);
        this.applyReward(reward);
      }

      const nextLegendary = this.findNextLegendaryTarget(allTargets, [target.id]);
      if (nextLegendary) {
        this.startTracking(nextLegendary);
      }
    }

    this.notifyStateChange();
    return events;
  }

  onDangerHit() {
    this.breakChain('触碰了危险物');
  }

  private startTracking(target: Target) {
    this.state.trackedTargetId = target.id;
    this.state.trackedTimerRemaining = GAME_CONFIG.LEGENDARY_CHAIN.TIMER_DURATION;
    this.state.trackedTimerMax = GAME_CONFIG.LEGENDARY_CHAIN.TIMER_DURATION;
    target.isLegendaryTracked = true;
    target.legendaryTimer = GAME_CONFIG.LEGENDARY_CHAIN.TIMER_DURATION;
    target.legendaryTimerMax = GAME_CONFIG.LEGENDARY_CHAIN.TIMER_DURATION;

    const event: LegendaryChainEvent = {
      type: 'tracking_started',
      chainLength: this.state.currentChainLength,
      targetId: target.id,
      targetName: target.name,
      timerRemaining: GAME_CONFIG.LEGENDARY_CHAIN.TIMER_DURATION,
    };
    this.callbacks.onChainEvent?.(event);
  }

  private breakChain(reason: string) {
    if (this.state.currentChainLength > 0) {
      this.state.status = 'broken';
      this.state.lastChainBreakReason = reason;

      const event: LegendaryChainEvent = {
        type: 'chain_broken',
        chainLength: this.state.currentChainLength,
        reason,
      };
      this.callbacks.onChainEvent?.(event);
    }

    this.state.currentChainLength = 0;
    this.state.status = 'idle';
    this.state.trackedTargetId = null;
    this.state.trackedTimerRemaining = 0;
    this.awardedChainLengths.clear();
    this.notifyStateChange();
  }

  private checkChainRewards(): LegendaryChainReward[] {
    const rewards: LegendaryChainReward[] = [];
    const chainLength = this.state.currentChainLength;

    for (const chainReward of GAME_CONFIG.LEGENDARY_CHAIN.CHAIN_LENGTHS) {
      if (chainLength >= chainReward.chainLength && !this.awardedChainLengths.has(chainReward.chainLength)) {
        this.awardedChainLengths.add(chainReward.chainLength);
        this.state.completedChains++;
        rewards.push({ ...chainReward });
      }
    }

    return rewards;
  }

  private applyReward(reward: LegendaryChainReward) {
    if (reward.bonusPoints > 0) {
      this.callbacks.addBonusPoints?.(reward.bonusPoints, `传说链路: ${reward.achievementName}`);
    }
    if (reward.bonusLives > 0) {
      this.callbacks.addLife?.(reward.bonusLives);
    }
    if (reward.bonusSonarCharges > 0) {
      this.callbacks.addSonarCharges?.(reward.bonusSonarCharges);
    }
  }

  private findNextLegendaryTarget(targets: Target[], excludeIds: number[]): Target | null {
    let closest: Target | null = null;
    let closestDist = Infinity;

    for (const t of targets) {
      if (t.rarity !== 'legendary') continue;
      if (t.collected) continue;
      if (t.isLegendaryTracked) continue;
      if (excludeIds.includes(t.id)) continue;
      if (this.state.trackedTargetId !== null && t.id === this.state.trackedTargetId) continue;

      if (!closest) {
        closest = t;
      } else {
        closest = t;
      }
    }

    if (closest && !closest.discovered) {
      closest.discovered = true;
    }

    return closest;
  }

  getNextChainMilestone(): LegendaryChainReward | null {
    const chainLength = this.state.currentChainLength;
    let next: LegendaryChainReward | null = null;
    for (const reward of GAME_CONFIG.LEGENDARY_CHAIN.CHAIN_LENGTHS) {
      if (chainLength < reward.chainLength) {
        next = reward;
        break;
      }
    }
    return next;
  }

  getChainProgress(): { current: number; required: number; milestoneName: string } {
    const next = this.getNextChainMilestone();
    if (!next) {
      const last = GAME_CONFIG.LEGENDARY_CHAIN.CHAIN_LENGTHS[GAME_CONFIG.LEGENDARY_CHAIN.CHAIN_LENGTHS.length - 1];
      return { current: this.state.currentChainLength, required: last.chainLength, milestoneName: last.achievementName };
    }
    return { current: this.state.currentChainLength, required: next.chainLength, milestoneName: next.achievementName };
  }

  private notifyStateChange() {
    this.callbacks.onStateChange?.(this.getState());
  }
}
