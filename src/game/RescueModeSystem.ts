import type {
  Position,
  RescueCapsule,
  InterferenceZone,
  RescueGameState,
  RescueResult,
  RescueEvent,
  RescuePath,
} from '../types/game';
import { RESCUE_CONFIG } from '../config/gameConfig';
import { SeededRandom } from './SeededRandom';

let nextCapsuleId = 1;
let nextInterferenceId = 1;
let nextWaveId = 1;
let nextPathId = 1;

interface SonarWave {
  id: number;
  position: Position;
  radius: number;
  maxRadius: number;
  speed: number;
  active: boolean;
  alpha: number;
  createdAt: number;
}

interface EchoPoint {
  id: number;
  position: Position;
  capsuleId: number;
  isReal: boolean;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
  signalStrength: number;
}

type RescueEventCallback = (event: RescueEvent) => void;
type StateChangeCallback = (state: RescueGameState) => void;
type GameOverCallback = (result: RescueResult) => void;

export class RescueModeSystem {
  private capsules: RescueCapsule[] = [];
  private interferenceZones: InterferenceZone[] = [];
  private sonarWaves: SonarWave[] = [];
  private echoPoints: EchoPoint[] = [];
  private safePaths: RescuePath[] = [];

  private state: RescueGameState;
  private rng: SeededRandom;
  private lastRechargeTime: number = 0;
  private gameStartTime: number = 0;
  private totalSonarUsed: number = 0;
  private lastTimeWarning: number = -1;

  private onStateChange?: StateChangeCallback;
  private onEvent?: RescueEventCallback;
  private onGameOver?: GameOverCallback;

  constructor() {
    this.rng = new SeededRandom(Date.now() & 0xffffffff);
    this.state = this.createInitialState();
  }

  private createInitialState(): RescueGameState {
    return {
      score: 0,
      timeRemaining: RESCUE_CONFIG.GAME.BASE_TIME,
      totalTime: RESCUE_CONFIG.GAME.BASE_TIME,
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      isVictory: false,
      capsulesFound: 0,
      capsulesRescued: 0,
      totalRealCapsules: 0,
      falseReports: 0,
      maxFalseReports: RESCUE_CONFIG.GAME.MAX_FALSE_REPORTS,
      sonarCharges: RESCUE_CONFIG.SONAR.MAX_CHARGES,
      maxSonarCharges: RESCUE_CONFIG.SONAR.MAX_CHARGES,
      playerPosition: {
        x: RESCUE_CONFIG.MAP_WIDTH / 2,
        y: 100,
      },
      rescueMeter: 0,
      currentLevel: 1,
    };
  }

  setCallbacks(
    onStateChange: StateChangeCallback,
    onEvent?: RescueEventCallback,
    onGameOver?: GameOverCallback
  ) {
    this.onStateChange = onStateChange;
    this.onEvent = onEvent;
    this.onGameOver = onGameOver;
  }

  setSeed(seed: number | null) {
    if (seed !== null) {
      this.rng = new SeededRandom(seed);
    } else {
      this.rng = new SeededRandom(Date.now() & 0xffffffff);
    }
  }

  getState(): RescueGameState {
    return { ...this.state };
  }

  getCapsules(): RescueCapsule[] {
    return this.capsules.map(c => ({ ...c }));
  }

  getInterferenceZones(): InterferenceZone[] {
    return this.interferenceZones.map(z => ({ ...z }));
  }

  getSonarWaves() {
    return this.sonarWaves.map(w => ({ ...w }));
  }

  getEchoPoints() {
    return this.echoPoints.map(e => ({ ...e }));
  }

  getSafePaths(): RescuePath[] {
    return this.safePaths.map(p => ({ ...p }));
  }

