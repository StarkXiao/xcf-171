import type { Position, SonarWave, EchoPoint, Target } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

let waveIdCounter = 1;
let echoIdCounter = 1;

export class SonarSystem {
  private waves: SonarWave[] = [];
  private echoPoints: EchoPoint[] = [];
  private onEchoGenerated?: (echos: EchoPoint[]) => void;

  setEchoCallback(callback: (echos: EchoPoint[]) => void) {
    this.onEchoGenerated = callback;
  }

  emitSonar(position: Position): boolean {
    const wave: SonarWave = {
      id: waveIdCounter++,
      position: { ...position },
      radius: 0,
      maxRadius: GAME_CONFIG.SONAR.MAX_RADIUS,
      speed: GAME_CONFIG.SONAR.SPEED,
      active: true,
      alpha: 1,
    };
    this.waves.push(wave);
    return true;
  }

  update(delta: number, targets: Target[]): { echos: EchoPoint[]; discoveredTargetIds: number[] } {
    const newEchos: EchoPoint[] = [];
    const discoveredIds: number[] = [];

    for (const wave of this.waves) {
      if (!wave.active) continue;

      const prevRadius = wave.radius;
      wave.radius += wave.speed * delta;
      wave.alpha = Math.max(0, 1 - wave.radius / wave.maxRadius);

      if (wave.radius >= wave.maxRadius) {
        wave.active = false;
        continue;
      }

      for (const target of targets) {
        if (target.discovered || target.collected) continue;

        const dx = target.position.x - wave.position.x;
        const dy = target.position.y - wave.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= prevRadius - target.radius && dist <= wave.radius + target.radius) {
          target.discovered = true;
          discoveredIds.push(target.id);

          const echoCount = target.type === 'wreck' ? 3 : target.type === 'danger' ? 2 : 1;
          for (let i = 0; i < echoCount; i++) {
            const angleOffset = (i - (echoCount - 1) / 2) * 0.3;
            const angle = Math.atan2(dy, dx) + angleOffset;
            const r = target.radius * (0.7 + Math.random() * 0.6);
            const echoPos = {
              x: target.position.x + Math.cos(angle) * r * 0.3,
              y: target.position.y + Math.sin(angle) * r * 0.3,
            };
            const echo: EchoPoint = {
              id: echoIdCounter++,
              position: echoPos,
              targetId: target.id,
              type: target.type,
              alpha: 1,
              life: 2.5,
              maxLife: 2.5,
              size: target.radius * (0.4 + Math.random() * 0.4),
            };
            this.echoPoints.push(echo);
            newEchos.push(echo);
          }
        }
      }
    }

    for (const echo of this.echoPoints) {
      echo.life -= delta;
      echo.alpha = Math.max(0, echo.life / echo.maxLife);
    }

    this.waves = this.waves.filter((w) => w.active);
    this.echoPoints = this.echoPoints.filter((e) => e.life > 0);

    if (newEchos.length > 0 && this.onEchoGenerated) {
      this.onEchoGenerated(newEchos);
    }

    return { echos: this.echoPoints, discoveredTargetIds: discoveredIds };
  }

  getWaves(): SonarWave[] {
    return this.waves;
  }

  getEchoPoints(): EchoPoint[] {
    return this.echoPoints;
  }

  clear() {
    this.waves = [];
    this.echoPoints = [];
  }
}
