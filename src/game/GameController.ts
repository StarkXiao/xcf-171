import type { Position, Target, GameState, UnlockEvent, ExpeditionLoadout, LoadoutEffects, DailyChallengeConfig, DangerZone } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { computeLoadoutEffects, DEFAULT_LOADOUT, applyTechEffects } from '../config/expeditionConfig';
import { MapRenderer } from './MapRenderer';
import { SonarSystem } from './SonarSystem';
import { TargetGenerator } from './TargetGenerator';
import { ScoreSystem, type ScoreEvent } from './ScoreSystem';
import { CollectionSystem } from './CollectionSystem';
import { ResearchStationSystem } from './ResearchStationSystem';
import { applyChallengeRules } from './DailyChallengeSystem';
import { RewardSystem, type RewardTriggeredEvent } from './RewardSystem';
import { VoyageArchiveSystem, type ActiveVoyageBuilder } from './VoyageArchiveSystem';
import * as PIXI from 'pixi.js';

export class GameController {
  private renderer: MapRenderer;
  private sonar: SonarSystem;
  private targetGenerator: TargetGenerator;
  private scoreSystem: ScoreSystem;
  private collection: CollectionSystem;
  private researchStation: ResearchStationSystem;
  private rewardSystem: RewardSystem;
  private voyageArchive: VoyageArchiveSystem;
  private activeVoyage: ActiveVoyageBuilder | null = null;

  private targets: Target[] = [];
  private dangerZones: DangerZone[] = [];
  private playerPosition: Position;
  private moveTarget: Position;
  private isInitialized: boolean = false;
  private lastRechargeTime: number = 0;
  private lastDangerCheckTime: number = 0;
  private collectedCount: number = 0;
  private collectedCreaturesAndWrecks: number = 0;
  private currentLoadout: ExpeditionLoadout;
  private currentEffects: LoadoutEffects;
  private dailyChallenge: DailyChallengeConfig | null = null;
  private disableSonarRecharge: boolean = false;
  private customConfig: any = null;

  private onStateChange?: (state: GameState) => void;
  private onScoreEvent?: (event: ScoreEvent) => void;
  private onGameOver?: (finalScore: number) => void;
  private onLevelUp?: (newLevel: number) => void;
  private onUnlock?: (event: UnlockEvent) => void;
  private onRewardTriggered?: (event: RewardTriggeredEvent) => void;

  constructor(container: HTMLElement, collectionSystem?: CollectionSystem, researchStationSystem?: ResearchStationSystem, voyageArchiveSystem?: VoyageArchiveSystem) {
    this.currentLoadout = { ...DEFAULT_LOADOUT };
    this.researchStation = researchStationSystem ?? new ResearchStationSystem();
    this.currentEffects = applyTechEffects(
      computeLoadoutEffects(this.currentLoadout),
      this.researchStation.getAggregatedEffects()
    );
    this.voyageArchive = voyageArchiveSystem ?? new VoyageArchiveSystem();

    this.renderer = new MapRenderer(container, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);
    this.sonar = new SonarSystem();
    this.targetGenerator = new TargetGenerator(GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);
    this.scoreSystem = new ScoreSystem({
      initialLivesBonus: this.currentEffects.livesBonus,
      maxSonarCharges: this.currentEffects.maxSonarCharges,
      initialSonarBonus: this.currentEffects.initialSonarBonus,
      scoreMul: this.currentEffects.scoreMul,
    });
    this.collection = collectionSystem ?? new CollectionSystem();
    this.rewardSystem = new RewardSystem();

    this.playerPosition = {
      x: GAME_CONFIG.MAP_WIDTH / 2,
      y: 80,
    };
    this.moveTarget = { ...this.playerPosition };

    this.sonar.setEchoCallback(() => {});
  }

  setDailyChallenge(challenge: DailyChallengeConfig | null) {
    this.dailyChallenge = challenge;
    if (challenge) {
      this.targetGenerator.setSeed(challenge.seed);
    } else {
      this.targetGenerator.setSeed(null);
    }
  }

  getDailyChallenge(): DailyChallengeConfig | null {
    return this.dailyChallenge;
  }

  setCustomConfig(config: any | null) {
    this.customConfig = config;
    this.targetGenerator.setCustomConfig(config);
  }

