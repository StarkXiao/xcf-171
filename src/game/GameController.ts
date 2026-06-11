import type { Position, Target, GameState, UnlockEvent, ExpeditionLoadout, LoadoutEffects, SalvageEventWreck, OceanEvent, Mission, MissionEffect, ComboEvent } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';
import { OCEAN_EVENT_CONFIG } from '../config/oceanEvents';
import { computeLoadoutEffects, DEFAULT_LOADOUT } from '../config/expeditionConfig';
import { MapRenderer } from './MapRenderer';
import { SonarSystem } from './SonarSystem';
import { TargetGenerator } from './TargetGenerator';
import { ScoreSystem, type ScoreEvent } from './ScoreSystem';
import { CollectionSystem } from './CollectionSystem';
import { SalvageEventSystem } from './SalvageEventSystem';
import { OceanEventSystem } from './OceanEventSystem';
import { MissionSystem } from './MissionSystem';
import * as PIXI from 'pixi.js';

export class GameController {
  private renderer: MapRenderer;
  private sonar: SonarSystem;
  private targetGenerator: TargetGenerator;
  private scoreSystem: ScoreSystem;
  private collection: CollectionSystem;
  private salvageEvent: SalvageEventSystem | null;
  private oceanEventSystem: OceanEventSystem;
  private missionSystem: MissionSystem;

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
  private onOceanEventSpawned?: (event: OceanEvent) => void;
  private onOceanEventExpired?: (event: OceanEvent) => void;
  private onTreasureCollected?: (event: OceanEvent, points: number) => void;
  private onMissionCompleted?: (mission: Mission) => void;
  private onMissionProgress?: (mission: Mission) => void;
  private onMissionEffectsChanged?: (effects: MissionEffect[]) => void;
  private onComboEvent?: (event: ComboEvent) => void;

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
      dangerLifePenaltyMul: this.currentEffects.dangerLifePenaltyMul,
      dangerScorePenaltyMul: this.currentEffects.dangerScorePenaltyMul,
    });
    this.sonar.setDetectorParams(
      this.currentEffects.echoRangeMul,
      this.currentEffects.echoCountMul,
      this.currentEffects.echoLifeMul,
      this.currentEffects.echoSizeMul,
      this.currentEffects.discoveryEfficiencyMul
    );
    this.collection = collectionSystem ?? new CollectionSystem();
    this.oceanEventSystem = new OceanEventSystem({
      mapWidth: GAME_CONFIG.MAP_WIDTH,
      mapHeight: GAME_CONFIG.MAP_HEIGHT,
    });
    this.missionSystem = new MissionSystem();

    this.playerPosition = {
      x: GAME_CONFIG.MAP_WIDTH / 2,
      y: 80,
    };

    this.sonar.setEchoCallback(() => {});
    this.setupOceanEventCallbacks();
  }

  private setupOceanEventCallbacks() {
    this.oceanEventSystem.setCallbacks(
      (event) => {
        this.injectEventInfluencedTargets(event);
        this.onOceanEventSpawned?.(event);
      },
      (event) => this.onOceanEventExpired?.(event),
      (event, points) => this.onTreasureCollected?.(event, points)
    );
  }

  private injectEventInfluencedTargets(event: OceanEvent) {
    if (event.type === 'current') {
      this.injectCreaturesNearEvent(event, 1 + Math.floor(Math.random() * 2));
    } else if (event.type === 'interference') {
      this.injectDangersNearEvent(event, 1 + Math.floor(Math.random() * 2));
    } else if (event.type === 'treasure') {
      this.injectWrecksNearEvent(event, 1);
    }

    this.scoreSystem.updateTotalTargets(this.targets.length);
  }

  private injectCreaturesNearEvent(event: OceanEvent, count: number) {
    const state = this.scoreSystem.getState();
    const pointsBase = Math.round(
      (GAME_CONFIG.SCORE.CREATURE_POINTS + this.currentEffects.creaturePointsBonus) *
      this.currentEffects.scoreMul *
      1.3
    );

    for (let i = 0; i < count; i++) {
      const target = this.createTargetNearEvent(event, 'creature', pointsBase);
      if (target) {
        this.targets.push(target);
      }
    }
  }

  private injectDangersNearEvent(event: OceanEvent, count: number) {
    for (let i = 0; i < count; i++) {
      const target = this.createTargetNearEvent(event, 'danger', GAME_CONFIG.SCORE.DANGER_PENALTY);
      if (target) {
        this.targets.push(target);
      }
    }
  }

  private injectWrecksNearEvent(event: OceanEvent, count: number) {
    const state = this.scoreSystem.getState();
    const pointsBase = Math.round(
      (GAME_CONFIG.SCORE.WRECK_POINTS + this.currentEffects.wreckPointsBonus) *
      this.currentEffects.scoreMul *
      1.5
    );

    for (let i = 0; i < count; i++) {
      const target = this.createTargetNearEvent(event, 'wreck', pointsBase);
      if (target) {
        this.targets.push(target);
      }
    }
  }

  private createTargetNearEvent(
    event: OceanEvent,
    type: 'creature' | 'danger' | 'wreck',
    points: number
  ): Target | null {
    const margin = GAME_CONFIG.TARGETS.SPAWN_MARGIN;
    const minR = GAME_CONFIG.TARGETS.MIN_RADIUS;
    const maxR = GAME_CONFIG.TARGETS.MAX_RADIUS;

    let attempts = 0;
    while (attempts < 50) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * event.radius * 0.8;
      const pos = {
        x: event.position.x + Math.cos(angle) * dist,
        y: event.position.y + Math.sin(angle) * dist,
      };

      pos.x = Math.max(margin, Math.min(GAME_CONFIG.MAP_WIDTH - margin, pos.x));
      pos.y = Math.max(margin, Math.min(this.currentEffects.mapHeight - margin, pos.y));

      const radius = minR + Math.random() * (maxR - minR);

      let overlapping = false;
      for (const t of this.targets) {
        const dx = pos.x - t.position.x;
        const dy = pos.y - t.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < radius + t.radius + GAME_CONFIG.TARGETS.SPAWN_MARGIN) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        let name = '';
        let shape: 'circle' | 'triangle' | 'square' | 'irregular' = 'circle';

        if (type === 'creature') {
          const names = ['发光水母', '深海鱼群', '巨型章鱼', '透明虾', '珊瑚虫'];
          name = names[Math.floor(Math.random() * names.length)];
          shape = 'circle';
        } else if (type === 'wreck') {
          const names = ['古代沉船', '货轮残骸', '潜艇残骸', '飞机残骸', '神秘箱子'];
          name = names[Math.floor(Math.random() * names.length)];
          shape = 'irregular';
        } else {
          const names = ['海底火山', '暗流漩涡', '巨型水母', '海底地雷'];
          name = names[Math.floor(Math.random() * names.length)];
          shape = Math.random() > 0.5 ? 'triangle' : 'square';
        }

        return {
          id: Date.now() + Math.floor(Math.random() * 100000) + attempts,
          type,
          position: pos,
          radius,
          name: `${event.name}·${name}`,
          points,
          discovered: false,
          collected: false,
          shape,
          rotation: Math.random() * Math.PI * 2,
          enhancedByEvent: event.type,
        };
      }
      attempts++;
    }

    return null;
  }

  setLoadout(loadout: ExpeditionLoadout) {
    this.currentLoadout = { ...loadout };
    this.currentEffects = computeLoadoutEffects(this.currentLoadout);

    this.renderer.setMapSize(GAME_CONFIG.MAP_WIDTH, this.currentEffects.mapHeight);
    this.targetGenerator.setSize(GAME_CONFIG.MAP_WIDTH, this.currentEffects.mapHeight);
    this.oceanEventSystem.setMapSize(GAME_CONFIG.MAP_WIDTH, this.currentEffects.mapHeight);
    
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
    this.sonar.setDetectorParams(
      this.currentEffects.echoRangeMul,
      this.currentEffects.echoCountMul,
      this.currentEffects.echoLifeMul,
      this.currentEffects.echoSizeMul,
      this.currentEffects.discoveryEfficiencyMul
    );
    this.scoreSystem.setParams({
      initialLivesBonus: this.currentEffects.livesBonus + (this.salvageEvent?.getBonusLives() ?? 0),
      maxSonarCharges: this.currentEffects.maxSonarCharges + (this.salvageEvent?.getBonusSonarCharges() ?? 0),
      initialSonarBonus: this.currentEffects.initialSonarBonus,
      scoreMul: this.currentEffects.scoreMul * wreckMultiplier,
      dangerLifePenaltyMul: this.currentEffects.dangerLifePenaltyMul,
      dangerScorePenaltyMul: this.currentEffects.dangerScorePenaltyMul,
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
    onOceanEventSpawned?: (event: OceanEvent) => void,
    onOceanEventExpired?: (event: OceanEvent) => void,
    onTreasureCollected?: (event: OceanEvent, points: number) => void,
    onMissionCompleted?: (mission: Mission) => void,
    onMissionProgress?: (mission: Mission) => void,
    onMissionEffectsChanged?: (effects: MissionEffect[]) => void,
    onComboEvent?: (event: ComboEvent) => void
  ) {
    this.onStateChange = onStateChange;
    this.onScoreEvent = onScoreEvent;
    this.onGameOver = onGameOver;
    this.onLevelUp = onLevelUp;
    this.onUnlock = onUnlock;
    this.onOceanEventSpawned = onOceanEventSpawned;
    this.onOceanEventExpired = onOceanEventExpired;
    this.onTreasureCollected = onTreasureCollected;
    this.onMissionCompleted = onMissionCompleted;
    this.onMissionProgress = onMissionProgress;
    this.onMissionEffectsChanged = onMissionEffectsChanged;
    this.onComboEvent = onComboEvent;

    this.scoreSystem.setStateCallbacks(
      (state) => this.onStateChange?.(state),
      (event) => this.onScoreEvent?.(event),
      (event) => this.onComboEvent?.(event)
    );

    this.missionSystem.setCallbacks(
      (mission) => {
        this.onMissionCompleted?.(mission);
        this.applyMissionEffects(mission);
      },
      (mission) => this.onMissionProgress?.(mission),
      (effects) => this.onMissionEffectsChanged?.(effects)
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
    this.oceanEventSystem.clear();
    this.oceanEventSystem.setLevel(state.level);
    this.oceanEventSystem.start();
    this.collection.resetSessionUnlocks();
    this.collectedCount = 0;
    this.collectedCreaturesAndWrecks = 0;
    this.lastRechargeTime = Date.now();
    this.playerPosition = {
      x: GAME_CONFIG.MAP_WIDTH / 2,
      y: 80,
    };

    this.missionSystem.reset();
    this.missionSystem.generateMissions(state.level);
    this.missionSystem.setLevelTargetCounts(state.level, this.countCollectibleTargets());

    this.applyMissionStartEffects();

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

    this.oceanEventSystem.update(delta, this.playerPosition);

    const { discoveredTargetIds, discoveredPositions } = this.sonar.update(delta, this.targets);
    for (let i = 0; i < discoveredTargetIds.length; i++) {
      const position = discoveredPositions[i] || undefined;
      this.scoreSystem.discoverTarget(position);
      this.missionSystem.onDiscoverTarget();
    }

    this.renderer.updateCamera(this.playerPosition.y);

    const now = Date.now();
    const rechargeModifier = this.getSonarRechargeModifier();
    const adjustedRechargeTime = GAME_CONFIG.SONAR.RECHARGE_TIME / rechargeModifier;
    if (now - this.lastRechargeTime >= adjustedRechargeTime) {
      this.scoreSystem.rechargeSonar();
      this.lastRechargeTime = now;
    }
  }

  private getSonarRechargeModifier(): number {
    let modifier = 1;
    const currentEvent = this.oceanEventSystem.isPositionInEvent(this.playerPosition, 'current');
    if (currentEvent) {
      modifier *= 1.3;
    }
    const interferenceEvent = this.oceanEventSystem.isPositionInEvent(this.playerPosition, 'interference');
    if (interferenceEvent) {
      modifier *= 0.7;
    }
    const missionRechargeBonus = this.missionSystem.getSonarRechargeSpeedBonus();
    modifier *= (1 + missionRechargeBonus);
    return modifier;
  }

  private render() {
    this.renderer.renderOceanEvents(this.oceanEventSystem.getActiveEvents());
    this.renderer.drawPlayer(this.playerPosition);
    this.renderer.renderWaves(this.sonar.getWaves());
    this.renderer.renderEchos(this.sonar.getEchoPoints());
    this.renderer.renderTargets(this.targets);
  }

  fireSonar(position: Position): boolean {
    if (!this.scoreSystem.useSonar()) return false;

    this.missionSystem.onFireSonar();

    const worldPos = { ...position };
    const radiusModifier = this.oceanEventSystem.getSonarRadiusModifier(worldPos);
    const speedModifier = this.oceanEventSystem.getSonarSpeedModifier(worldPos);
    
    const baseRadius = this.currentEffects.sonarRadius;
    const baseSpeed = this.currentEffects.sonarSpeed;
    
    this.sonar.setParams(
      baseRadius * radiusModifier,
      baseSpeed * speedModifier,
      this.currentEffects.precisionBonus
    );
    
    this.sonar.emitSonar(worldPos);
    this.renderer.addDiscoveredArea(worldPos, baseRadius * radiusModifier);
    return true;
  }

  movePlayer(targetY: number) {
    const mapSize = this.renderer.getMapSize();
    targetY = Math.max(50, Math.min(mapSize.height - 50, targetY));
    this.playerPosition.y += (targetY - this.playerPosition.y) * 0.15;
  }

  handleTap(worldPos: Position): { hit: boolean; target?: Target } {
    const treasureEvent = this.oceanEventSystem.tryCollectTreasure(worldPos);
    if (treasureEvent) {
      const treasurePoints = treasureEvent.effectValue * OCEAN_EVENT_CONFIG.TREASURE_POINTS_MULTIPLIER;
      this.scoreSystem.addBonus(treasurePoints, treasureEvent.name);
      this.onTreasureCollected?.(treasureEvent, treasurePoints);
      return { hit: true };
    }

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

        const scoreModifier = this.getScoreModifier(target.position);
        let adjustedPoints = target.points;
        if (target.type !== 'danger') {
          adjustedPoints = Math.round(target.points * scoreModifier);
          target.points = adjustedPoints;
        }

        const alive = this.scoreSystem.collectTarget(target);

        const state = this.scoreSystem.getState();
        this.missionSystem.onCollectTarget(target, state.level);

        const eventWreck = this.eventWreckMap.get(target.id);
        if (eventWreck && this.salvageEvent) {
          this.salvageEvent.recordWreckCollected(eventWreck, adjustedPoints);
        }

        const unlockEvent = this.collection.recordTarget(target, state.level, adjustedPoints);
        if (unlockEvent) {
          this.onUnlock?.(unlockEvent);
        }

        if (this.scoreSystem.checkLevelUp(this.collectedCreaturesAndWrecks)) {
          const levelUpState = this.scoreSystem.getState();
          this.missionSystem.onLevelUp(levelUpState.level);
          this.applyMissionStartEffects();

          const newTargets = this.targetGenerator.generateTargets(levelUpState.level);
          this.targets.push(...newTargets);
          this.injectEventWrecks(levelUpState.level);
          this.missionSystem.setLevelTargetCounts(levelUpState.level, this.countCollectibleTargets());
          this.oceanEventSystem.setLevel(levelUpState.level);
          this.onLevelUp?.(levelUpState.level);
        }

        if (!alive) {
          this.missionSystem.onGameOver();
          this.scoreSystem.endGame();
          this.salvageEvent?.recordExpeditionCompleted();
          this.oceanEventSystem.stop();
          this.onGameOver?.(this.scoreSystem.getFinalScore());
        }

        return { hit: true, target };
      }
    }
    return { hit: false };
  }

  private getScoreModifier(position: Position): number {
    let modifier = 1;
    const treasureEvent = this.oceanEventSystem.isPositionInEvent(position, 'treasure');
    if (treasureEvent) {
      modifier *= 1.2;
    }
    return modifier;
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

  getOceanEventSystem(): OceanEventSystem {
    return this.oceanEventSystem;
  }

  getMissionSystem(): MissionSystem {
    return this.missionSystem;
  }

  getSessionUnlocks() {
    return this.collection.getSessionUnlocks();
  }

  getComboStats() {
    return this.scoreSystem.getComboStats();
  }

  screenToWorld(screenX: number, screenY: number): Position {
    return this.renderer.screenToWorld(screenX, screenY);
  }

  private countCollectibleTargets(): number {
    return this.targets.filter((t) => !t.collected && t.type !== 'danger').length;
  }

  private applyMissionStartEffects(): void {
    const dangerModifier = this.missionSystem.getDangerCountModifier();
    this.targetGenerator.setMultipliers({
      creatureCountMul: this.currentEffects.creatureCountMul,
      wreckCountMul: this.currentEffects.wreckCountMul * (this.salvageEvent?.getState().isActive ? (this.salvageEvent?.getConfig().wreckCountMultiplier ?? 1) : 1),
      dangerCountMul: Math.max(0.2, this.currentEffects.dangerCountMul + dangerModifier * 0.2),
      creaturePointsBonus: this.currentEffects.creaturePointsBonus,
      wreckPointsBonus: this.currentEffects.wreckPointsBonus,
      scoreMul: this.currentEffects.scoreMul,
    });
  }

  private applyMissionEffects(mission: Mission): void {
    this.scoreSystem.addBonus(mission.completionBonus, `任务完成: ${mission.title}`);

    for (const effect of mission.rewardEffects) {
      switch (effect.type) {
        case 'extra_life':
          this.scoreSystem.addLife(effect.value);
          break;
        case 'sonar_charge_bonus':
          this.scoreSystem.addSonarCharges(effect.value);
          break;
      }
    }
  }

  destroy() {
    this.renderer.destroy();
  }
}
