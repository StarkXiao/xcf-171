import type { Position, OceanEvent, OceanEventType, OceanEventConfig } from '../types/game';
import { OCEAN_EVENTS, OCEAN_EVENT_CONFIG, getOceanEventConfig } from '../config/oceanEvents';

let eventIdCounter = 1;

export interface OceanEventSystemParams {
  mapWidth: number;
  mapHeight: number;
}

export type OceanEventTypeCallback = (event: OceanEvent) => void;
export type OceanEventCollectedCallback = (event: OceanEvent, points: number) => void;

export class OceanEventSystem {
  private events: OceanEvent[] = [];
  private mapWidth: number;
  private mapHeight: number;
  private currentLevel: number = 1;
  private spawnTimer: number = 0;
  private nextSpawnDelay: number = OCEAN_EVENT_CONFIG.INITIAL_SPAWN_DELAY;
  private isRunning: boolean = false;

  private onEventSpawned?: OceanEventTypeCallback;
  private onEventExpired?: OceanEventTypeCallback;
  private onTreasureCollected?: OceanEventCollectedCallback;

  constructor(params: OceanEventSystemParams) {
    this.mapWidth = params.mapWidth;
    this.mapHeight = params.mapHeight;
  }

  setMapSize(width: number, height: number) {
    this.mapWidth = width;
    this.mapHeight = height;
  }

  setCallbacks(
    onEventSpawned?: OceanEventTypeCallback,
    onEventExpired?: OceanEventTypeCallback,
    onTreasureCollected?: OceanEventCollectedCallback
  ) {
    this.onEventSpawned = onEventSpawned;
    this.onEventExpired = onEventExpired;
    this.onTreasureCollected = onTreasureCollected;
  }

  setLevel(level: number) {
    this.currentLevel = level;
  }

  start() {
    this.isRunning = true;
    this.spawnTimer = 0;
    this.nextSpawnDelay = OCEAN_EVENT_CONFIG.INITIAL_SPAWN_DELAY;
    this.events = [];
  }

  stop() {
    this.isRunning = false;
  }

  update(delta: number, playerPosition: Position) {
    if (!this.isRunning) return;

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.nextSpawnDelay) {
      this.spawnTimer = 0;
      this.trySpawnEvent();
      this.nextSpawnDelay = this.getRandomSpawnInterval();
    }

    for (const event of this.events) {
      if (!event.active) continue;

      event.remainingTime -= delta;

      if (event.remainingTime <= 0) {
        event.active = false;
        this.onEventExpired?.(event);
      }
    }

    this.events = this.events.filter((e) => e.active);
  }

  private getRandomSpawnInterval(): number {
    const min = OCEAN_EVENT_CONFIG.SPAWN_INTERVAL_MIN;
    const max = OCEAN_EVENT_CONFIG.SPAWN_INTERVAL_MAX;
    return min + Math.random() * (max - min);
  }

  private trySpawnEvent() {
    const eventTypes: OceanEventType[] = ['current', 'interference', 'treasure'];
    
    for (const type of eventTypes) {
      const config = getOceanEventConfig(type);
      const levelBonus = (this.currentLevel - 1) * OCEAN_EVENT_CONFIG.LEVEL_EVENT_BONUS;
      const spawnChance = Math.min(config.spawnChance + levelBonus, 0.6);

      const activeCount = this.events.filter((e) => e.type === type && e.active).length;
      if (activeCount >= config.maxCount) continue;

      if (Math.random() < spawnChance) {
        const event = this.createEvent(type);
        if (event) {
          this.events.push(event);
          this.onEventSpawned?.(event);
          return;
        }
      }
    }
  }

  private createEvent(type: OceanEventType): OceanEvent | null {
    const config = getOceanEventConfig(type);
    const margin = 80;

    let attempts = 0;
    while (attempts < 20) {
      const pos: Position = {
        x: margin + Math.random() * (this.mapWidth - 2 * margin),
        y: margin + Math.random() * (this.mapHeight - 2 * margin),
      };

      let overlapping = false;
      for (const existing of this.events) {
        if (!existing.active) continue;
        const dx = pos.x - existing.position.x;
        const dy = pos.y - existing.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.baseRadius + existing.radius + 50) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        const radiusVariation = 0.8 + Math.random() * 0.4;
        const durationVariation = 0.8 + Math.random() * 0.4;

        return {
          id: eventIdCounter++,
          type,
          name: config.name,
          description: config.description,
          position: pos,
          radius: config.baseRadius * radiusVariation,
          intensity: config.baseIntensity,
          duration: config.baseDuration * durationVariation,
          remainingTime: config.baseDuration * durationVariation,
          active: true,
          icon: config.icon,
          color: config.color,
          effectValue: config.effectValue,
        };
      }
      attempts++;
    }

    return null;
  }

  getActiveEvents(): OceanEvent[] {
    return this.events.filter((e) => e.active);
  }

  getEventsInRadius(position: Position, radius: number): OceanEvent[] {
    const result: OceanEvent[] = [];
    for (const event of this.events) {
      if (!event.active) continue;
      const dx = position.x - event.position.x;
      const dy = position.y - event.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius + event.radius) {
        result.push(event);
      }
    }
    return result;
  }

  isPositionInEvent(position: Position, eventType?: OceanEventType): OceanEvent | null {
    for (const event of this.events) {
      if (!event.active) continue;
      if (eventType && event.type !== eventType) continue;

      const dx = position.x - event.position.x;
      const dy = position.y - event.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= event.radius) {
        return event;
      }
    }
    return null;
  }

  getSonarRadiusModifier(position: Position): number {
    let modifier = 1;
    for (const event of this.events) {
      if (!event.active) continue;

      const dx = position.x - event.position.x;
      const dy = position.y - event.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= event.radius) {
        if (event.type === 'interference') {
          modifier *= event.effectValue;
        }
      }
    }
    return modifier;
  }

  getSonarSpeedModifier(position: Position): number {
    let modifier = 1;
    for (const event of this.events) {
      if (!event.active) continue;

      const dx = position.x - event.position.x;
      const dy = position.y - event.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= event.radius) {
        if (event.type === 'current') {
          modifier *= OCEAN_EVENT_CONFIG.CURRENT_SONAR_SPEED_BONUS;
        }
      }
    }
    return modifier;
  }

  getScoreModifier(position: Position): number {
    let modifier = 1;
    return modifier;
  }

  tryCollectTreasure(position: Position): OceanEvent | null {
    for (const event of this.events) {
      if (!event.active || event.type !== 'treasure') continue;

      const dx = position.x - event.position.x;
      const dy = position.y - event.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= event.radius + 20) {
        event.active = false;
        return event;
      }
    }
    return null;
  }

  clear() {
    this.events = [];
    this.spawnTimer = 0;
  }

  getState() {
    return {
      activeEvents: [...this.events],
      currentLevel: this.currentLevel,
      eventCount: this.events.filter((e) => e.active).length,
    };
  }
}