  getCustomConfig(): any | null {
    return this.customConfig;
  }

  private getEffectiveConfig() {
    if (this.customConfig) {
      return this.customConfig;
    }
    return GAME_CONFIG;
  }

  setLoadout(loadout: ExpeditionLoadout) {
    this.currentLoadout = { ...loadout };
    const baseEffects = computeLoadoutEffects(this.currentLoadout);
    this.currentEffects = applyTechEffects(baseEffects, this.researchStation.getAggregatedEffects());
    const cfg = this.getEffectiveConfig();

    let challengeEffects = {
      livesBonus: this.currentEffects.livesBonus,
      livesOverride: null as number | null,
      maxSonarCharges: this.currentEffects.maxSonarCharges,
      initialSonarBonus: this.currentEffects.initialSonarBonus,
      sonarRadius: this.currentEffects.sonarRadius,
      sonarSpeed: this.currentEffects.sonarSpeed,
      dangerCountMul: this.currentEffects.dangerCountMul,
      scoreMul: this.currentEffects.scoreMul,
      disableRecharge: false,
    };

    if (this.dailyChallenge) {
      challengeEffects = applyChallengeRules(this.dailyChallenge, challengeEffects);
    }

    this.disableSonarRecharge = challengeEffects.disableRecharge;

    const mapHeight = this.customConfig ? cfg.MAP_HEIGHT : this.currentEffects.mapHeight;
    this.renderer.setMapSize(cfg.MAP_WIDTH, mapHeight);
    this.targetGenerator.setSize(cfg.MAP_WIDTH, mapHeight);
    this.targetGenerator.setMultipliers({
      creatureCountMul: this.customConfig ? 1 : this.currentEffects.creatureCountMul,
      wreckCountMul: this.customConfig ? 1 : this.currentEffects.wreckCountMul,
      dangerCountMul: this.customConfig ? 1 : challengeEffects.dangerCountMul,
      creaturePointsBonus: this.customConfig ? 0 : this.currentEffects.creaturePointsBonus,
      wreckPointsBonus: this.customConfig ? 0 : this.currentEffects.wreckPointsBonus,
      scoreMul: this.customConfig ? 1 : challengeEffects.scoreMul,
    });
    this.sonar.setParams(
      this.customConfig ? cfg.SONAR.MAX_RADIUS : challengeEffects.sonarRadius,
      this.customConfig ? cfg.SONAR.SPEED : challengeEffects.sonarSpeed,
      this.currentEffects.precisionBonus
    );
    this.scoreSystem.setParams({
      initialLivesBonus: this.customConfig ? 0 : challengeEffects.livesBonus,
      initialLivesOverride: this.customConfig ? cfg.GAME.INITIAL_LIVES : challengeEffects.livesOverride,
      maxSonarCharges: this.customConfig ? cfg.SONAR.MAX_CHARGES : challengeEffects.maxSonarCharges,
      initialSonarBonus: this.customConfig ? 0 : challengeEffects.initialSonarBonus,
      scoreMul: this.customConfig ? 1 : challengeEffects.scoreMul,
    });
  }

  getLoadout(): ExpeditionLoadout {
    return { ...this.currentLoadout };
  }

  setCallbacks(
    onStateChange: (state: GameState) => void,
    onScoreEvent: (event: ScoreEvent) => void,
    onGameOver: (finalScore: number) => void,
    onLevelUp: (newLevel: number) => void,
    onUnlock?: (event: UnlockEvent) => void,
    onRewardTriggered?: (event: RewardTriggeredEvent) => void
  ) {
    this.onStateChange = onStateChange;
    this.onScoreEvent = onScoreEvent;
    this.onGameOver = onGameOver;
    this.onLevelUp = onLevelUp;
    this.onUnlock = onUnlock;
    this.onRewardTriggered = onRewardTriggered;

    this.scoreSystem.setStateCallbacks(
      (state) => this.onStateChange?.(state),
      (event) => {
        const currentState = this.scoreSystem.getState();
        if (this.activeVoyage) {
          this.voyageArchive.recordScoreEvent(event, currentState);
        }
        this.onScoreEvent?.(event);
      }
    );

    this.rewardSystem.setCallbacks({
      onRewardTriggered: (event) => this.onRewardTriggered?.(event),
      addPoints: (points, reason) => this.scoreSystem.addBonus(points, reason),
      addLife: (amount) => this.scoreSystem.addLife(amount),
      addSonarCharge: (amount) => this.scoreSystem.addSonarCharges(amount),
      getScoreMul: () => this.currentEffects.scoreMul,
    });
  }