  startGame(level: number = 1) {
    this.state = this.createInitialState();
    this.state.currentLevel = Math.min(level, RESCUE_CONFIG.GAME.LEVELS.length);

    const levelConfig = RESCUE_CONFIG.GAME.LEVELS[this.state.currentLevel - 1];
    this.state.totalTime = RESCUE_CONFIG.GAME.BASE_TIME + levelConfig.timeBonus;
    this.state.timeRemaining = this.state.totalTime;
    this.state.maxFalseReports = RESCUE_CONFIG.GAME.MAX_FALSE_REPORTS;

    this.generateLevel(levelConfig);

    this.state.isPlaying = true;
    this.gameStartTime = Date.now();
    this.lastRechargeTime = Date.now();
    this.totalSonarUsed = 0;
    this.lastTimeWarning = -1;

    this.notifyStateChange();
  }

  private generateLevel(config: {
    realCapsules: number;
    decoys: number;
    interferenceZones: number;
  }) {
    this.capsules = [];
    this.interferenceZones = [];
    this.safePaths = [];

    const margin = 100;
    const spawned: { position: Position; radius: number }[] = [];

    const isOverlapping = (pos: Position, radius: number, minDist: number): boolean => {
      for (const s of spawned) {
        const dx = pos.x - s.position.x;
        const dy = pos.y - s.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius + s.radius + minDist) return true;
      }
      return false;
    };

    const randomPos = (): Position => ({
      x: margin + this.rng.nextFloat(0, 1) * (RESCUE_CONFIG.MAP_WIDTH - 2 * margin),
      y: margin + 150 + this.rng.nextFloat(0, 1) * (RESCUE_CONFIG.MAP_HEIGHT - 2 * margin - 150),
    });

    const realNames = [...RESCUE_CONFIG.CAPSULE.REAL_NAMES];
    const decoyNames = [...RESCUE_CONFIG.CAPSULE.DECOY_NAMES];

    for (let i = 0; i < config.realCapsules; i++) {
      let attempts = 0;
      while (attempts < 200) {
        const pos = randomPos();
        const radius = this.rng.nextFloat(
          RESCUE_CONFIG.SCORE.CAPSULE_MIN_RADIUS,
          RESCUE_CONFIG.SCORE.CAPSULE_MAX_RADIUS
        );
        if (!isOverlapping(pos, radius, 80)) {
          const nameIdx = Math.floor(this.rng.next() * realNames.length);
          this.capsules.push({
            id: nextCapsuleId++,
            position: pos,
            radius,
            status: 'unknown',
            isReal: true,
            name: realNames[nameIdx],
            distressSignalStrength: 0.6 + this.rng.nextFloat(0, 0.4),
            discovered: false,
            rescued: false,
          });
          spawned.push({ position: pos, radius });
          this.state.totalRealCapsules++;
          break;
        }
        attempts++;
      }
    }

    for (let i = 0; i < config.decoys; i++) {
      let attempts = 0;
      while (attempts < 200) {
        const pos = randomPos();
        const radius = this.rng.nextFloat(
          RESCUE_CONFIG.SCORE.CAPSULE_MIN_RADIUS,
          RESCUE_CONFIG.SCORE.CAPSULE_MAX_RADIUS
        );
        if (!isOverlapping(pos, radius, 80)) {
          const nameIdx = Math.floor(this.rng.next() * decoyNames.length);
          this.capsules.push({
            id: nextCapsuleId++,
            position: pos,
            radius,
            status: 'unknown',
            isReal: false,
            name: decoyNames[nameIdx],
            distressSignalStrength: 0.2 + this.rng.nextFloat(0, 0.5),
            discovered: false,
            rescued: false,
          });
          spawned.push({ position: pos, radius });
          break;
        }
        attempts++;
      }
    }

    const noiseTypes: Array<'noise' | 'decoy' | 'blocker'> = ['noise', 'decoy', 'blocker'];
    const noiseNames = RESCUE_CONFIG.INTERFERENCE.NOISE_NAMES;
    const decoyZoneNames = RESCUE_CONFIG.INTERFERENCE.DECOY_ZONE_NAMES;
    const blockerNames = RESCUE_CONFIG.INTERFERENCE.BLOCKER_NAMES;

