import type { Target, TargetType, TargetRarity, Position, OceanTheme, DepthZoneInfo } from '../types/game';
import { GAME_CONFIG, CREATURE_NAMES, WRECK_NAMES, DANGER_NAMES } from '../config/gameConfig';
import { SeededRandom } from './SeededRandom';
import { getOceanTheme, DEFAULT_OCEAN_THEME_ID } from '../config/oceanThemes';
import { getDepthZone, DEPTH_ZONES } from './ScoreSystem';
import type { OceanThemeId } from '../types/game';

let nextId = 1;

export interface TargetMultipliers {
  creatureCountMul: number;
  wreckCountMul: number;
  dangerCountMul: number;
  creaturePointsBonus: number;
  wreckPointsBonus: number;
  scoreMul: number;
}

export class TargetGenerator {
  private width: number;
  private height: number;
  private baseMultipliers: TargetMultipliers = {
    creatureCountMul: 1,
    wreckCountMul: 1,
    dangerCountMul: 1,
    creaturePointsBonus: 0,
    wreckPointsBonus: 0,
    scoreMul: 1,
  };
  private multipliers: TargetMultipliers = {
    creatureCountMul: 1,
    wreckCountMul: 1,
    dangerCountMul: 1,
    creaturePointsBonus: 0,
    wreckPointsBonus: 0,
    scoreMul: 1,
  };
  private seed: number | null = null;
  private rng: SeededRandom | null = null;
  private customConfig: any = null;
  private oceanThemeId: OceanThemeId = DEFAULT_OCEAN_THEME_ID;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  setMultipliers(mults: TargetMultipliers) {
    this.baseMultipliers = { ...mults };
    this.multipliers = { ...mults };
    const theme = getOceanTheme(this.oceanThemeId);
    this.applyOceanThemeEffects(theme);
  }

  setSeed(seed: number | null) {
    this.seed = seed;
    if (seed !== null) {
      this.rng = new SeededRandom(seed);
    } else {
      this.rng = null;
    }
  }

  setCustomConfig(config: any | null) {
    this.customConfig = config;
  }

  setOceanTheme(themeId: OceanThemeId) {
    this.oceanThemeId = themeId;
    this.multipliers = { ...this.baseMultipliers };
    const theme = getOceanTheme(themeId);
    this.applyOceanThemeEffects(theme);
  }

  private applyOceanThemeEffects(theme: OceanTheme) {
    const dangerCountRule = theme.riskRules.find(r => r.type === 'danger_count');
    const targetDensityRule = theme.riskRules.find(r => r.type === 'target_density');
    
    this.multipliers.dangerCountMul = this.baseMultipliers.dangerCountMul * (dangerCountRule?.value ?? 1);
    this.multipliers.creatureCountMul = this.baseMultipliers.creatureCountMul * (targetDensityRule?.value ?? 1);
    this.multipliers.wreckCountMul = this.baseMultipliers.wreckCountMul * (targetDensityRule?.value ?? 1);
  }

  getCurrentTheme(): OceanTheme {
    return getOceanTheme(this.oceanThemeId);
  }

  private randomPosition(margin: number): Position {
    if (this.rng) {
      return {
        x: margin + this.rng.nextFloat(0, 1) * (this.width - 2 * margin),
        y: margin + this.rng.nextFloat(0, 1) * (this.height - 2 * margin),
      };
    }
    return {
      x: margin + Math.random() * (this.width - 2 * margin),
      y: margin + Math.random() * (this.height - 2 * margin),
    };
  }

  private randomRadius(min: number, max: number): number {
    if (this.rng) {
      return this.rng.nextFloat(min, max);
    }
    return min + Math.random() * (max - min);
  }

  private randomShape(type: TargetType): 'circle' | 'triangle' | 'square' | 'irregular' {
    if (type === 'danger') {
      const shapes: Array<'triangle' | 'square'> = ['triangle', 'square'];
      if (this.rng) {
        return shapes[Math.floor(this.rng.next() * shapes.length)];
      }
      return shapes[Math.floor(Math.random() * shapes.length)];
    }
    if (type === 'wreck') {
      return 'irregular';
    }
    return 'circle';
  }

