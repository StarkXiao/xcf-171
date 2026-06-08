import type { Target, TargetType, Position } from '../types/game';
import { GAME_CONFIG, CREATURE_NAMES, WRECK_NAMES, DANGER_NAMES } from '../config/gameConfig';

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

  private randomPosition(margin: number): Position {
    return {
      x: margin + Math.random() * (this.width - 2 * margin),
      y: margin + Math.random() * (this.height - 2 * margin),
    };
  }

  private randomRadius(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private randomShape(type: TargetType): 'circle' | 'triangle' | 'square' | 'irregular' {
    if (type === 'danger') {
      const shapes: Array<'triangle' | 'square'> = ['triangle', 'square'];
      return shapes[Math.floor(Math.random() * shapes.length)];
    }
    if (type === 'wreck') {
      return 'irregular';
    }
    return 'circle';
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
    const margin = GAME_CONFIG.TARGETS.SPAWN_MARGIN;
    const minR = GAME_CONFIG.TARGETS.MIN_RADIUS;
    const maxR = GAME_CONFIG.TARGETS.MAX_RADIUS;

    const baseCreature = GAME_CONFIG.TARGETS.CREATURE_COUNT + Math.floor(level / 2);
    const baseWreck = GAME_CONFIG.TARGETS.WRECK_COUNT + Math.floor(level / 3);
    const baseDanger = GAME_CONFIG.TARGETS.DANGER_COUNT + Math.floor(level / 2);

    const creatureCount = Math.max(1, Math.round(baseCreature * this.multipliers.creatureCountMul));
    const wreckCount = Math.max(1, Math.round(baseWreck * this.multipliers.wreckCountMul));
    const dangerCount = Math.max(1, Math.round(baseDanger * this.multipliers.dangerCountMul));

    const addTarget = (type: TargetType) => {
      let attempts = 0;
      while (attempts < 100) {
        const pos = this.randomPosition(margin);
        const radius = this.randomRadius(minR, maxR);
        if (!this.isOverlapping(pos, radius, targets)) {
          let name = '';
          let points = 0;
          if (type === 'creature') {
            name = CREATURE_NAMES[Math.floor(Math.random() * CREATURE_NAMES.length)];
            points = Math.round((GAME_CONFIG.SCORE.CREATURE_POINTS + this.multipliers.creaturePointsBonus) * this.multipliers.scoreMul);
          } else if (type === 'wreck') {
            name = WRECK_NAMES[Math.floor(Math.random() * WRECK_NAMES.length)];
            points = Math.round((GAME_CONFIG.SCORE.WRECK_POINTS + this.multipliers.wreckPointsBonus) * this.multipliers.scoreMul);
          } else {
            name = DANGER_NAMES[Math.floor(Math.random() * DANGER_NAMES.length)];
            points = GAME_CONFIG.SCORE.DANGER_PENALTY;
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
            rotation: Math.random() * Math.PI * 2,
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