  startGame() {
    const state = this.scoreSystem.getState();
    const cfg = this.getEffectiveConfig();
    this.targets = this.targetGenerator.generateTargets(state.level);
    this.scoreSystem.startGame(this.targets.length);
    this.renderer.clearDiscovered();
    this.sonar.clear();
    this.collection.resetSessionUnlocks();
    this.collectedCount = 0;
    this.collectedCreaturesAndWrecks = 0;
    this.lastRechargeTime = Date.now();
    this.lastDangerCheckTime = Date.now();
    this.playerPosition = {
      x: cfg.MAP_WIDTH / 2,
      y: 80,
    };
    this.moveTarget = { ...this.playerPosition };

    const mode = this.dailyChallenge ? 'daily_challenge' : 'normal';
    this.activeVoyage = this.voyageArchive.startVoyage(
      mode as any,
      this.currentLoadout,
      this.dailyChallenge,
      this.customConfig
    );
    this.activeVoyage.hitRate.totalTargets = this.targets.length;
    this.voyageArchive.recordTargetInfo(this.targets.length);

    this.dangerZones = this.customConfig?.DANGER_ZONES ? [...this.customConfig.DANGER_ZONES] : [];
    const rewardRules = this.customConfig?.REWARD_RULES ? [...this.customConfig.REWARD_RULES] : [];
    this.rewardSystem.setRules(rewardRules);
    this.rewardSystem.startGame(this.targets.length, 0);

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.startGameLoop();
    }

    this.renderer.addDiscoveredArea(this.playerPosition, 120);
    this.renderer.renderDangerZones(this.dangerZones);

