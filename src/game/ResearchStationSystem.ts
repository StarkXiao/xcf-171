import type {
  TechProgress, TechNode, ResearchStationStats, TechCategory, ExpeditionReward, TechEffectType } from '../types/game';
import { TECH_TREE, getTechById, calculateExpeditionReward } from '../config/researchStation';

const STORAGE_KEY = 'deepSeaSonar_researchStation';

export class ResearchStationSystem {
  private progress: TechProgress;

  constructor() {
    this.progress = this.createEmptyProgress();
    this.load();
  }

  private createEmptyProgress(): TechProgress {
    return {
      unlocked: [],
      expeditionPoints: 0,
      totalExpeditionPoints: 0,
      expeditionsCompleted: 0,
    };
  }

  grantExpeditionReward(
    score: number,
    level: number,
    discovered: number,
    isDailyChallenge: boolean = false
  ): ExpeditionReward {
    const reward = calculateExpeditionReward(score, level, discovered, isDailyChallenge);
    this.progress.expeditionPoints += reward.points;
    this.progress.totalExpeditionPoints += reward.points;
    this.progress.expeditionsCompleted += 1;
    this.save();
    return reward;
  }

  getExpeditionPoints(): number {
    return this.progress.expeditionPoints;
  }

  getTotalExpeditionPoints(): number {
    return this.progress.totalExpeditionPoints;
  }

  getExpeditionsCompleted(): number {
    return this.progress.expeditionsCompleted;
  }

  isTechUnlocked(techId: string): boolean {
    return this.progress.unlocked.includes(techId);
  }

  canUnlockTech(techId: string): { canUnlock: boolean; reason?: string } {
    const tech = getTechById(techId);
    if (!tech) {
      return { canUnlock: false, reason: '科技不存在' };
    }
    if (this.isTechUnlocked(techId)) {
      return { canUnlock: false, reason: '已解锁' };
    }
    for (const reqId of tech.requires) {
      if (!this.isTechUnlocked(reqId)) {
        const reqTech = getTechById(reqId);
        return { canUnlock: false, reason: `需要先解锁：${reqTech?.name ?? reqId}` };
      }
    }
    if (this.progress.expeditionPoints < tech.cost) {
      return { canUnlock: false, reason: `航次积分不足（需要 ${tech.cost}` };
    }
    return { canUnlock: true };
  }

  unlockTech(techId: string): boolean {
    const check = this.canUnlockTech(techId);
    if (!check.canUnlock) return false;

    const tech = getTechById(techId);
    if (!tech) return false;

    this.progress.expeditionPoints -= tech.cost;
    this.progress.unlocked.push(techId);
    this.save();
    return true;
  }

  getAggregatedEffects(): Partial<Record<TechEffectType, number>> {
    const effects: Partial<Record<TechEffectType, number>> = {};
    for (const techId of this.progress.unlocked) {
      const tech = getTechById(techId);
      if (!tech) continue;
      for (const [key, value] of Object.entries(tech.effects)) {
        const effectKey = key as TechEffectType;
        effects[effectKey] = (effects[effectKey] ?? 0) + (value as number);
      }
    }
    return effects;
  }

  getStats(): ResearchStationStats {
    const categoryProgress: Record<TechCategory, { unlocked: number; total: number }> = {
      sonar: { unlocked: 0, total: 0 },
      power: { unlocked: 0, total: 0 },
      radar: { unlocked: 0, total: 0 },
      core: { unlocked: 0, total: 0 },
    };

    for (const tech of TECH_TREE) {
      categoryProgress[tech.category].total++;
      if (this.isTechUnlocked(tech.id)) {
        categoryProgress[tech.category].unlocked++;
      }
    }

    return {
      expeditionPoints: this.progress.expeditionPoints,
      totalExpeditionPoints: this.progress.totalExpeditionPoints,
      expeditionsCompleted: this.progress.expeditionsCompleted,
      unlockedCount: this.progress.unlocked.length,
      totalTechCount: TECH_TREE.length,
      categoryProgress,
    };
  }

  getProgress(): TechProgress {
    return JSON.parse(JSON.stringify(this.progress));
  }

  getUnlockedTech(): TechNode[] {
    return this.progress.unlocked
      .map((id) => getTechById(id))
      .filter((t): t is TechNode => t !== undefined);
  }

  resetAll() {
    this.progress = this.createEmptyProgress();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
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
        const parsed = JSON.parse(saved);
        this.progress = {
          ...this.createEmptyProgress(),
          ...parsed,
        };
      }
    } catch (_e) {}
  }
}