  private randomRotation(): number {
    if (this.rng) {
      return this.rng.nextFloat(0, Math.PI * 2);
    }
    return Math.random() * Math.PI * 2;
  }

  private randomPick<T>(array: T[]): T {
    if (this.rng) {
      return array[Math.floor(this.rng.next() * array.length)];
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  private isOverlapping(pos: Position, radius: number, existing: Target[]): boolean {
    const minDist = GAME_CONFIG.TARGETS.SPAWN_MARGIN;
    for (const t of existing) {
      const dx = pos.x - t.position.x;
      const dy = pos.y - t.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius + t.radius + minDist) {
        return true;
      }
    }
    return false;
  }

  generateTargets(level: number): Target[] {
    const targets: Target[] = [];
    const cfg = this.customConfig ?? GAME_CONFIG;
    const margin = cfg.TARGETS.SPAWN_MARGIN;
    const minR = cfg.TARGETS.MIN_RADIUS;
    const maxR = cfg.TARGETS.MAX_RADIUS;
    const theme = getOceanTheme(this.oceanThemeId);

    let creatureCount: number;
    let wreckCount: number;
    let dangerCount: number;

    if (this.customConfig) {
      creatureCount = Math.max(0, cfg.TARGETS.CREATURE_COUNT);
      wreckCount = Math.max(0, cfg.TARGETS.WRECK_COUNT);
      dangerCount = Math.max(0, cfg.TARGETS.DANGER_COUNT);
    } else {
      const baseCreature = GAME_CONFIG.TARGETS.CREATURE_COUNT + Math.floor(level / 2);
      const baseWreck = GAME_CONFIG.TARGETS.WRECK_COUNT + Math.floor(level / 3);
      const baseDanger = GAME_CONFIG.TARGETS.DANGER_COUNT + Math.floor(level / 2);
      creatureCount = Math.max(1, Math.round(baseCreature * this.multipliers.creatureCountMul));
      wreckCount = Math.max(1, Math.round(baseWreck * this.multipliers.wreckCountMul));
      dangerCount = Math.max(1, Math.round(baseDanger * this.multipliers.dangerCountMul));
    }

    const addTarget = (type: TargetType) => {
      let attempts = 0;
      while (attempts < 100) {
        const pos = this.randomPosition(margin);
        const radius = this.randomRadius(minR, maxR);
        if (!this.isOverlapping(pos, radius, targets)) {
          let name = '';
          let points = 0;
          let rarity: TargetRarity = 'common';

          const rng = this.rng ? this.rng.next() : Math.random();
          const canSpawnLegendary = level >= GAME_CONFIG.LEGENDARY_CHAIN.MIN_LEVEL_FOR_SPAWN && type !== 'danger';

          if (canSpawnLegendary && rng < GAME_CONFIG.LEGENDARY_CHAIN.SPAWN_CHANCE) {
            rarity = 'legendary';
            const legendaryNames = GAME_CONFIG.LEGENDARY_CHAIN.LEGENDARY_NAMES[type as 'creature' | 'wreck'];
            name = legendaryNames[Math.floor((this.rng ? this.rng.next() : Math.random()) * legendaryNames.length)];
          } else if (canSpawnLegendary && rng < GAME_CONFIG.LEGENDARY_CHAIN.SPAWN_CHANCE + GAME_CONFIG.LEGENDARY_CHAIN.RARE_SPAWN_CHANCE) {
            rarity = 'rare';
          }

          if (type === 'creature') {
            if (rarity === 'common') {
              name = this.randomPick(theme.targetPool.creatureNames);
            }
            points = this.customConfig
              ? cfg.SCORE.CREATURE_POINTS
              : Math.round((GAME_CONFIG.SCORE.CREATURE_POINTS + this.multipliers.creaturePointsBonus) * this.multipliers.scoreMul * theme.scoreCoefficients.creature * theme.scoreCoefficients.global);
            if (rarity === 'legendary') {
              points = Math.round(points * GAME_CONFIG.LEGENDARY_CHAIN.POINTS_MULTIPLIER);
            } else if (rarity === 'rare') {
              points = Math.round(points * GAME_CONFIG.LEGENDARY_CHAIN.RARE_POINTS_MULTIPLIER);
            }
          } else if (type === 'wreck') {
            if (rarity === 'common') {
              name = this.randomPick(theme.targetPool.wreckNames);
            }
            points = this.customConfig
              ? cfg.SCORE.WRECK_POINTS
              : Math.round((GAME_CONFIG.SCORE.WRECK_POINTS + this.multipliers.wreckPointsBonus) * this.multipliers.scoreMul * theme.scoreCoefficients.wreck * theme.scoreCoefficients.global);
            if (rarity === 'legendary') {
              points = Math.round(points * GAME_CONFIG.LEGENDARY_CHAIN.POINTS_MULTIPLIER);
            } else if (rarity === 'rare') {
              points = Math.round(points * GAME_CONFIG.LEGENDARY_CHAIN.RARE_POINTS_MULTIPLIER);
            }
          } else {
            name = this.randomPick(theme.targetPool.dangerNames);
            points = Math.round(cfg.SCORE.DANGER_PENALTY * theme.scoreCoefficients.danger);
          }

          const target: Target = {
            id: nextId++,
            type,
            position: pos,
            radius: rarity === 'legendary' ? radius * 1.3 : radius,
            name,
            points,
            discovered: false,
            collected: false,
            shape: this.randomShape(type),
            rotation: this.randomRotation(),
            dangerPhase: type === 'danger' ? 'undetected' : undefined,
            rarity,
          };
          targets.push(target);
          return;
        }
        attempts++;
      }
    };

    for (let i = 0; i < creatureCount; i++) addTarget('creature');
    for (let i = 0; i < wreckCount; i++) addTarget('wreck');
    for (let i = 0; i < dangerCount; i++) addTarget('danger');

    this.injectDepthBonusWrecks(targets, level);

    return targets;
  }

  private injectDepthBonusWrecks(targets: Target[], level: number): void {
    const margin = GAME_CONFIG.TARGETS.SPAWN_MARGIN;
    const minR = GAME_CONFIG.TARGETS.MIN_RADIUS;
    const maxR = GAME_CONFIG.TARGETS.MAX_RADIUS;
    const theme = getOceanTheme(this.oceanThemeId);

    for (const zone of DEPTH_ZONES) {
      if (zone.highValueWreckChance <= 0.1) continue;

      const zoneMinY = zone.id === 'shallow' ? margin : DEPTH_ZONES[DEPTH_ZONES.indexOf(zone) - 1]?.maxDepth ?? margin;
      const zoneMaxY = zone.maxDepth - margin;
      if (zoneMaxY <= zoneMinY) continue;

      const bonusCount = Math.floor(zone.highValueWreckChance * (1 + level * 0.3));
      for (let i = 0; i < bonusCount; i++) {
        if (this.rng ? this.rng.next() > zone.highValueWreckChance : Math.random() > zone.highValueWreckChance) continue;

        let attempts = 0;
        while (attempts < 50) {
          const pos: Position = {
            x: margin + (this.rng ? this.rng.nextFloat(0, 1) : Math.random()) * (this.width - 2 * margin),
            y: zoneMinY + (this.rng ? this.rng.nextFloat(0, 1) : Math.random()) * (zoneMaxY - zoneMinY),
          };
          const radius = minR + (this.rng ? this.rng.nextFloat(minR, maxR) : Math.random()) * (maxR - minR);

          let overlapping = false;
          for (const t of targets) {
            const dx = pos.x - t.position.x;
            const dy = pos.y - t.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius + t.radius + GAME_CONFIG.TARGETS.SPAWN_MARGIN) {
              overlapping = true;
              break;
            }
          }

          if (!overlapping) {
            const name = this.randomPick(theme.targetPool.wreckNames);
            const basePoints = Math.round(
              (GAME_CONFIG.SCORE.WRECK_POINTS + this.multipliers.wreckPointsBonus) *
              this.multipliers.scoreMul *
              theme.scoreCoefficients.wreck *
              theme.scoreCoefficients.global *
              zone.wreckValueBonus
            );
            targets.push({
              id: nextId++,
              type: 'wreck',
              position: pos,
              radius,
              name: `${zone.name}·${name}`,
              points: basePoints,
              discovered: false,
              collected: false,
              shape: 'irregular',
              rotation: this.randomRotation(),
            });
            break;
          }
          attempts++;
        }
      }
    }
  }
}
