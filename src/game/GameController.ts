import type { Position, Target, GameState, UnlockEvent, ExpeditionLoadout, LoadoutEffects, DailyChallengeConfig } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { computeLoadoutEffects, DEFAULT_LOADOUT } from '../config/expeditionConfig';
import { MapRenderer } from './MapRenderer';
import { SonarSystem } from './SonarSystem';
import { TargetGenerator } from './TargetGenerator';
import { ScoreSystem, type ScoreEvent } from './ScoreSystem';
import { CollectionSystem } from './CollectionSystem';
import { applyChallengeRules } from './DailyChallengeSystem';
import * as PIXI from 'pixi.js';

export class GameController {
  private renderer: MapRenderer;
  private sonar: SonarSystem;
  private targetGenerator: TargetGenerator;
  private scoreSystem: ScoreSystem;
  private collection: CollectionSystem;

  private targets: Target[] = [];
  private playerPosition: Position;
  private isInitialized: boolean = false;
  private lastRechargeTime: number = 0;
  private collectedCount: number = 0;
  private collectedCreaturesAndWrecks: number = 0;
  private currentLoadout: ExpeditionLoadout;
  private currentEffects: LoadoutEffects;
  private dailyChallenge: DailyChallengeConfig | null = null;
  private disableSonarRecharge: boolean = false;

  private onStateChange?: (state: GameState) => void;
  private onScoreEvent?: (event: ScoreEvent) => void;
  private onGameOver?: (finalScore: number) => void;
  private onLevelUp?: (newLevel: number) => void;
  private onUnlock?: (event: UnlockEvent) => void;

  constructor(container: HTMLElement, collectionSystem?: CollectionSystem) {
    this.currentLoadout = { ...DEFAULT_LOADOUT };
    this.currentEffects = computeLoadoutEffects(this.currentLoadout);

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

    this.playerPosition = {
      x: GAME_CONFIG.MAP_WIDTH / 2,
      y: 80,
    };

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

  setLoadout(loadout: ExpeditionLoadout) {
    this.currentLoadout = { ...loadout };
    this.currentEffects = computeLoadoutEffects(this.currentLoadout);

    let challengeEffects = {
      livesBonus: this.currentEffects.livesBonus,
      maxSonarCharges: this.currentEffects.maxSonarCharges,
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

    this.renderer.setMapSize(GAME_CONFIG.MAP_WIDTH, this.currentEffects.mapHeight);
    this.targetGenerator.setSize(GAME_CONFIG.MAP_WIDTH, this.currentEffects.mapHeight);
    this.targetGenerator.setMultipliers({
      creatureCountMul: this.currentEffects.creatureCountMul,
      wreckCountMul: this.currentEffects.wreckCountMul,
      dangerCountMul: challengeEffects.dangerCountMul,
      creaturePointsBonus: this.currentEffects.creaturePointsBonus,
      wreckPointsBonus: this.currentEffects.wreckPointsBonus,
      scoreMul: challengeEffects.scoreMul,
    });
    this.sonar.setParams(
      challengeEffects.sonarRadius,
      challengeEffects.sonarSpeed,
      this.currentEffects.precisionBonus
    );
    this.scoreSystem.setParams({
      initialLivesBonus: challengeEffects.livesBonus,
      maxSonarCharges: challengeEffects.maxSonarCharges,
      initialSonarBonus: this.currentEffects.initialSonarBonus,
      scoreMul: challengeEffects.scoreMul,
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
    onUnlock?: (event: UnlockEvent) => void
  ) {
    this.onStateChange = onStateChange;
    this.onScoreEvent = onScoreEvent;
    this.onGameOver = onGameOver;
    this.onLevelUp = onLevelUp;
    this.onUnlock = onUnlock;

    this.scoreSystem.setStateCallbacks(
      (state) => this.onStateChange?.(state),
      (event) => this.onScoreEvent?.(event)
    );
  }

  startGame() {
    const state = this.scoreSystem.getState();
    this.targets = this.targetGenerator.generateTargets(state.level);
    this.scoreSystem.startGame(this.targets.length);
    this.renderer.clearDiscovered();
    this.sonar.clear();
    this.collection.resetSessionUnlocks();
    this.collectedCount = 0;
    this.collectedCreaturesAndWrecks = 0;
    this.lastRechargeTime = Date.now();
    this.playerPosition = {
      x: GAME_CONFIG.MAP_WIDTH / 2,
      y: 80,
    };

    if (!this.isInitialized) {
      this.isInitialized = true;
      this.startGameLoop();
    }

    this.renderer.addDiscoveredArea(this.playerPosition, 120);
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

    const { discoveredTargetIds } = this.sonar.update(delta, this.targets);
    for (const _id of discoveredTargetIds) {
      this.scoreSystem.discoverTarget();
    }

    this.renderer.updateCamera(this.playerPosition.y);

    if (!this.disableSonarRecharge) {
      const now = Date.now();
      if (now - this.lastRechargeTime >= GAME_CONFIG.SONAR.RECHARGE_TIME) {
        this.scoreSystem.rechargeSonar();
        this.lastRechargeTime = now;
      }
    }
  }

  private render() {
    this.renderer.drawPlayer(this.playerPosition);
    this.renderer.renderWaves(this.sonar.getWaves());
    this.renderer.renderEchos(this.sonar.getEchoPoints());
    this.renderer.renderTargets(this.targets);
  }

  fireSonar(position: Position): boolean {
    if (!this.scoreSystem.useSonar()) return false;

    const worldPos = { ...position };
    this.sonar.emitSonar(worldPos);
    this.renderer.addDiscoveredArea(worldPos, this.currentEffects.sonarRadius);
    return true;
  }

  movePlayer(targetY: number) {
    const mapSize = this.renderer.getMapSize();
    targetY = Math.max(50, Math.min(mapSize.height - 50, targetY));
    this.playerPosition.y += (targetY - this.playerPosition.y) * 0.15;
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

        const alive = this.scoreSystem.collectTarget(target);

        const state = this.scoreSystem.getState();
        const unlockEvent = this.collection.recordTarget(target, state.level, target.points);
        if (unlockEvent) {
          this.onUnlock?.(unlockEvent);
        }

        if (this.scoreSystem.checkLevelUp(this.collectedCreaturesAndWrecks)) {
          const state = this.scoreSystem.getState();
          this.targets.push(...this.targetGenerator.generateTargets(state.level));
          this.onLevelUp?.(state.level);
        }

        if (!alive) {
          this.scoreSystem.endGame();
          this.onGameOver?.(this.scoreSystem.getFinalScore());
        }

        return { hit: true, target };
      }
    }
    return { hit: false };
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
}
