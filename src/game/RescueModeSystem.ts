import type {
  Position,
  RescueCapsule,
  InterferenceZone,
  RescueGameState,
  RescueResult,
  RescueEvent,
  RescuePath,
  PathViolation,
  PathSafetyLevel,
  PathFollowStatus,
} from '../types/game';
import { RESCUE_CONFIG } from '../config/gameConfig';
import { SeededRandom } from './SeededRandom';
import { VoyageArchiveSystem, type ActiveVoyageBuilder } from './VoyageArchiveSystem';

let nextCapsuleId = 1;
let nextInterferenceId = 1;
let nextWaveId = 1;
let nextPathId = 1;
let nextViolationId = 1;
let nextEchoId = 1;

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
  private pathViolations: PathViolation[] = [];

  private state: RescueGameState;
  private rng: SeededRandom;
  private lastRechargeTime: number = 0;
  private gameStartTime: number = 0;
  private totalSonarUsed: number = 0;
  private lastTimeWarning: number = -1;
  private lastYawWarning: number = -1;

  private offtrackCount: number = 0;
  private highRiskIncursions: number = 0;
  private blockerCollisions: number = 0;
  private wasOfftrack: boolean = false;
  private currentHighRiskZoneId: number | null = null;

  private moveTarget: Position | null = null;
  private lastProgressBonusAt: number = 0;

  private onStateChange?: StateChangeCallback;
  private onEvent?: RescueEventCallback;
  private onGameOver?: GameOverCallback;

  private voyageArchive: VoyageArchiveSystem;
  private activeVoyage: ActiveVoyageBuilder | null = null;
  private lastTrajectoryTime: number = 0;
  private discoveredCapsulesBefore: number = 0;

  constructor(voyageArchiveSystem?: VoyageArchiveSystem) {
    this.rng = new SeededRandom(Date.now() & 0xffffffff);
    this.state = this.createInitialState();
    this.voyageArchive = voyageArchiveSystem ?? new VoyageArchiveSystem();
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
      path: {
        activePathId: null,
        followStatus: 'idle',
        currentTargetCapsuleId: null,
        yawWarnings: 0,
        maxYawWarnings: RESCUE_CONFIG.PATH.MAX_YAW_WARNINGS,
        distanceFromPath: 0,
        maxAllowedDeviation: RESCUE_CONFIG.PATH.MAX_ALLOWED_DEVIATION,
        pathBonus: 0,
        totalPathBonus: 0,
        safeDistanceTraveled: 0,
        totalPathLength: 0,
        pathCompletionRate: 0,
        currentSafetyLevel: 'safe',
        isInHighRiskZone: false,
        isInBlockerZone: false,
      },
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

  getPathViolations(): PathViolation[] {
    return this.pathViolations.map(v => ({ ...v }));
  }

  getMoveTarget(): Position | null {
    return this.moveTarget ? { ...this.moveTarget } : null;
  }

  startGame(level: number = 1) {
    this.state = this.createInitialState();
    this.state.currentLevel = Math.min(level, RESCUE_CONFIG.GAME.LEVELS.length);

    const levelConfig = RESCUE_CONFIG.GAME.LEVELS[this.state.currentLevel - 1];
    this.state.totalTime = RESCUE_CONFIG.GAME.BASE_TIME + levelConfig.timeBonus;
    this.state.timeRemaining = this.state.totalTime;
    this.state.maxFalseReports = RESCUE_CONFIG.GAME.MAX_FALSE_REPORTS;

    this.offtrackCount = 0;
    this.highRiskIncursions = 0;
    this.blockerCollisions = 0;
    this.wasOfftrack = false;
    this.currentHighRiskZoneId = null;
    this.moveTarget = null;
    this.lastProgressBonusAt = 0;
    this.pathViolations = [];

    this.generateLevel(levelConfig);

    this.activeVoyage = this.voyageArchive.startRescueVoyage(level);
    this.activeVoyage.hitRate.totalTargets = this.capsules.length;
    this.voyageArchive.recordTargetInfo(this.capsules.length);
    this.lastTrajectoryTime = Date.now();
    this.discoveredCapsulesBefore = 0;

    this.state.isPlaying = true;
    this.gameStartTime = Date.now();
    this.lastRechargeTime = Date.now();
    this.totalSonarUsed = 0;
    this.lastTimeWarning = -1;
    this.lastYawWarning = -1;

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
  }

  private generateIndividualPath(capsule: RescueCapsule): RescuePath {
    const start = this.state.playerPosition;
    const points: Position[] = [];

    points.push({ ...start });

    const blockerZones = this.interferenceZones.filter(z => z.type === 'blocker');
    let currentPos = { ...start };
    const targetPos = { ...capsule.position };
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const directPathBlocked = blockerZones.some(zone =>
        this.lineCircleIntersect(currentPos, targetPos, zone.position, zone.radius)
      );

      if (!directPathBlocked) {
        break;
      }

      let bestWaypoint: Position | null = null;
      let bestClearance = -1;

      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const dist = 100 + attempt * 50;
        const candidate = {
          x: currentPos.x + Math.cos(rad) * dist,
          y: currentPos.y + Math.sin(rad) * dist,
        };

        candidate.x = Math.max(50, Math.min(RESCUE_CONFIG.MAP_WIDTH - 50, candidate.x));
        candidate.y = Math.max(150, Math.min(RESCUE_CONFIG.MAP_HEIGHT - 50, candidate.y));

        const seg1Blocked = blockerZones.some(zone =>
          this.lineCircleIntersect(currentPos, candidate, zone.position, zone.radius)
        );
        if (seg1Blocked) continue;

        let minDistToBlocker = Infinity;
        for (const zone of blockerZones) {
          const d = Math.hypot(candidate.x - zone.position.x, candidate.y - zone.position.y) - zone.radius;
          minDistToBlocker = Math.min(minDistToBlocker, d);
        }

        if (minDistToBlocker > bestClearance) {
          bestClearance = minDistToBlocker;
          bestWaypoint = candidate;
        }
      }

      if (bestWaypoint) {
        points.push(bestWaypoint);
        currentPos = bestWaypoint;
      } else {
        break;
      }
    }

    points.push(targetPos);

    let dangerLevel = 0;
    let safetyLevel: PathSafetyLevel = 'safe';
    let crossesBlocker = false;

    for (let i = 0; i < points.length - 1; i++) {
      for (const zone of this.interferenceZones) {
        const intersects = this.lineCircleIntersect(
          points[i],
          points[i + 1],
          zone.position,
          zone.radius
        );
        if (intersects) {
          if (zone.type === 'blocker') {
            crossesBlocker = true;
            safetyLevel = 'blocked';
          }
          dangerLevel += zone.intensity;
        }
      }
    }

    if (!crossesBlocker) {
      if (dangerLevel >= RESCUE_CONFIG.PATH.HIGH_RISK_THRESHOLD * 3) {
        safetyLevel = 'high_risk';
      } else if (dangerLevel >= RESCUE_CONFIG.PATH.HIGH_RISK_THRESHOLD * 2) {
        safetyLevel = 'danger';
      } else if (dangerLevel >= RESCUE_CONFIG.PATH.HIGH_RISK_THRESHOLD) {
        safetyLevel = 'caution';
      } else {
        safetyLevel = 'safe';
      }
    }

    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalLength += Math.hypot(
        points[i + 1].x - points[i].x,
        points[i + 1].y - points[i].y
      );
    }

    return {
      id: nextPathId++,
      points,
      isSafe: safetyLevel === 'safe' || safetyLevel === 'caution',
      dangerLevel: Math.min(dangerLevel, 5),
      targetCapsuleId: capsule.id,
      safetyLevel,
      active: false,
      completed: false,
      progress: 0,
      currentSegment: 0,
    };
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

  private distanceToPath(pos: Position, path: RescuePath): { distance: number; closestPoint: Position; segmentIndex: number } {
    let minDist = Infinity;
    let closestPoint: Position = { x: 0, y: 0 };
    let closestSegment = 0;

    for (let i = 0; i < path.points.length - 1; i++) {
      const p1 = path.points[i];
      const p2 = path.points[i + 1];
      const result = this.closestPointOnSegment(pos, p1, p2);
      if (result.distance < minDist) {
        minDist = result.distance;
        closestPoint = result.point;
        closestSegment = i;
      }
    }

    return { distance: minDist, closestPoint, segmentIndex: closestSegment };
  }

  private closestPointOnSegment(
    pos: Position,
    p1: Position,
    p2: Position
  ): { point: Position; distance: number; t: number } {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      const d = Math.hypot(pos.x - p1.x, pos.y - p1.y);
      return { point: { ...p1 }, distance: d, t: 0 };
    }

    let t = ((pos.x - p1.x) * dx + (pos.y - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const px = p1.x + t * dx;
    const py = p1.y + t * dy;
    const d = Math.hypot(pos.x - px, pos.y - py);

    return { point: { x: px, y: py }, distance: d, t };
  }

  private calculatePathProgress(path: RescuePath, currentPos: Position): number {
    if (path.points.length < 2) return 0;

    let totalLength = 0;
    let coveredLength = 0;
    let onLastSegment = false;

    for (let i = 0; i < path.points.length - 1; i++) {
      const segLen = Math.hypot(
        path.points[i + 1].x - path.points[i].x,
        path.points[i + 1].y - path.points[i].y
      );

      if (i === path.points.length - 2) {
        onLastSegment = true;
      }

      const closest = this.closestPointOnSegment(currentPos, path.points[i], path.points[i + 1]);
      if (closest.t > 0 && closest.t < 1 && closest.distance < 100) {
        coveredLength += segLen * closest.t;
        totalLength += segLen;
        break;
      } else if (i === path.currentSegment) {
        coveredLength += segLen * closest.t;
        totalLength += segLen;
        break;
      } else {
        coveredLength += segLen;
      }
      totalLength += segLen;
    }

    return totalLength > 0 ? Math.min(1, coveredLength / totalLength) : 0;
  }

  assignPathToCapsule(capsuleId: number): RescuePath | null {
    const capsule = this.capsules.find(c => c.id === capsuleId);
    if (!capsule || !capsule.isReal || capsule.status !== 'confirmed') {
      return null;
    }

    const existingPath = this.safePaths.find(p => p.targetCapsuleId === capsuleId);
    if (existingPath) {
      existingPath.active = true;
      existingPath.progress = 0;
      existingPath.currentSegment = 0;
      existingPath.completed = false;
    } else {
      const newPath = this.generateIndividualPath(capsule);
      newPath.active = true;
      this.safePaths.push(newPath);
    }

    const path = existingPath || this.safePaths[this.safePaths.length - 1];

    for (const p of this.safePaths) {
      if (p.id !== path.id) {
        p.active = false;
      }
    }

    this.state.path.activePathId = path.id;
    this.state.path.currentTargetCapsuleId = capsuleId;
    this.state.path.followStatus = 'following';
    this.state.path.totalPathLength = this.calculatePathTotalLength(path);
    this.state.path.safeDistanceTraveled = 0;
    this.state.path.pathCompletionRate = 0;
    this.state.path.pathBonus = 0;
    this.state.path.yawWarnings = 0;
    this.state.path.currentSafetyLevel = path.safetyLevel;
    this.lastProgressBonusAt = 0;

    this.onEvent?.({ type: 'path_assigned', pathId: path.id, capsuleId });
    this.onEvent?.({ type: 'path_start', pathId: path.id, capsuleId });
    this.notifyStateChange();

    return { ...path };
  }

  private calculatePathTotalLength(path: RescuePath): number {
    let len = 0;
    for (let i = 0; i < path.points.length - 1; i++) {
      len += Math.hypot(
        path.points[i + 1].x - path.points[i].x,
        path.points[i + 1].y - path.points[i].y
      );
    }
    return len;
  }

  startFollowingPath(pathId: number): boolean {
    const path = this.safePaths.find(p => p.id === pathId);
    if (!path || !path.active || path.completed) return false;

    const capsule = this.capsules.find(c => c.id === path.targetCapsuleId);
    if (!capsule || capsule.status !== 'confirmed') return false;

    this.state.path.followStatus = 'following';
    this.lastProgressBonusAt = 0;

    this.onEvent?.({ type: 'path_start', pathId, capsuleId: path.targetCapsuleId });
    this.notifyStateChange();
    return true;
  }

  stopFollowingPath(): void {
    this.state.path.followStatus = 'idle';
    this.moveTarget = null;
    this.state.path.activePathId = null;
    this.state.path.currentTargetCapsuleId = null;

    for (const p of this.safePaths) {
      p.active = false;
    }

    this.notifyStateChange();
  }

  setMoveTarget(pos: Position): boolean {
    if (!this.state.isPlaying || this.state.isGameOver || this.state.isPaused) return false;

    this.moveTarget = { ...pos };
    return true;
  }

  private movePlayer(deltaTime: number): void {
    if (!this.moveTarget) return;

    const activePath = this.safePaths.find(p => p.id === this.state.path.activePathId);
    const targetPos = this.moveTarget;

    const dx = targetPos.x - this.state.playerPosition.x;
    const dy = targetPos.y - this.state.playerPosition.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 5) {
      this.moveTarget = null;
      return;
    }

    const speed = RESCUE_CONFIG.PATH.PLAYER_SPEED * deltaTime;
    const moveDist = Math.min(speed, dist);
    const ux = dx / dist;
    const uy = dy / dist;

    const newPos = {
      x: this.state.playerPosition.x + ux * moveDist,
      y: this.state.playerPosition.y + uy * moveDist,
    };

    newPos.x = Math.max(20, Math.min(RESCUE_CONFIG.MAP_WIDTH - 20, newPos.x));
    newPos.y = Math.max(80, Math.min(RESCUE_CONFIG.MAP_HEIGHT - 20, newPos.y));

    this.state.playerPosition = newPos;

    if (activePath && this.state.path.followStatus !== 'idle' && this.state.path.followStatus !== 'reached') {
      this.state.path.safeDistanceTraveled += moveDist;
      activePath.progress = this.calculatePathProgress(activePath, newPos);
      this.state.path.pathCompletionRate = activePath.progress;

      const progressBonusThreshold = 100;
      if (this.state.path.safeDistanceTraveled - this.lastProgressBonusAt >= progressBonusThreshold) {
        const bonus = RESCUE_CONFIG.PATH.PATH_PROGRESS_BONUS_PER_100PX;
        this.state.score += bonus;
        this.state.path.pathBonus += bonus;
        this.lastProgressBonusAt = this.state.path.safeDistanceTraveled;

        this.onEvent?.({
          type: 'path_progress',
          pathId: activePath.id,
          progress: activePath.progress,
          bonus,
        });
      }

      const targetCapsule = this.capsules.find(c => c.id === activePath.targetCapsuleId);
      if (targetCapsule && targetCapsule.status === 'confirmed') {
        const distToCapsule = Math.hypot(
          this.state.playerPosition.x - targetCapsule.position.x,
          this.state.playerPosition.y - targetCapsule.position.y
        );
        if (distToCapsule < targetCapsule.radius + 30) {
          this.completePath(activePath);
          this.moveTarget = null;
        }
      }
    }
  }

  private completePath(path: RescuePath): void {
    path.completed = true;
    path.active = false;

    let bonus = RESCUE_CONFIG.PATH.SAFE_PATH_BONUS;
    const perfect = this.offtrackCount === 0 && this.highRiskIncursions === 0 && this.blockerCollisions === 0;
    if (perfect) {
      bonus += RESCUE_CONFIG.PATH.PERFECT_PATH_BONUS;
    }

    this.state.score += bonus;
    this.state.path.totalPathBonus += this.state.path.pathBonus + bonus;
    this.state.path.followStatus = 'reached';

    this.onEvent?.({
      type: 'path_complete',
      pathId: path.id,
      bonus,
      perfect,
    });

    this.notifyStateChange();
  }

  private checkPathViolations(): void {
    const activePath = this.safePaths.find(p => p.id === this.state.path.activePathId);
    if (!activePath || this.state.path.followStatus === 'idle' || this.state.path.followStatus === 'reached') {
      this.state.path.distanceFromPath = 0;
      this.state.path.isInHighRiskZone = false;
      this.state.path.isInBlockerZone = false;
      return;
    }

    const pathInfo = this.distanceToPath(this.state.playerPosition, activePath);
    this.state.path.distanceFromPath = pathInfo.distance;
    activePath.currentSegment = pathInfo.segmentIndex;

    if (pathInfo.distance > RESCUE_CONFIG.PATH.WARNING_DEVIATION) {
      if (!this.wasOfftrack && pathInfo.distance > RESCUE_CONFIG.PATH.MAX_ALLOWED_DEVIATION) {
        this.handleOfftrack(pathInfo.distance);
      }
    } else if (this.wasOfftrack && pathInfo.distance < RESCUE_CONFIG.PATH.WARNING_DEVIATION * 0.5) {
      this.wasOfftrack = false;
      const bonus = RESCUE_CONFIG.PATH.RETURN_TO_PATH_BONUS;
      this.state.score += bonus;
      this.onEvent?.({ type: 'path_return', bonus });
    }

    let inHighRisk = false;
    let inBlocker = false;
    let highRiskZoneId: number | null = null;

    for (const zone of this.interferenceZones) {
      const dist = Math.hypot(
        this.state.playerPosition.x - zone.position.x,
        this.state.playerPosition.y - zone.position.y
      );

      if (dist < zone.radius * 0.7) {
        if (zone.type === 'blocker') {
          inBlocker = true;
          if (!this.state.path.isInBlockerZone) {
            this.handleBlockerCollision(zone.id);
          }
        } else if (zone.intensity >= RESCUE_CONFIG.PATH.HIGH_RISK_THRESHOLD) {
          inHighRisk = true;
          highRiskZoneId = zone.id;
          if (!this.state.path.isInHighRiskZone) {
            this.handleHighRiskEnter(zone.id);
          }
        }
      }
    }

    if (this.state.path.isInHighRiskZone && !inHighRisk && this.currentHighRiskZoneId !== null) {
      this.onEvent?.({ type: 'high_risk_exit', zoneId: this.currentHighRiskZoneId });
      this.currentHighRiskZoneId = null;
    }

    this.state.path.isInHighRiskZone = inHighRisk;
    this.state.path.isInBlockerZone = inBlocker;
    this.currentHighRiskZoneId = highRiskZoneId;

    let safetyLevel: PathSafetyLevel = activePath.safetyLevel;
    if (inBlocker) safetyLevel = 'blocked';
    else if (inHighRisk) safetyLevel = 'high_risk';
    else if (pathInfo.distance > RESCUE_CONFIG.PATH.MAX_ALLOWED_DEVIATION) safetyLevel = 'danger';
    else if (pathInfo.distance > RESCUE_CONFIG.PATH.WARNING_DEVIATION) safetyLevel = 'caution';
    this.state.path.currentSafetyLevel = safetyLevel;
  }

  private handleOfftrack(distance: number): void {
    this.wasOfftrack = true;
    this.offtrackCount++;

    const timePenalty = RESCUE_CONFIG.PATH.OFFTRACK_TIME_PENALTY;
    const scorePenalty = RESCUE_CONFIG.PATH.OFFTRACK_SCORE_PENALTY;

    this.state.timeRemaining = Math.max(0, this.state.timeRemaining - timePenalty);
    this.state.score += scorePenalty;
    this.state.path.yawWarnings++;

    if (this.activeVoyage) {
      this.voyageArchive.addAnomaly({
        type: 'path_offtrack',
        position: { ...this.state.playerPosition },
        description: `偏航 ${Math.round(distance)}px，第 ${this.offtrackCount} 次`,
        severity: this.state.path.yawWarnings >= this.state.path.maxYawWarnings ? 'critical' : 'medium',
        data: { distance, count: this.offtrackCount },
      });
    }

    this.pathViolations.push({
      id: nextViolationId++,
      type: 'offtrack',
      position: { ...this.state.playerPosition },
      time: Date.now(),
      timePenalty,
      scorePenalty,
    });

    const remaining = this.state.path.maxYawWarnings - this.state.path.yawWarnings;
    const isWarning = remaining > 0;

    this.onEvent?.({
      type: 'path_offtrack',
      distance,
      penalty: scorePenalty,
      warning: isWarning,
    });

    if (isWarning) {
      const warnLevel = Math.floor(remaining);
      if (warnLevel !== this.lastYawWarning) {
        this.lastYawWarning = warnLevel;
        if (this.activeVoyage) {
          this.voyageArchive.addAnomaly({
            type: 'yaw_warning',
            position: { ...this.state.playerPosition },
            description: `偏航警告，剩余 ${remaining} 次`,
            severity: 'high',
            data: { remaining },
          });
        }
        this.onEvent?.({ type: 'yaw_warning', remaining });
      }
    }

    if (this.state.path.yawWarnings >= this.state.path.maxYawWarnings) {
      if (this.activeVoyage) {
        this.voyageArchive.addAnomaly({
          type: 'yaw_failure',
          position: { ...this.state.playerPosition },
          description: '偏航次数超限，任务失败',
          severity: 'critical',
        });
      }
      this.onEvent?.({ type: 'yaw_failure' });
      this.endGame(false);
      return;
    }

    if (this.state.timeRemaining <= 0) {
      this.endGame(false);
    }
  }

  private handleHighRiskEnter(zoneId: number): void {
    this.highRiskIncursions++;

    const timePenalty = RESCUE_CONFIG.PATH.HIGHRISK_TIME_PENALTY;
    const scorePenalty = RESCUE_CONFIG.PATH.HIGHRISK_SCORE_PENALTY;

    this.state.timeRemaining = Math.max(0, this.state.timeRemaining - timePenalty);
    this.state.score += scorePenalty;

    if (this.activeVoyage) {
      this.voyageArchive.addAnomaly({
        type: 'high_risk_enter',
        position: { ...this.state.playerPosition },
        description: `进入高危区，第 ${this.highRiskIncursions} 次`,
        severity: 'high',
        data: { zoneId, count: this.highRiskIncursions },
      });
    }

    this.pathViolations.push({
      id: nextViolationId++,
      type: 'high_risk_zone',
      position: { ...this.state.playerPosition },
      time: Date.now(),
      timePenalty,
      scorePenalty,
    });

    this.onEvent?.({
      type: 'high_risk_enter',
      zoneId,
      penalty: scorePenalty,
    });

    if (this.state.timeRemaining <= 0) {
      this.endGame(false);
    }
  }

  private handleBlockerCollision(zoneId: number): void {
    this.blockerCollisions++;

    const timePenalty = RESCUE_CONFIG.PATH.BLOCKER_TIME_PENALTY;
    const scorePenalty = RESCUE_CONFIG.PATH.BLOCKER_SCORE_PENALTY;

    this.state.timeRemaining = Math.max(0, this.state.timeRemaining - timePenalty);
    this.state.score += scorePenalty;

    if (this.activeVoyage) {
      this.voyageArchive.addAnomaly({
        type: 'blocker_collision',
        position: { ...this.state.playerPosition },
        description: `阻断区碰撞，第 ${this.blockerCollisions} 次`,
        severity: 'critical',
        data: { zoneId, count: this.blockerCollisions },
      });
    }

    this.pathViolations.push({
      id: nextViolationId++,
      type: 'blocker_zone',
      position: { ...this.state.playerPosition },
      time: Date.now(),
      timePenalty,
      scorePenalty,
    });

    this.onEvent?.({
      type: 'blocker_collision',
      zoneId,
      penalty: scorePenalty,
    });

    if (this.blockerCollisions >= 2) {
      this.endGame(false);
    } else if (this.state.timeRemaining <= 0) {
      this.endGame(false);
    }
  }

  fireSonar(position: Position): boolean {
    if (!this.state.isPlaying || this.state.isGameOver) return false;
    if (this.state.sonarCharges <= 0) return false;

    this.state.sonarCharges--;
    this.totalSonarUsed++;
    this.discoveredCapsulesBefore = this.state.capsulesFound;

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

    setTimeout(() => {
      const discoveredAfter = this.state.capsulesFound;
      if (this.activeVoyage) {
        this.voyageArchive.recordSonarFired(position, this.discoveredCapsulesBefore, discoveredAfter);
        if (discoveredAfter === this.discoveredCapsulesBefore) {
          this.voyageArchive.recordEmptySonar(position);
        }
      }
    }, 1000);

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
            id: nextEchoId++,
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

  handleTap(pos: Position): { handled: boolean; capsule?: RescueCapsule; path?: RescuePath } {
    if (!this.state.isPlaying || this.state.isGameOver) return { handled: false };

    for (const capsule of this.capsules) {
      if (capsule.status === 'rescued') continue;

      const dx = pos.x - capsule.position.x;
      const dy = pos.y - capsule.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= capsule.radius + 20) {
        if (this.activeVoyage) {
          this.voyageArchive.recordTap(pos, true);
        }
        if (capsule.status === 'confirmed' && capsule.isReal && this.state.path.followStatus === 'reached') {
          const activePath = this.safePaths.find(p => p.targetCapsuleId === capsule.id && p.completed);
          if (activePath) {
            const result = this.processCapsuleInteraction(capsule);
            this.stopFollowingPath();
            return result;
          }
        }
        return this.processCapsuleInteraction(capsule);
      }
    }

    if (this.activeVoyage) {
      this.voyageArchive.recordTap(pos, false);
    }
    return { handled: false };
  }

  private processCapsuleInteraction(capsule: RescueCapsule): { handled: boolean; capsule: RescueCapsule; path?: RescuePath } {
    if (capsule.status === 'suspected') {
      if (!capsule.isReal) {
        this.state.falseReports++;
        this.state.score += RESCUE_CONFIG.GAME.FALSE_REPORT_PENALTY;
        capsule.status = 'unknown';
        capsule.discovered = false;

        if (this.activeVoyage) {
          this.voyageArchive.addAnomaly({
            type: 'false_report',
            position: capsule.position,
            description: `误报：${capsule.name}`,
            severity: 'medium',
            data: { capsule: capsule.name },
          });
        }

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

        const path = this.assignPathToCapsule(capsule.id);
        if (path) {
          return { handled: true, capsule: { ...capsule }, path };
        }
      }
    } else if (capsule.status === 'confirmed' && capsule.isReal) {
      const activePath = this.safePaths.find(p => p.targetCapsuleId === capsule.id);
      if (activePath && activePath.completed) {
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

    this.movePlayer(deltaTime);
    this.checkPathViolations();

    const now = Date.now();
    if (now - this.lastTrajectoryTime >= 200 && this.activeVoyage) {
      this.voyageArchive.recordTrajectory(this.state.playerPosition);
      this.lastTrajectoryTime = now;
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

    if (this.activeVoyage) {
      this.voyageArchive.recordDiscovered(this.state.capsulesFound);
    }

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
    if (this.activeVoyage) {
      const dummyGameState: any = {
        score: result.score,
        lives: victory ? 1 : 0,
        level: result.level,
        isPlaying: false,
        isPaused: false,
        isGameOver: true,
        sonarCharges: 0,
        maxSonarCharges: 0,
        discoveredTargets: result.capsulesRescued,
        totalTargets: result.totalRealCapsules,
      };
      this.voyageArchive.finishVoyage(dummyGameState, victory, false, result);
    }
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

    const perfectPathBonus =
      victory && this.offtrackCount === 0 && this.highRiskIncursions === 0 && this.blockerCollisions === 0;

    const finalScore = this.state.score + timeBonus + perfectBonus + accuracyBonus;

    let rank: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
    if (victory) {
      const rescueRate = this.state.capsulesRescued / Math.max(1, this.state.totalRealCapsules);
      if (rescueRate >= 1 && accuracy >= 90 && this.state.timeRemaining > 60 && perfectPathBonus) rank = 'S';
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
      capsulesFound: this.state.capsulesFound,
      totalRealCapsules: this.state.totalRealCapsules,
      falseReports: this.state.falseReports,
      timeRemaining: Math.ceil(this.state.timeRemaining),
      totalTime: this.state.totalTime,
      sonarUsed: this.totalSonarUsed,
      level: this.state.currentLevel,
      accuracy,
      rank,
      rescuePoints,
      totalPathBonus: this.state.path.totalPathBonus,
      pathCompletionRate: this.state.path.safeDistanceTraveled > 0
        ? Math.min(100, Math.round((this.state.path.safeDistanceTraveled / Math.max(1, this.state.path.totalPathLength)) * 100))
        : 0,
      offtrackCount: this.offtrackCount,
      highRiskIncursions: this.highRiskIncursions,
      blockerCollisions: this.blockerCollisions,
      safeTravelDistance: Math.round(this.state.path.safeDistanceTraveled),
      totalPathLength: this.state.path.totalPathLength,
      perfectPathBonus,
    };
  }

  private notifyStateChange() {
    this.onStateChange?.({ ...this.state });
  }

  getVoyageArchive(): VoyageArchiveSystem {
    return this.voyageArchive;
  }
}