    for (let i = 0; i < config.interferenceZones; i++) {
      let attempts = 0;
      while (attempts < 200) {
        const pos = randomPos();
        const radius = this.rng.nextFloat(
          RESCUE_CONFIG.INTERFERENCE.MIN_RADIUS,
          RESCUE_CONFIG.INTERFERENCE.MAX_RADIUS
        );
        if (!isOverlapping(pos, radius, 100)) {
          const type = noiseTypes[Math.floor(this.rng.next() * noiseTypes.length)];
          let nameList: string[];
          if (type === 'noise') nameList = noiseNames;
          else if (type === 'decoy') nameList = decoyZoneNames;
          else nameList = blockerNames;

          this.interferenceZones.push({
            id: nextInterferenceId++,
            position: pos,
            radius,
            intensity: 0.4 + this.rng.nextFloat(0, 0.6),
            type,
          });
          spawned.push({ position: pos, radius });
          break;
        }
        attempts++;
      }
    }

    this.generateSafePaths();
  }

  private generateSafePaths() {
    this.safePaths = [];
    const realCapsules = this.capsules.filter(c => c.isReal);
    if (realCapsules.length < 2) return;

    const start = this.state.playerPosition;
    const sorted = [...realCapsules].sort(
      (a, b) =>
        Math.hypot(a.position.x - start.x, a.position.y - start.y) -
        Math.hypot(b.position.x - start.x, b.position.y - start.y)
    );

    const points: Position[] = [{ ...start }];
    for (const cap of sorted) {
      points.push({ ...cap.position });
    }

    let dangerLevel = 0;
    for (let i = 0; i < points.length - 1; i++) {
      for (const zone of this.interferenceZones) {
        const dist = this.lineCircleIntersect(
          points[i],
          points[i + 1],
          zone.position,
          zone.radius
        );
        if (dist) dangerLevel += zone.intensity;
      }
    }

    this.safePaths.push({
      id: nextPathId++,
      points,
      isSafe: dangerLevel < 1.5,
      dangerLevel: Math.min(dangerLevel, 5),
    });
  }

  private lineCircleIntersect(
    p1: Position,
    p2: Position,
    center: Position,
    radius: number
  ): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const fx = p1.x - center.x;
    const fy = p1.y - center.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return false;
    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }

  fireSonar(position: Position): boolean {
    if (!this.state.isPlaying || this.state.isGameOver) return false;
    if (this.state.sonarCharges <= 0) return false;

    this.state.sonarCharges--;
    this.totalSonarUsed++;

    this.sonarWaves.push({
      id: nextWaveId++,
      position: { ...position },
      radius: 0,
      maxRadius: RESCUE_CONFIG.SONAR.MAX_RADIUS,
      speed: RESCUE_CONFIG.SONAR.SPEED,
      active: true,
      alpha: 1,
      createdAt: Date.now(),
    });

    this.onEvent?.({ type: 'sonar_fired', position: { ...position } });
    this.notifyStateChange();
    return true;
  }

  private getInterferenceAttenuation(pos: Position): number {
    let attenuation = 1;
    for (const zone of this.interferenceZones) {
      const dx = pos.x - zone.position.x;
      const dy = pos.y - zone.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < zone.radius) {
        const factor = 1 - dist / zone.radius;
        attenuation *= 1 - zone.intensity * factor * RESCUE_CONFIG.SONAR.INTERFERENCE_ATTENUATION;
      }
    }
    return Math.max(0.1, attenuation);
  }

  private checkSonarCollisions(wave: SonarWave) {
    for (const capsule of this.capsules) {
      if (capsule.status === 'rescued' || capsule.discovered) continue;

      const dx = wave.position.x - capsule.position.x;
      const dy = wave.position.y - capsule.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= wave.radius && dist >= wave.radius - 20) {
        const attenuation = this.getInterferenceAttenuation(capsule.position);
        const signalStrength = capsule.distressSignalStrength * attenuation;

        if (signalStrength > 0.3) {
          capsule.discovered = true;
          capsule.status = 'suspected';
          this.state.capsulesFound++;
          this.state.score += RESCUE_CONFIG.SCORE.DETECT_BONUS;

          this.echoPoints.push({
            id: Date.now() + capsule.id,
            position: { ...capsule.position },
            capsuleId: capsule.id,
            isReal: capsule.isReal,
            alpha: Math.min(1, signalStrength * 1.5),
            life: 4,
            maxLife: 4,
            size: capsule.radius,
            signalStrength,
          });

          this.onEvent?.({
            type: 'capsule_detected',
            capsuleId: capsule.id,
            position: { ...capsule.position },
          });
        }
      }
    }
  }

  handleTap(pos: Position): { handled: boolean; capsule?: RescueCapsule } {
    if (!this.state.isPlaying || this.state.isGameOver) return { handled: false };

    for (const capsule of this.capsules) {
      if (capsule.status === 'rescued') continue;

      const dx = pos.x - capsule.position.x;
      const dy = pos.y - capsule.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= capsule.radius + 20 && (capsule.status === 'suspected' || capsule.status === 'confirmed')) {
        return this.processCapsuleInteraction(capsule);
      }
    }

    return { handled: false };
  }

  private processCapsuleInteraction(capsule: RescueCapsule): { handled: boolean; capsule: RescueCapsule } {
    if (capsule.status === 'suspected') {
      if (!capsule.isReal) {
        this.state.falseReports++;
        this.state.score += RESCUE_CONFIG.GAME.FALSE_REPORT_PENALTY;
        capsule.status = 'unknown';
        capsule.discovered = false;

        this.onEvent?.({
          type: 'false_report',
          position: { ...capsule.position },
          penalty: RESCUE_CONFIG.GAME.FALSE_REPORT_PENALTY,
        });

        if (this.state.falseReports >= this.state.maxFalseReports) {
          this.endGame(false);
        }
      } else {
        capsule.status = 'confirmed';
        this.state.score += RESCUE_CONFIG.SCORE.CONFIRM_BONUS;

        this.onEvent?.({
          type: 'capsule_confirmed',
          capsuleId: capsule.id,
          bonus: RESCUE_CONFIG.SCORE.CONFIRM_BONUS,
        });
      }
    } else if (capsule.status === 'confirmed' && capsule.isReal) {
      capsule.status = 'rescued';
      capsule.rescued = true;
      this.state.capsulesRescued++;
      this.state.score += RESCUE_CONFIG.SCORE.RESCUE_BONUS;
      this.state.rescueMeter = Math.min(100, (this.state.capsulesRescued / this.state.totalRealCapsules) * 100);

      this.onEvent?.({
        type: 'rescue_success',
        capsuleId: capsule.id,
        bonus: RESCUE_CONFIG.SCORE.RESCUE_BONUS,
      });

      if (this.state.capsulesRescued >= this.state.totalRealCapsules) {
        this.endGame(true);
      }
    }

    this.notifyStateChange();
    return { handled: true, capsule: { ...capsule } };
  }

  update(deltaTime: number) {
    if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;

    this.state.timeRemaining -= deltaTime;

    if (this.state.timeRemaining <= 30 && this.state.timeRemaining > 0) {
      const warnLevel = Math.floor(this.state.timeRemaining / 10);
      if (warnLevel !== this.lastTimeWarning) {
        this.lastTimeWarning = warnLevel;
        this.onEvent?.({ type: 'time_warning', remaining: Math.ceil(this.state.timeRemaining) });
      }
    }

    if (this.state.timeRemaining <= 0) {
      this.state.timeRemaining = 0;
      this.endGame(false);
      return;
    }

    for (const wave of this.sonarWaves) {
      if (!wave.active) continue;
      wave.radius += wave.speed * deltaTime;
      this.checkSonarCollisions(wave);

      if (wave.radius >= wave.maxRadius) {
        wave.active = false;
        wave.alpha = 0;
      } else {
        wave.alpha = 1 - wave.radius / wave.maxRadius;
      }
    }
    this.sonarWaves = this.sonarWaves.filter(w => w.active || w.alpha > 0);

    for (const echo of this.echoPoints) {
      echo.life -= deltaTime;
      echo.alpha = Math.max(0, echo.life / echo.maxLife);
    }
    this.echoPoints = this.echoPoints.filter(e => e.life > 0);

    const now = Date.now();
    if (now - this.lastRechargeTime >= RESCUE_CONFIG.SONAR.RECHARGE_TIME) {
      if (this.state.sonarCharges < this.state.maxSonarCharges) {
        this.state.sonarCharges++;
        this.lastRechargeTime = now;
      }
    }

    this.notifyStateChange();
  }

  pause() {
    this.state.isPaused = true;
    this.notifyStateChange();
  }

  resume() {
    this.state.isPaused = false;
    this.notifyStateChange();
  }

  private endGame(victory: boolean) {
    this.state.isPlaying = false;
    this.state.isGameOver = true;
    this.state.isVictory = victory;

    const result = this.calculateResult(victory);
    this.onEvent?.({ type: 'game_over', result });
    this.onGameOver?.(result);
    this.notifyStateChange();
  }

  private calculateResult(victory: boolean): RescueResult {
    const timeBonus = victory
      ? Math.floor(this.state.timeRemaining * RESCUE_CONFIG.SCORE.TIME_BONUS_PER_SEC)
      : 0;

    const totalAttempts = this.state.capsulesRescued + this.state.falseReports;
    const accuracy =
      totalAttempts > 0
        ? Math.round((this.state.capsulesRescued / Math.max(1, this.state.totalRealCapsules)) * 100)
        : 0;

    const perfectBonus =
      victory && this.state.falseReports === 0 ? RESCUE_CONFIG.SCORE.PERFECT_RESCUE_BONUS : 0;
    const accuracyBonus = accuracy >= 80 ? RESCUE_CONFIG.SCORE.ACCURACY_BONUS : 0;

    const finalScore = this.state.score + timeBonus + perfectBonus + accuracyBonus;

    let rank: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
    if (victory) {
      const rescueRate = this.state.capsulesRescued / Math.max(1, this.state.totalRealCapsules);
      if (rescueRate >= 1 && accuracy >= 90 && this.state.timeRemaining > 60) rank = 'S';
      else if (rescueRate >= 0.8 && accuracy >= 75) rank = 'A';
      else if (rescueRate >= 0.6 && accuracy >= 60) rank = 'B';
      else if (rescueRate >= 0.4) rank = 'C';
      else rank = 'D';
    } else {
      const rescueRate = this.state.capsulesRescued / Math.max(1, this.state.totalRealCapsules);
      if (rescueRate >= 0.8) rank = 'C';
      else if (rescueRate >= 0.5) rank = 'D';
    }

    const rescuePoints = Math.floor(
      finalScore * 0.1 + this.state.capsulesRescued * 20 + (victory ? 100 : 0)
    );

    return {
      victory,
      score: finalScore,
      capsulesRescued: this.state.capsulesRescued,
      totalRealCapsules: this.state.totalRealCapsules,
      falseReports: this.state.falseReports,
      timeRemaining: Math.ceil(this.state.timeRemaining),
      totalTime: this.state.totalTime,
      sonarUsed: this.totalSonarUsed,
      level: this.state.currentLevel,
      accuracy,
      rank,
      rescuePoints,
    };
  }

  private notifyStateChange() {
    this.onStateChange?.({ ...this.state });
  }
}
