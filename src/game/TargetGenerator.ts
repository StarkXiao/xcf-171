import type { Target, TargetType, Position, OceanTheme } from '../types/game';
import { GAME_CONFIG, CREATURE_NAMES, WRECK_NAMES, DANGER_NAMES } from '../config/gameConfig';
import { SeededRandom } from './SeededRandom';
import { getOceanTheme, DEFAULT_OCEAN_THEME_ID } from '../config/oceanThemes';
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
    this.multipliers = mults;
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
    const theme = getOceanTheme(themeId);
    
    const dangerCountRule = theme.riskRules.find(r => r.type === 'danger_count');
    const targetDensityRule = theme.riskRules.find(r => r.type === 'target_density');
    
    this.multipliers.dangerCountMul *= dangerCountRule?.value ?? 1;
    this.multipliers.creatureCountMul *= targetDensityRule?.value ?? 1;
    this.multipliers.wreckCountMul *= targetDensityRule?.value ?? 1;
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
          if (type === 'creature') {
            name = this.randomPick(theme.targetPool.creatureNames);
            points = this.customConfig
              ? cfg.SCORE.CREATURE_POINTS
              : Math.round((GAME_CONFIG.SCORE.CREATURE_POINTS + this.multipliers.creaturePointsBonus) * this.multipliers.scoreMul * theme.scoreCoefficients.creature * theme.scoreCoefficients.global);
          } else if (type === 'wreck') {
            name = this.randomPick(theme.targetPool.wreckNames);
            points = this.customConfig
              ? cfg.SCORE.WRECK_POINTS
              : Math.round((GAME_CONFIG.SCORE.WRECK_POINTS + this.multipliers.wreckPointsBonus) * this.multipliers.scoreMul * theme.scoreCoefficients.wreck * theme.scoreCoefficients.global);
          } else {
            name = this.randomPick(theme.targetPool.dangerNames);
            points = Math.round(cfg.SCORE.DANGER_PENALTY * theme.scoreCoefficients.danger);
          }
          targets.push({
            id: nextId++,
            type,
            position: pos,
            radius,
            name,
            points,
            discovered: false,
            collected: false,
            shape: this.randomShape(type),
            rotation: this.randomRotation(),
            dangerPhase: type === 'danger' ? 'undetected' : undefined,
          });
          return;
        }
        attempts++;
      }
    };

    for (let i = 0; i < creatureCount; i++) addTarget('creature');
    for (let i = 0; i < wreckCount; i++) addTarget('wreck');
    for (let i = 0; i < dangerCount; i++) addTarget('danger');

    return targets;
  }
}
