import type { Position, Target, GameState, UnlockEvent, ExpeditionLoadout, LoadoutEffects, SalvageEventWreck } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { computeLoadoutEffects, DEFAULT_LOADOUT } from '../config/expeditionConfig';
import { MapRenderer } from './MapRenderer';
import { SonarSystem } from './SonarSystem';
import { TargetGenerator } from './TargetGenerator';
import { ScoreSystem, type ScoreEvent } from './ScoreSystem';
import { CollectionSystem } from './CollectionSystem';
import { SalvageEventSystem } from './SalvageEventSystem';
import * as PIXI from 'pixi.js';

export class GameController {
  private renderer: MapRenderer;
  private sonar: SonarSystem;
  private targetGenerator: TargetGenerator;
  private scoreSystem: ScoreSystem;
  private collection: CollectionSystem;
  private salvageEvent: SalvageEventSystem | null;

  private targets: Target[] = [];
  private playerPosition: Position;
  private isInitialized: boolean = false;
  private lastRechargeTime: number = 0;
  private collectedCount: number = 0;
  private collectedCreaturesAndWrecks: number = 0;
  private currentLoadout: ExpeditionLoadout;
  private currentEffects: LoadoutEffects;
  private eventWreckMap: Map<number, SalvageEventWreck> = new Map();

  private onStateChange?: (state: GameState) => void;
  private onScoreEvent?: (event: ScoreEvent) => void;
  private onGameOver?: (finalScore: number) => void;
  private onLevelUp?: (newLevel: number) => void;
  private onUnlock?: (event: UnlockEvent) => void;

  constructor(container: HTMLElement, collectionSystem?: CollectionSystem, salvageSystem?: SalvageEventSystem) {
    this.currentLoadout = { ...DEFAULT_LOADOUT };
    this.currentEffects = computeLoadoutEffects(this.currentLoadout);
    this.salvageEvent = salvageSystem ?? null;

    this.renderer = new MapRenderer(container, GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);
    this.sonar = new SonarSystem();
    this.targetGenerator = new TargetGenerator(GAME_CONFIG.MAP_WIDTH, GAME_CONFIG.MAP_HEIGHT);
    this.scoreSystem = new ScoreSystem({
      initialLivesBonus: this.currentEffects.livesBonus + (this.salvageEvent?.getBonusLives() ?? 0),
      maxSonarCharges: this.currentEffects.maxSonarCharges + (this.salvageEvent?.getBonusSonarCharges() ?? 0),
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

  setLoadout(loadout: ExpeditionLoadout) {
    this.currentLoadout = { ...loadout };
    this.currentEffects = computeLoadoutEffects(this.currentLoadout);

    this.renderer.setMapSize(GAME_CONFIG.MAP_WIDTH, this.currentEffects.mapHeight);
    this.targetGenerator.setSize(GAME_CONFIG.MAP_WIDTH, this.currentEffects.mapHeight);
    
    const wreckMultiplier = (this.salvageEvent?.getEventWreckMultiplier() ?? 1);
    this.targetGenerator.setMultipliers({
      creatureCountMul: this.currentEffects.creatureCountMul,
      wreckCountMul: this.currentEffects.wreckCountMul * (this.salvageEvent?.getState().isActive ? (this.salvageEvent?.getConfig().wreckCountMultiplier ?? 1) : 1),
      dangerCountMul: this.currentEffects.dangerCountMul,
      creaturePointsBonus: this.currentEffects.creaturePointsBonus,
      wreckPointsBonus: this.currentEffects.wreckPointsBonus,
      scoreMul: this.currentEffects.scoreMul * wreckMultiplier,
    });
    this.sonar.setParams(
      this.currentEffects.sonarRadius,
      this.currentEffects.sonarSpeed,
      this.currentEffects.precisionBonus
    );
    this.scoreSystem.setParams({
      initialLivesBonus: this.currentEffects.livesBonus + (this.salvageEvent?.getBonusLives() ?? 0),
      maxSonarCharges: this.currentEffects.maxSonarCharges + (this.salvageEvent?.getBonusSonarCharges() ?? 0),
      initialSonarBonus: this.currentEffects.initialSonarBonus,
      scoreMul: this.currentEffects.scoreMul * wreckMultiplier,
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
    this.eventWreckMap.clear();
    this.injectEventWrecks(state.level);
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

  private injectEventWrecks(level: number) {
    if (!this.salvageEvent || !this.salvageEvent.getState().isActive) return;

    const eventConfig = this.salvageEvent.getConfig();
    const eventWreckCount = Math.max(1, Math.floor(2 + level * 0.5));

    for (let i = 0; i < eventWreckCount; i++) {
      const eventWreck = this.salvageEvent.getRandomEventWreck();
      if (!eventWreck) continue;

      let attempts = 0;
      while (attempts < 50) {
        const margin = GAME_CONFIG.TARGETS.SPAWN_MARGIN;
        const pos = {
          x: margin + Math.random() * (GAME_CONFIG.MAP_WIDTH - 2 * margin),
          y: margin + Math.random() * (this.currentEffects.mapHeight - 2 * margin),
        };
        const radius = eventWreck.minRadius + Math.random() * (eventWreck.maxRadius - eventWreck.minRadius);

        let overlapping = false;
        for (const t of this.targets) {
          const dx = pos.x - t.position.x;
          const dy = pos.y - t.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius + t.radius + GAME_CONFIG.TARGETS.SPAWN_MARGIN) {
            overlapping = true;
            break;
          }
        }

        if (!overlapping) {
          const points = Math.round((eventWreck.basePoints + eventWreck.eventBonus) * eventConfig.wreckWeightBonus);
          const target: Target = {
            id: Date.now() + i + Math.floor(Math.random() * 10000),
            type: 'wreck',
            position: pos,
            radius,
            name: eventWreck.name,
            points,
            discovered: false,
            collected: false,
            shape: eventWreck.shape,
            rotation: Math.random() * Math.PI * 2,
          };
          this.targets.push(target);
          this.eventWreckMap.set(target.id, eventWreck);
          break;
        }
        attempts++;
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

    const { discoveredTargetIds } = this.sonar.update(delta, this.targets);
    for (const _id of discoveredTargetIds) {
      this.scoreSystem.discoverTarget();
    }

    this.renderer.updateCamera(this.playerPosition.y);

    const now = Date.now();
    if (now - this.lastRechargeTime >= GAME_CONFIG.SONAR.RECHARGE_TIME) {
      this.scoreSystem.rechargeSonar();
      this.lastRechargeTime = now;
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

        const eventWreck = this.eventWreckMap.get(target.id);
        if (eventWreck && this.salvageEvent) {
          this.salvageEvent.recordWreckCollected(eventWreck, target.points);
        }

        const state = this.scoreSystem.getState();
        const unlockEvent = this.collection.recordTarget(target, state.level, target.points);
        if (unlockEvent) {
          this.onUnlock?.(unlockEvent);
        }

        if (this.scoreSystem.checkLevelUp(this.collectedCreaturesAndWrecks)) {
          const state = this.scoreSystem.getState();
          const newTargets = this.targetGenerator.generateTargets(state.level);
          this.targets.push(...newTargets);
          this.injectEventWrecks(state.level);
          this.onLevelUp?.(state.level);
        }

        if (!alive) {
          this.scoreSystem.endGame();
          this.salvageEvent?.recordExpeditionCompleted();
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

  getSalvageEventSystem(): SalvageEventSystem | null {
    return this.salvageEvent;
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
