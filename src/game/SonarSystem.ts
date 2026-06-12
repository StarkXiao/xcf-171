import type { Position, SonarWave, EchoPoint, Target } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

let waveIdCounter = 1;
let echoIdCounter = 1;

export class SonarSystem {
  private waves: SonarWave[] = [];
  private echoPoints: EchoPoint[] = [];
  private onEchoGenerated?: (echos: EchoPoint[]) => void;
  private maxRadius: number = GAME_CONFIG.SONAR.MAX_RADIUS;
  private speed: number = GAME_CONFIG.SONAR.SPEED;
  private precisionBonus: number = 0;
  private echoRangeMul: number = 1.0;
  private echoCountMul: number = 1.0;
  private echoLifeMul: number = 1.0;
  private echoSizeMul: number = 1.0;
  private discoveryEfficiencyMul: number = 1.0;

  setParams(maxRadius: number, speed: number, precisionBonus: number = 0) {
    this.maxRadius = maxRadius;
    this.speed = speed;
    this.precisionBonus = precisionBonus;
  }

  setDetectorParams(
    echoRangeMul: number = 1.0,
    echoCountMul: number = 1.0,
    echoLifeMul: number = 1.0,
    echoSizeMul: number = 1.0,
    discoveryEfficiencyMul: number = 1.0
  ) {
    this.echoRangeMul = echoRangeMul;
    this.echoCountMul = echoCountMul;
    this.echoLifeMul = echoLifeMul;
    this.echoSizeMul = echoSizeMul;
    this.discoveryEfficiencyMul = discoveryEfficiencyMul;
  }

  setEchoCallback(callback: (echos: EchoPoint[]) => void) {
    this.onEchoGenerated = callback;
  }

  emitSonar(position: Position): boolean {
    const wave: SonarWave = {
      id: waveIdCounter++,
      position: { ...position },
      radius: 0,
      maxRadius: this.maxRadius * this.echoRangeMul,
      speed: this.speed,
      active: true,
      alpha: 1,
    };
    this.waves.push(wave);
    return true;
  }

  update(delta: number, targets: Target[]): { echos: EchoPoint[]; discoveredTargetIds: number[]; discoveredPositions: Position[]; suspectedTargetIds: number[]; confirmedTargetIds: number[] } {
    const newEchos: EchoPoint[] = [];
    const discoveredIds: number[] = [];
    const discoveredPositions: Position[] = [];
    const suspectedIds: number[] = [];
    const confirmedIds: number[] = [];

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
        if (target.collected) continue;

        const dx = target.position.x - wave.position.x;
        const dy = target.position.y - wave.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= prevRadius - target.radius && dist <= wave.radius + target.radius) {
          if (Math.random() > this.discoveryEfficiencyMul && this.discoveryEfficiencyMul < 1) {
            continue;
          }

          if (target.type === 'danger') {
            if (target.dangerPhase === 'undetected' || !target.dangerPhase) {
              target.dangerPhase = 'suspected';
              suspectedIds.push(target.id);

              const rawEchoCount = 1 * this.echoCountMul;
              const echoCount = Math.max(1, Math.floor(rawEchoCount));
              const extraEchoChance = rawEchoCount - echoCount;
              const totalEchoes = echoCount + (Math.random() < extraEchoChance ? 1 : 0);
              const baseLife = 2.5 * this.echoLifeMul;

              for (let i = 0; i < totalEchoes; i++) {
                const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
                const r = target.radius * (1.2 + Math.random() * 0.8);
                const echoPos = {
                  x: target.position.x + Math.cos(angle) * r * 0.5,
                  y: target.position.y + Math.sin(angle) * r * 0.5,
                };
                const echo: EchoPoint = {
                  id: echoIdCounter++,
                  position: echoPos,
                  targetId: target.id,
                  type: 'danger',
                  alpha: 0.6,
                  life: baseLife * 0.7,
                  maxLife: baseLife * 0.7,
                  size: target.radius * (0.3 + Math.random() * 0.3) * this.echoSizeMul,
                  isSuspected: true,
                };
                this.echoPoints.push(echo);
                newEchos.push(echo);
              }
            } else if (target.dangerPhase === 'suspected') {
              target.dangerPhase = 'confirmed';
              target.discovered = true;
              discoveredIds.push(target.id);
              discoveredPositions.push({ ...target.position });
              confirmedIds.push(target.id);

              const baseEchoCount = 2;
              const rawEchoCount = baseEchoCount * this.echoCountMul;
              const echoCount = Math.max(1, Math.floor(rawEchoCount));
              const extraEchoChance = rawEchoCount - echoCount;
              const totalEchoes = echoCount + (Math.random() < extraEchoChance ? 1 : 0);
              const baseLife = 2.5 * this.echoLifeMul;

              for (let i = 0; i < totalEchoes; i++) {
                const angleOffset = (i - (totalEchoes - 1) / 2) * 0.3;
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
                  type: 'danger',
                  alpha: 1,
                  life: baseLife,
                  maxLife: baseLife,
                  size: target.radius * (0.4 + Math.random() * 0.4) * this.echoSizeMul,
                  isSuspected: false,
                };
                this.echoPoints.push(echo);
                newEchos.push(echo);
              }
            }
          } else {
            if (target.discovered) continue;

            target.discovered = true;
            discoveredIds.push(target.id);
            discoveredPositions.push({ ...target.position });

            const baseEchoCount = target.type === 'wreck' ? 3 : 1;
            const rawEchoCount = baseEchoCount * this.echoCountMul;
            const echoCount = Math.max(1, Math.floor(rawEchoCount));
            const extraEchoChance = rawEchoCount - echoCount;
            const totalEchoes = echoCount + (Math.random() < extraEchoChance ? 1 : 0);
            const baseLife = 2.5 * this.echoLifeMul;

            for (let i = 0; i < totalEchoes; i++) {
              const angleOffset = (i - (totalEchoes - 1) / 2) * 0.3;
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
                life: baseLife,
                maxLife: baseLife,
                size: target.radius * (0.4 + Math.random() * 0.4) * this.echoSizeMul,
              };
              this.echoPoints.push(echo);
              newEchos.push(echo);
            }
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

    return { echos: this.echoPoints, discoveredTargetIds: discoveredIds, discoveredPositions, suspectedTargetIds: suspectedIds, confirmedTargetIds: confirmedIds };
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
