import type { OceanLevelConfig, RewardRule, DangerZone } from '../types/game';
import {
  OCEAN_EDITOR_CONFIG,
  createDefaultLevel,
  createDefaultRewardRule,
  createDefaultDangerZone,
  PRESET_LEVELS,
} from '../config/oceanEditorConfig';

export class OceanEditorSystem {
  private levels: OceanLevelConfig[] = [];
  private activeLevelId: string | null = null;

  constructor() {
    this.loadFromStorage();
    if (this.levels.length === 0) {
      this.levels = PRESET_LEVELS.map((l) => ({ ...l }));
      this.saveToStorage();
    }
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(OCEAN_EDITOR_CONFIG.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.levels = parsed;
        }
      }
    } catch (_e) {}
  }

  private saveToStorage() {
    try {
      localStorage.setItem(OCEAN_EDITOR_CONFIG.STORAGE_KEY, JSON.stringify(this.levels));
    } catch (_e) {}
  }

  getLevels(): OceanLevelConfig[] {
    return [...this.levels];
  }

  getLevel(id: string): OceanLevelConfig | null {
    return this.levels.find((l) => l.id === id) ?? null;
  }

  getActiveLevel(): OceanLevelConfig | null {
    return this.activeLevelId ? this.getLevel(this.activeLevelId) : null;
  }

  setActiveLevel(id: string | null) {
    this.activeLevelId = id;
  }

  createLevel(): OceanLevelConfig {
    const newLevel = createDefaultLevel();
    this.levels.push(newLevel);
    this.saveToStorage();
    return newLevel;
  }

  duplicateLevel(id: string): OceanLevelConfig | null {
    const source = this.getLevel(id);
    if (!source) return null;

    const duplicated: OceanLevelConfig = {
      ...JSON.parse(JSON.stringify(source)),
      id: `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${source.name} (副本)`,
      createdAt: Date.now(),
    };
    this.levels.push(duplicated);
    this.saveToStorage();
    return duplicated;
  }

  updateLevel(id: string, updates: Partial<OceanLevelConfig>): boolean {
    const idx = this.levels.findIndex((l) => l.id === id);
    if (idx === -1) return false;

    this.levels[idx] = { ...this.levels[idx], ...updates };
    this.saveToStorage();
    return true;
  }

  deleteLevel(id: string): boolean {
    const idx = this.levels.findIndex((l) => l.id === id);
    if (idx === -1) return false;

    this.levels.splice(idx, 1);
    if (this.activeLevelId === id) {
      this.activeLevelId = null;
    }
    this.saveToStorage();
    return true;
  }

  addRewardRule(levelId: string): RewardRule | null {
    const level = this.getLevel(levelId);
    if (!level) return null;
    if (level.rewardRules.length >= OCEAN_EDITOR_CONFIG.REWARD.MAX_RULES) return null;

    const rule = createDefaultRewardRule();
    level.rewardRules.push(rule);
    this.saveToStorage();
    return rule;
  }

  updateRewardRule(levelId: string, ruleIndex: number, updates: Partial<RewardRule>): boolean {
    const level = this.getLevel(levelId);
    if (!level || ruleIndex < 0 || ruleIndex >= level.rewardRules.length) return false;

    level.rewardRules[ruleIndex] = { ...level.rewardRules[ruleIndex], ...updates };
    this.saveToStorage();
    return true;
  }

  deleteRewardRule(levelId: string, ruleIndex: number): boolean {
    const level = this.getLevel(levelId);
    if (!level || ruleIndex < 0 || ruleIndex >= level.rewardRules.length) return false;

    level.rewardRules.splice(ruleIndex, 1);
    this.saveToStorage();
    return true;
  }

  addDangerZone(levelId: string): DangerZone | null {
    const level = this.getLevel(levelId);
    if (!level) return null;
    if (level.dangerZones.length >= OCEAN_EDITOR_CONFIG.DANGER_ZONE.MAX_ZONES) return null;

    const zone = createDefaultDangerZone();
    zone.position.x = Math.floor(level.mapWidth / 2);
    zone.position.y = Math.floor(level.mapHeight / 2);
    level.dangerZones.push(zone);
    this.saveToStorage();
    return zone;
  }

  updateDangerZone(levelId: string, zoneId: number, updates: Partial<DangerZone>): boolean {
    const level = this.getLevel(levelId);
    if (!level) return false;

    const idx = level.dangerZones.findIndex((z) => z.id === zoneId);
    if (idx === -1) return false;

    level.dangerZones[idx] = { ...level.dangerZones[idx], ...updates };
    this.saveToStorage();
    return true;
  }

  deleteDangerZone(levelId: string, zoneId: number): boolean {
    const level = this.getLevel(levelId);
    if (!level) return false;

    const idx = level.dangerZones.findIndex((z) => z.id === zoneId);
    if (idx === -1) return false;

    level.dangerZones.splice(idx, 1);
    this.saveToStorage();
    return true;
  }

  exportLevel(id: string): string | null {
    const level = this.getLevel(id);
    if (!level) return null;
    return JSON.stringify(level, null, 2);
  }

  importLevel(jsonStr: string): OceanLevelConfig | null {
    try {
      const parsed = JSON.parse(jsonStr) as OceanLevelConfig;
      if (!parsed || !parsed.id || !parsed.name) return null;

      parsed.id = `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      parsed.name = `${parsed.name} (导入)`;
      parsed.createdAt = Date.now();

      this.levels.push(parsed);
      this.saveToStorage();
      return parsed;
    } catch (_e) {
      return null;
    }
  }

  buildGameConfig(level: OceanLevelConfig) {
    return {
      MAP_WIDTH: level.mapWidth,
      MAP_HEIGHT: level.mapHeight,
      SONAR: {
        MAX_RADIUS: level.sonar.maxRadius,
        SPEED: level.sonar.speed,
        MAX_CHARGES: level.sonar.maxCharges,
        RECHARGE_TIME: level.sonar.rechargeTime,
        COLOR: 0x00ffaa,
      },
      TARGETS: {
        CREATURE_COUNT: level.targetDensity.creature,
        WRECK_COUNT: level.targetDensity.wreck,
        DANGER_COUNT: level.targetDensity.danger,
        MIN_RADIUS: 18,
        MAX_RADIUS: 45,
        SPAWN_MARGIN: 60,
      },
      SCORE: {
        CREATURE_POINTS: level.targetPoints.creature,
        WRECK_POINTS: level.targetPoints.wreck,
        DANGER_PENALTY: level.targetPoints.danger,
        LIFE_LOST: 1,
        BONUS_PER_LEVEL: 50,
      },
      GAME: {
        INITIAL_LIVES: level.game.initialLives,
        TARGETS_PER_LEVEL: level.game.targetsPerLevel,
      },
      COLORS: {
        BACKGROUND: 0x000814,
        GRID: 0x003344,
        SONAR: 0x00ffaa,
        CREATURE: 0x00e5ff,
        WRECK: 0xffcc00,
        DANGER: 0xff3355,
        PLAYER: 0x00ff88,
      },
      DANGER_ZONES: level.dangerZones,
      REWARD_RULES: level.rewardRules,
    };
  }

  validateLevel(level: OceanLevelConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!level.name || level.name.trim().length === 0) {
      errors.push('关卡名称不能为空');
    }

    const cfg = OCEAN_EDITOR_CONFIG;

    if (level.mapWidth < cfg.MAP.MIN_WIDTH || level.mapWidth > cfg.MAP.MAX_WIDTH) {
      errors.push(`地图宽度必须在 ${cfg.MAP.MIN_WIDTH} - ${cfg.MAP.MAX_WIDTH} 之间`);
    }
    if (level.mapHeight < cfg.MAP.MIN_HEIGHT || level.mapHeight > cfg.MAP.MAX_HEIGHT) {
      errors.push(`地图高度必须在 ${cfg.MAP.MIN_HEIGHT} - ${cfg.MAP.MAX_HEIGHT} 之间`);
    }

    for (const type of ['creature', 'wreck', 'danger'] as const) {
      const count = level.targetDensity[type];
      if (count < cfg.TARGETS.MIN_COUNT || count > cfg.TARGETS.MAX_COUNT) {
        errors.push(`${type} 目标数量必须在 ${cfg.TARGETS.MIN_COUNT} - ${cfg.TARGETS.MAX_COUNT} 之间`);
      }
    }

    if (level.game.initialLives < cfg.GAME.MIN_LIVES || level.game.initialLives > cfg.GAME.MAX_LIVES) {
      errors.push(`初始生命数必须在 ${cfg.GAME.MIN_LIVES} - ${cfg.GAME.MAX_LIVES} 之间`);
    }

    if (level.dangerZones.some((z) => z.radius < cfg.DANGER_ZONE.MIN_RADIUS || z.radius > cfg.DANGER_ZONE.MAX_RADIUS)) {
      errors.push(`危险区半径必须在 ${cfg.DANGER_ZONE.MIN_RADIUS} - ${cfg.DANGER_ZONE.MAX_RADIUS} 之间`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  resetToDefaults() {
    this.levels = PRESET_LEVELS.map((l) => ({ ...l }));
    this.activeLevelId = null;
    this.saveToStorage();
  }
}
