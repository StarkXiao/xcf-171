import type { Target, TargetType, Position, CollectionEntry, CollectionData, UnlockEvent } from '../types/game';
import { CREATURE_NAMES, WRECK_NAMES, DANGER_NAMES } from '../config/gameConfig';

const STORAGE_KEY = 'deepSeaSonar_collection';

export class CollectionSystem {
  private data: CollectionData;
  private sessionUnlocks: UnlockEvent[] = [];
  private onUnlock?: (event: UnlockEvent) => void;

  constructor() {
    this.data = this.createEmptyData();
    this.load();
  }

  private createEmptyData(): CollectionData {
    const creatures: Record<string, CollectionEntry> = {};
    const wrecks: Record<string, CollectionEntry> = {};
    const dangers: Record<string, CollectionEntry> = {};

    for (const name of CREATURE_NAMES) {
      creatures[name] = this.createEmptyEntry(name, 'creature');
    }
    for (const name of WRECK_NAMES) {
      wrecks[name] = this.createEmptyEntry(name, 'wreck');
    }
    for (const name of DANGER_NAMES) {
      dangers[name] = this.createEmptyEntry(name, 'danger');
    }

    return { creatures, wrecks, dangers };
  }

  private createEmptyEntry(name: string, type: TargetType): CollectionEntry {
    return {
      name,
      type,
      unlocked: false,
      firstDiscoveredAt: null,
      firstDiscoveredLevel: 0,
      discoveryCount: 0,
      bestScore: 0,
      lastDiscoveredAt: 0,
    };
  }

  setUnlockCallback(callback: (event: UnlockEvent) => void) {
    this.onUnlock = callback;
  }

  resetSessionUnlocks() {
    this.sessionUnlocks = [];
  }

  getSessionUnlocks(): UnlockEvent[] {
    return [...this.sessionUnlocks];
  }

  recordTarget(target: Target, level: number, scoreGained: number): UnlockEvent | null {
    const category = this.getCategory(target.type);
    if (!category) return null;

    const entry = this.data[category][target.name];
    if (!entry) return null;

    const isNew = !entry.unlocked;
    const now = Date.now();

    entry.unlocked = true;
    entry.discoveryCount++;
    entry.lastDiscoveredAt = now;
    if (scoreGained > entry.bestScore) {
      entry.bestScore = scoreGained;
    }
    if (isNew) {
      entry.firstDiscoveredAt = { ...target.position };
      entry.firstDiscoveredLevel = level;
    }

    const event: UnlockEvent = {
      name: target.name,
      type: target.type,
      isNew,
      entry: { ...entry },
    };

    this.sessionUnlocks.push(event);
    this.save();
    this.onUnlock?.(event);

    return event;
  }

  private getCategory(type: TargetType): keyof CollectionData | null {
    switch (type) {
      case 'creature': return 'creatures';
      case 'wreck': return 'wrecks';
      case 'danger': return 'dangers';
      default: return null;
    }
  }

  getData(): CollectionData {
    return JSON.parse(JSON.stringify(this.data));
  }

  getStats() {
    const all = [...Object.values(this.data.creatures), ...Object.values(this.data.wrecks), ...Object.values(this.data.dangers)];
    const unlocked = all.filter(e => e.unlocked);
    const totalDiscoveries = all.reduce((sum, e) => sum + e.discoveryCount, 0);

    return {
      total: all.length,
      unlocked: unlocked.length,
      totalDiscoveries,
      creatures: {
        total: Object.keys(this.data.creatures).length,
        unlocked: Object.values(this.data.creatures).filter(e => e.unlocked).length,
      },
      wrecks: {
        total: Object.keys(this.data.wrecks).length,
        unlocked: Object.values(this.data.wrecks).filter(e => e.unlocked).length,
      },
      dangers: {
        total: Object.keys(this.data.dangers).length,
        unlocked: Object.values(this.data.dangers).filter(e => e.unlocked).length,
      },
    };
  }

  getEntriesByType(type: TargetType): CollectionEntry[] {
    const category = this.getCategory(type);
    if (!category) return [];
    return Object.values(this.data[category]).sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (_e) {}
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CollectionData>;
        this.mergeData(parsed);
      }
    } catch (_e) {}
  }

  private mergeData(parsed: Partial<CollectionData>) {
    const mergeCategory = (
      target: Record<string, CollectionEntry>,
      source?: Record<string, Partial<CollectionEntry>>
    ) => {
      if (!source) return;
      for (const name of Object.keys(target)) {
        const src = source[name];
        if (src) {
          target[name] = {
            ...target[name],
            ...src,
            firstDiscoveredAt: src.firstDiscoveredAt ?? target[name].firstDiscoveredAt,
          } as CollectionEntry;
        }
      }
    };
    mergeCategory(this.data.creatures, parsed.creatures);
    mergeCategory(this.data.wrecks, parsed.wrecks);
    mergeCategory(this.data.dangers, parsed.dangers);
  }

  resetAll() {
    this.data = this.createEmptyData();
    this.sessionUnlocks = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
  }
}