    if (this.currentEffects.intelligenceRadar) {
      this.renderer.addDiscoveredArea(this.playerPosition, 250);
      for (const target of this.targets) {
        const dx = target.position.x - this.playerPosition.x;
        const dy = target.position.y - this.playerPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 250) {
          target.discovered = true;
        }
      }
    }
  }

  private startGameLoop() {
    this.renderer.getTicker().add((deltaTime) => {
      const state = this.scoreSystem.getState();
      if (!state.isPlaying || state.isPaused) return;

      const delta = (deltaTime as unknown as PIXI.Ticker).deltaTime
        ? (deltaTime as unknown as PIXI.Ticker).deltaTime / 60
        : (deltaTime as number) / 60;

      this.update(delta);
      this.render();
    });
  }

  private update(delta: number) {
    this.renderer.updateParticles(delta);
    this.updatePlayerPosition(delta);

    const discoveredBefore = this.scoreSystem.getState().discoveredTargets;
    const { discoveredTargetIds } = this.sonar.update(delta, this.targets);
    for (const _id of discoveredTargetIds) {
      this.scoreSystem.discoverTarget();
      this.rewardSystem.recordDiscover();
    }
    const stateAfterDiscover = this.scoreSystem.getState();
    if (this.activeVoyage) {
      this.voyageArchive.recordDiscovered(stateAfterDiscover.discoveredTargets);
      this.voyageArchive.recordTrajectory(this.playerPosition);
      this.voyageArchive.updateGameState(stateAfterDiscover);
    }

    this.renderer.updateCamera(this.playerPosition.y);

    if (this.dangerZones.length > 0) {
      this.checkPlayerDangerZones();
    }

    if (!this.disableSonarRecharge) {
      const now = Date.now();
      const cfg = this.getEffectiveConfig();
      const rechargeTime = this.customConfig ? cfg.SONAR.RECHARGE_TIME : (GAME_CONFIG.SONAR.RECHARGE_TIME * this.currentEffects.sonarRechargeTimeMul);
      if (now - this.lastRechargeTime >= rechargeTime) {
        this.scoreSystem.rechargeSonar();
        this.lastRechargeTime = now;
      }
    }
  }

  private updatePlayerPosition(delta: number) {
    const dx = this.moveTarget.x - this.playerPosition.x;
    const dy = this.moveTarget.y - this.playerPosition.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    const speed = 120 * delta * 60;
    const lerpFactor = Math.min(1, speed / dist);
    const moveStep = 0.08;

    this.playerPosition.x += dx * Math.max(moveStep, lerpFactor);
    this.playerPosition.y += dy * Math.max(moveStep, lerpFactor);

    const mapSize = this.renderer.getMapSize();
    this.playerPosition.x = Math.max(30, Math.min(mapSize.width - 30, this.playerPosition.x));
    this.playerPosition.y = Math.max(30, Math.min(mapSize.height - 30, this.playerPosition.y));
  }

  setMoveTarget(pos: Position) {
    const mapSize = this.renderer.getMapSize();
    this.moveTarget = {
      x: Math.max(30, Math.min(mapSize.width - 30, pos.x)),
      y: Math.max(30, Math.min(mapSize.height - 30, pos.y)),
    };
  }

  private checkPlayerDangerZones() {
    const now = Date.now();
    const checkInterval = 500;
    if (now - this.lastDangerCheckTime < checkInterval) return;
    this.lastDangerCheckTime = now;

    for (const zone of this.dangerZones) {
      const dx = this.playerPosition.x - zone.position.x;
      const dy = this.playerPosition.y - zone.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < zone.radius) {
        const baseDamage = this.computeDangerDamage(zone);
        if (baseDamage > 0) {
          const alive = this.scoreSystem.takeDamage(baseDamage, `${zone.name}`);
          if (this.activeVoyage) {
            this.voyageArchive.recordDamage(this.playerPosition, zone.name, baseDamage);
          }
          this.rewardSystem.recordDamage();
          if (!alive) {
            this.scoreSystem.endGame();
            this.finalizeRewards();
            this.onGameOver?.(this.scoreSystem.getFinalScore());
          }
        }
      }
    }
  }

  private computeDangerDamage(zone: DangerZone): number {
    const typeDamageMap: Record<DangerZone['type'], number> = {
      minefield: 1,
      volcano: 1,
      vortex: 1,
      toxic: 1,
    };
    const baseDamage = typeDamageMap[zone.type] ?? 1;
    return Math.max(1, Math.round(baseDamage * zone.intensity));
  }

  private computeSonarInterference(sonarPos: Position): { radiusMul: number; extraCost: number } {
    if (this.dangerZones.length === 0) return { radiusMul: 1, extraCost: 0 };

    let radiusMul = 1;
    let extraCost = 0;

    for (const zone of this.dangerZones) {
      const dx = sonarPos.x - zone.position.x;
      const dy = sonarPos.y - zone.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < zone.radius * 1.5) {
        const influence = Math.max(0, 1 - dist / (zone.radius * 1.5));
        if (zone.type === 'vortex') {
          radiusMul *= 1 - influence * zone.intensity * 0.6;
        } else if (zone.type === 'volcano') {
          radiusMul *= 1 - influence * zone.intensity * 0.3;
        } else if (zone.type === 'toxic') {
          extraCost += Math.round(influence * zone.intensity);
        }
      }
    }

    return { radiusMul: Math.max(0.3, radiusMul), extraCost };
  }

  private render() {
    this.renderer.drawPlayer(this.playerPosition);
    this.renderer.renderWaves(this.sonar.getWaves());
    this.renderer.renderEchos(this.sonar.getEchoPoints());
    this.renderer.renderTargets(this.targets);
    if (this.dangerZones.length > 0) {
      this.renderer.renderDangerZones(this.dangerZones);
    }
  }

  fireSonar(position: Position): boolean {
    if (!this.scoreSystem.useSonar()) return false;

    const worldPos = { ...position };
    const discoveredBefore = this.scoreSystem.getState().discoveredTargets;
    const { radiusMul, extraCost } = this.computeSonarInterference(worldPos);

    if (extraCost > 0) {
      for (let i = 0; i < extraCost; i++) {
        this.scoreSystem.useSonar();
      }
    }

    const cfg = this.getEffectiveConfig();
    const baseRadius = this.customConfig ? cfg.SONAR.MAX_RADIUS : this.currentEffects.sonarRadius;
    const effectiveRadius = Math.round(baseRadius * radiusMul);
    const baseSpeed = this.customConfig ? cfg.SONAR.SPEED : this.currentEffects.sonarSpeed;
    const effectiveSpeed = baseSpeed * Math.sqrt(radiusMul);

    this.sonar.setParams(effectiveRadius, effectiveSpeed, this.currentEffects.precisionBonus);
    this.sonar.emitSonar(worldPos);

    setTimeout(() => {
      this.sonar.setParams(
        this.customConfig ? cfg.SONAR.MAX_RADIUS : this.currentEffects.sonarRadius,
        this.customConfig ? cfg.SONAR.SPEED : this.currentEffects.sonarSpeed,
        this.currentEffects.precisionBonus
      );
      setTimeout(() => {
        const discoveredAfter = this.scoreSystem.getState().discoveredTargets;
        if (this.activeVoyage) {
          this.voyageArchive.recordSonarFired(worldPos, discoveredBefore, discoveredAfter);
          if (discoveredAfter === discoveredBefore) {
            this.voyageArchive.recordEmptySonar(worldPos);
          }
        }
      }, 800);
    }, 100);

    this.renderer.addDiscoveredArea(worldPos, effectiveRadius);
    return true;
  }

  handleTap(worldPos: Position): { hit: boolean; target?: Target } {
    for (const target of this.targets) {
      if (target.collected) continue;

      const dx = worldPos.x - target.position.x;
      const dy = worldPos.y - target.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= target.radius + 15 && target.discovered) {
        target.collected = true;
        this.collectedCount++;
        if (target.type !== 'danger') {
          this.collectedCreaturesAndWrecks++;
        }

        if (target.type === 'creature' || target.type === 'wreck') {
          const comboPoints = this.rewardSystem.applyComboToScore(target.points);
          target.points = comboPoints;
        }

        const alive = this.scoreSystem.collectTarget(target);
        if (this.activeVoyage) {
          this.voyageArchive.recordTap(worldPos, true);
        }

        if (target.type === 'creature') {
          this.rewardSystem.recordCollect('creature');
        } else if (target.type === 'wreck') {
          this.rewardSystem.recordCollect('wreck');
        } else if (target.type === 'danger') {
          this.rewardSystem.recordCollect('danger');
        }

        const state = this.scoreSystem.getState();
        const unlockEvent = this.collection.recordTarget(target, state.level, target.points);
        if (unlockEvent) {
          this.onUnlock?.(unlockEvent);
        }

        if (this.scoreSystem.checkLevelUp(this.collectedCreaturesAndWrecks)) {
          const state = this.scoreSystem.getState();
          this.targets.push(...this.targetGenerator.generateTargets(state.level));
          if (this.activeVoyage) {
            this.voyageArchive.recordLevelUp(state.level);
            this.voyageArchive.recordTargetInfo(this.targets.length);
          }
          this.onLevelUp?.(state.level);
        }

        if (!alive) {
          this.scoreSystem.endGame();
          this.finalizeRewards();
          this.onGameOver?.(this.scoreSystem.getFinalScore());
        }

        return { hit: true, target };
      }
    }
    if (this.activeVoyage) {
      this.voyageArchive.recordTap(worldPos, false);
    }
    return { hit: false };
  }

  private finalizeRewards() {
    const events = this.rewardSystem.checkEndGameTriggers();
    for (const event of events) {
      this.onRewardTriggered?.(event);
    }
  }

  getRewardSystem(): RewardSystem {
    return this.rewardSystem;
  }

  getState(): GameState {
    return this.scoreSystem.getState();
  }

  getTargets(): Target[] {
    return this.targets;
  }

  getCollectionSystem(): CollectionSystem {
    return this.collection;
  }

  getSessionUnlocks() {
    return this.collection.getSessionUnlocks();
  }

  screenToWorld(screenX: number, screenY: number): Position {
    return this.renderer.screenToWorld(screenX, screenY);
  }

  destroy() {
    this.renderer.destroy();
  }

  getVoyageArchive(): VoyageArchiveSystem {
    return this.voyageArchive;
  }

  finishVoyage(isNewRecord: boolean) {
    const state = this.scoreSystem.getState();
    const isVictory = state.lives > 0 && !state.isGameOver;
    return this.voyageArchive.finishVoyage(state, isVictory, isNewRecord);
  }
}
