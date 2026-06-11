import type {
  Position,
  Target,
  RelayGameState,
  RelayPlayer,
  RelayRoleType,
  RelayPhaseType,
  RelayEvent,
  RelayPhaseResult,
  RelayResult,
  SonarWave,
  EchoPoint,
} from '../types/game';
import { RELAY_CONFIG, RELAY_ROLES, RELAY_PHASES, RELAY_PHASE_SEQUENCE, RELAY_AVATARS, RELAY_PLAYER_NAMES } from '../config/relayConfig';
import { MapRenderer } from './MapRenderer';
import { SonarSystem } from './SonarSystem';
import { TargetGenerator } from './TargetGenerator';
import { CREATURE_NAMES, WRECK_NAMES, DANGER_NAMES } from '../config/gameConfig';
import type { ScoreEvent } from './ScoreSystem';
import { VoyageArchiveSystem } from './VoyageArchiveSystem';
import * as PIXI from 'pixi.js';

export class RelayModeSystem {
  private renderer: MapRenderer;
  private sonar: SonarSystem;
  private targetGenerator: TargetGenerator;
  private voyageArchive: VoyageArchiveSystem;

  private targets: Target[] = [];
  private playerPosition: Position;
  private moveTarget: Position;
  private isInitialized: boolean = false;
  private lastRechargeTime: number = 0;
  private lastUpdateTime: number = 0;

  private state: RelayGameState;
  private phaseResults: RelayPhaseResult[] = [];
  private currentPhaseEvents: string[] = [];
  private phaseStartScore: number = 0;
  private phaseStartDiscoveries: number = 0;
  private phaseStartSonarUsed: number = 0;
  private phaseStartDamage: number = 0;
  private totalSonarUsed: number = 0;

  private onStateChange?: (state: RelayGameState) => void;
  private onEvent?: (event: RelayEvent) => void;
  private onGameOver?: (result: RelayResult) => void;
  private onScoreEvent?: (event: ScoreEvent) => void;

  constructor(container: HTMLElement, voyageArchiveSystem?: VoyageArchiveSystem) {
    this.voyageArchive = voyageArchiveSystem ?? new VoyageArchiveSystem();
    this.renderer = new MapRenderer(container, RELAY_CONFIG.MAP.WIDTH, RELAY_CONFIG.MAP.HEIGHT);
    this.sonar = new SonarSystem();
    this.targetGenerator = new TargetGenerator(RELAY_CONFIG.MAP.WIDTH, RELAY_CONFIG.MAP.HEIGHT);

    this.playerPosition = {
      x: RELAY_CONFIG.MAP.WIDTH / 2,
      y: 80,
    };
    this.moveTarget = { ...this.playerPosition };

    this.state = this.createInitialState();
    this.sonar.setEchoCallback((echos) => this.handleEcho(echos));
  }

  private createInitialState(): RelayGameState {
    return {
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      isVictory: false,
      currentPhaseIndex: 0,
      phases: [...RELAY_PHASE_SEQUENCE],
      currentPlayerIndex: 0,
      players: [],
      shared: {
        score: 0,
        lives: RELAY_CONFIG.GAME.INITIAL_LIVES,
        maxLives: RELAY_CONFIG.GAME.INITIAL_LIVES,
        sonarCharges: RELAY_CONFIG.GAME.INITIAL_SONAR_CHARGES,
        maxSonarCharges: RELAY_CONFIG.GAME.INITIAL_SONAR_CHARGES,
        level: 1,
        discoveredTargets: 0,
        totalTargets: 0,
        combo: 0,
        maxCombo: 0,
      },
      phaseStartTime: 0,
      totalPlayTime: 0,
      currentPhaseTimeRemaining: 0,
    };
  }

  setCallbacks(
    onStateChange: (state: RelayGameState) => void,
    onEvent: (event: RelayEvent) => void,
    onGameOver: (result: RelayResult) => void,
    onScoreEvent?: (event: ScoreEvent) => void,
  ) {
    this.onStateChange = onStateChange;
    this.onEvent = onEvent;
    this.onGameOver = onGameOver;
    this.onScoreEvent = onScoreEvent;
  }

  setupPlayers(count: number, customNames?: string[]) {
    const players: RelayPlayer[] = [];
    const availableRoles: RelayRoleType[] = ['sonar_operator', 'navigator', 'collector'];

    for (let i = 0; i < count; i++) {
      players.push({
        id: i,
        name: customNames?.[i] || RELAY_PLAYER_NAMES[i] || `玩家${i + 1}`,
        role: availableRoles[i % availableRoles.length],
        avatar: RELAY_AVATARS[i % RELAY_AVATARS.length],
        stats: {
          score: 0,
          discoveries: 0,
          sonarUsed: 0,
          damageTaken: 0,
          timePlayed: 0,
        },
      });
    }

    this.state.players = players;
    this.applyPlayerBonuses();
    this.notifyStateChange();
  }

  private applyPlayerBonuses() {
    let livesBonus = 0;
    let sonarBonus = 0;

    for (const player of this.state.players) {
      const role = RELAY_ROLES[player.role];
      if (role.stats.livesBonus) livesBonus += role.stats.livesBonus;
      if (role.stats.sonarChargesBonus) sonarBonus += role.stats.sonarChargesBonus;
    }

    this.state.shared.maxLives = RELAY_CONFIG.GAME.INITIAL_LIVES + livesBonus;
    this.state.shared.lives = this.state.shared.maxLives;
    this.state.shared.maxSonarCharges = RELAY_CONFIG.GAME.INITIAL_SONAR_CHARGES + sonarBonus;
    this.state.shared.sonarCharges = this.state.shared.maxSonarCharges;
  }

  getState(): RelayGameState {
    return { ...this.state };
  }

  getCurrentPlayer(): RelayPlayer | null {
    if (this.state.players.length === 0) return null;
    return this.state.players[this.state.currentPlayerIndex];
  }

  getCurrentPhase(): RelayPhaseType {
    return this.state.phases[this.state.currentPhaseIndex];
  }

  getCurrentRole(): RelayRoleType {
    return RELAY_PHASES[this.getCurrentPhase()].role;
  }

  startGame() {
    this.state = this.createInitialState();
    this.phaseResults = [];
    this.currentPhaseEvents = [];
    this.totalSonarUsed = 0;
    this.applyPlayerBonuses();

    this.state.isPlaying = true;
    this.state.isGameOver = false;
    this.lastUpdateTime = performance.now();
    this.lastRechargeTime = performance.now();

    this.generateLevel();
    this.startPhase(0);
    this.notifyStateChange();
  }

  private generateLevel() {
    const level = this.state.shared.level;

    this.targets = this.targetGenerator.generateTargets(level);

    this.state.shared.totalTargets = this.targets.filter(t => t.type !== 'danger').length;
    this.state.shared.discoveredTargets = 0;

    this.renderer.clearDiscovered();
    this.renderer.renderTargets(this.targets);

    this.playerPosition = { x: RELAY_CONFIG.MAP.WIDTH / 2, y: 80 };
    this.moveTarget = { ...this.playerPosition };
  }

  private startPhase(phaseIndex: number) {
    this.state.currentPhaseIndex = phaseIndex;
    const phase = this.state.phases[phaseIndex];
    const playerIndex = phaseIndex % this.state.players.length;
    const fromPlayerId = this.state.players[this.state.currentPlayerIndex]?.id ?? 0;

    this.state.currentPlayerIndex = playerIndex;
    this.state.phaseStartTime = performance.now();
    this.state.currentPhaseTimeRemaining = RELAY_PHASES[phase].duration ?? 60;

    this.phaseStartScore = this.state.shared.score;
    this.phaseStartDiscoveries = this.state.shared.discoveredTargets;
    this.phaseStartSonarUsed = this.totalSonarUsed;
    this.phaseStartDamage = this.getTotalDamageTaken();
    this.currentPhaseEvents = [];

    const player = this.getCurrentPlayer();
    if (player) {
      this.onEvent?.({
        type: 'phase_start',
        phase,
        playerId: player.id,
      });

      this.onEvent?.({
        type: 'player_switch',
        fromPlayerId,
        toPlayerId: player.id,
      });
    }

    this.applyPhaseSonarParams();
  }

  private applyPhaseSonarParams() {
    const role = RELAY_ROLES[this.getCurrentRole()];
    let radiusMul = role.stats.sonarRadiusMul ?? 1;
    let speedMul = role.stats.sonarSpeedMul ?? 1;

    this.sonar.setParams(
      RELAY_CONFIG.SONAR.MAX_RADIUS * radiusMul,
      RELAY_CONFIG.SONAR.SPEED * speedMul,
      0,
    );
  }

  private getTotalDamageTaken(): number {
    return this.state.players.reduce((sum, p) => sum + p.stats.damageTaken, 0);
  }

  update(deltaTime: number) {
    if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;

    const now = performance.now();

    this.state.currentPhaseTimeRemaining -= deltaTime;
    this.state.totalPlayTime += deltaTime;

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer) {
      currentPlayer.stats.timePlayed += deltaTime;
    }

    if (this.state.currentPhaseTimeRemaining <= 0) {
      this.endCurrentPhase();
      return;
    }

    if (!this.disableSonarRechargeForPhase()) {
      if (now - this.lastRechargeTime >= RELAY_CONFIG.SONAR.RECHARGE_TIME) {
        if (this.state.shared.sonarCharges < this.state.shared.maxSonarCharges) {
          this.state.shared.sonarCharges++;
          this.notifyStateChange();
        }
        this.lastRechargeTime = now;
      }
    }

    this.updatePlayerMovement(deltaTime);
    this.sonar.update(deltaTime, this.targets);
    this.renderSonar();
    this.renderer.drawPlayer(this.playerPosition);
    this.lastUpdateTime = now;
  }

  private disableSonarRechargeForPhase(): boolean {
    return this.getCurrentPhase() === 'collection';
  }

  private updatePlayerMovement(deltaTime: number) {
    const role = RELAY_ROLES[this.getCurrentRole()];
    const speedMul = role.stats.moveSpeedMul ?? 1;
    const speed = 100 * speedMul;

    const dx = this.moveTarget.x - this.playerPosition.x;
    const dy = this.moveTarget.y - this.playerPosition.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const moveX = (dx / dist) * speed * deltaTime;
      const moveY = (dy / dist) * speed * deltaTime;
      const moveDist = Math.min(dist, Math.sqrt(moveX * moveX + moveY * moveY));

      this.playerPosition.x += (dx / dist) * moveDist;
      this.playerPosition.y += (dy / dist) * moveDist;

      this.checkDangerCollision();
    }
  }

  private checkDangerCollision() {
    for (const target of this.targets) {
      if (target.type === 'danger' && !target.collected) {
        const dx = this.playerPosition.x - target.position.x;
        const dy = this.playerPosition.y - target.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < target.radius + 10) {
          this.takeDamage(target);
          target.collected = true;
          break;
        }
      }
    }
  }

  private takeDamage(target: Target) {
    const player = this.getCurrentPlayer();
    if (!player) return;

    this.state.shared.lives--;
    this.state.shared.combo = 0;
    player.stats.damageTaken++;

    const penalty = RELAY_CONFIG.SCORE.DANGER_PENALTY;
    this.addScore(penalty, target.name, { x: target.position.x, y: target.position.y }, 'damage');

    this.onEvent?.({ type: 'combo_break' });
    this.onEvent?.({ type: 'danger_hit', targetType: target.name });
    this.currentPhaseEvents.push(`触碰${target.name}`);

    if (this.state.shared.lives <= 0) {
      this.endGame(false);
    }

    this.notifyStateChange();
  }

  fireSonar(position: Position) {
    if (this.state.shared.sonarCharges <= 0) return;
    if (this.getCurrentPhase() === 'collection') return;

    this.state.shared.sonarCharges--;
    this.totalSonarUsed++;

    const player = this.getCurrentPlayer();
    if (player) {
      player.stats.sonarUsed++;
    }

    this.sonar.emitSonar(position);
    this.notifyStateChange();
  }

  private handleEcho(echos: EchoPoint[]) {
    for (const echo of echos) {
      const target = this.targets.find(t => t.id === echo.targetId);
      if (!target || target.discovered) continue;

      target.discovered = true;
      this.state.shared.discoveredTargets++;

      const player = this.getCurrentPlayer();
      if (player) {
        player.stats.discoveries++;
      }

      this.addScore(
        RELAY_CONFIG.SCORE.TARGET_DISCOVERY_BONUS,
        target.name,
        echo.position,
        'collect',
      );

      this.onEvent?.({ type: 'target_discovered', targetType: target.name });
      this.currentPhaseEvents.push(`发现${target.name}`);
    }
    this.notifyStateChange();
  }

  handleTap(position: Position): { hit: boolean; target?: Target } {
    const phase = this.getCurrentPhase();

    if (phase === 'collection') {
      for (const target of this.targets) {
        if (target.type !== 'danger' && target.discovered && !target.collected) {
          const dx = position.x - target.position.x;
          const dy = position.y - target.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < target.radius + 15) {
            this.collectTarget(target);
            return { hit: true, target };
          }
        }
      }
    }

    return { hit: false };
  }

  private collectTarget(target: Target) {
    target.collected = true;
    const player = this.getCurrentPlayer();
    if (!player) return;

    const role = RELAY_ROLES[player.role];
    const scoreMul = role.stats.scoreMul ?? 1;

    let basePoints = target.type === 'creature'
      ? RELAY_CONFIG.SCORE.CREATURE_POINTS
      : RELAY_CONFIG.SCORE.WRECK_POINTS;

    basePoints = Math.floor(basePoints * scoreMul);

    this.state.shared.combo = Math.min(
      this.state.shared.combo + 1,
      RELAY_CONFIG.GAME.MAX_COMBO,
    );
    this.state.shared.maxCombo = Math.max(this.state.shared.maxCombo, this.state.shared.combo);

    const comboBonus = Math.floor(basePoints * this.state.shared.combo * RELAY_CONFIG.GAME.COMBO_MULTIPLIER);
    const totalPoints = basePoints + comboBonus;

    this.addScore(totalPoints, target.name, target.position, 'collect');
    player.stats.score += totalPoints;

    this.onEvent?.({ type: 'combo_increase', combo: this.state.shared.combo });
    this.currentPhaseEvents.push(`收集${target.name}+${totalPoints}`);

    this.checkLevelComplete();
    this.notifyStateChange();
  }

  private addScore(points: number, name: string, position: Position, type: 'collect' | 'damage' | 'levelUp') {
    this.state.shared.score = Math.max(0, this.state.shared.score + points);

    this.onScoreEvent?.({
      points,
      targetName: name,
      position,
      type,
    });
  }

  private checkLevelComplete() {
    const collected = this.targets.filter(
      t => t.type !== 'danger' && t.collected,
    ).length;

    const total = this.targets.filter(t => t.type !== 'danger').length;

    if (collected >= total * 0.8) {
      this.completeLevel();
    }
  }

  private completeLevel() {
    const timeBonus = Math.floor(this.state.currentPhaseTimeRemaining * RELAY_CONFIG.SCORE.TIME_BONUS_PER_SEC);
    const levelBonus = RELAY_CONFIG.GAME.LEVEL_CLEAR_BONUS * this.state.shared.level;

    this.addScore(timeBonus + levelBonus, '关卡完成', this.playerPosition, 'levelUp');

    this.onEvent?.({
      type: 'shared_gained',
      bonus: timeBonus + levelBonus,
      resourceType: 'score',
    });

    if (this.state.shared.level >= RELAY_CONFIG.GAME.MAX_LEVELS) {
      this.endGame(true);
    } else {
      this.state.shared.level++;
      this.generateLevel();
      this.notifyStateChange();
    }
  }

  setMoveTarget(position: Position) {
    if (this.getCurrentPhase() === 'navigation') {
      this.moveTarget = { ...position };
    }
  }

  private endCurrentPhase() {
    const phase = this.getCurrentPhase();
    const player = this.getCurrentPlayer();
    if (!player) return;

    const scoreGained = this.state.shared.score - this.phaseStartScore;
    const discoveries = this.state.shared.discoveredTargets - this.phaseStartDiscoveries;
    const sonarUsed = this.totalSonarUsed - this.phaseStartSonarUsed;
    const damageTaken = this.getTotalDamageTaken() - this.phaseStartDamage;
    const duration = (RELAY_PHASES[phase].duration ?? 60) - this.state.currentPhaseTimeRemaining;

    const phaseResult: RelayPhaseResult = {
      phase,
      playerId: player.id,
      scoreGained,
      discoveries,
      sonarUsed,
      damageTaken,
      duration,
      completed: this.checkPhaseCompletion(phase),
      events: [...this.currentPhaseEvents],
    };

    this.phaseResults.push(phaseResult);

    if (phaseResult.completed) {
      this.addScore(RELAY_CONFIG.SCORE.PHASE_COMPLETION_BONUS, '阶段完成', this.playerPosition, 'collect');
    }

    this.onEvent?.({ type: 'phase_end', result: phaseResult });

    const nextPhaseIndex = this.state.currentPhaseIndex + 1;
    if (nextPhaseIndex >= this.state.phases.length) {
      if (this.state.shared.level >= RELAY_CONFIG.GAME.MAX_LEVELS) {
        this.endGame(true);
      } else {
        this.startPhase(0);
      }
    } else {
      this.startPhase(nextPhaseIndex);
    }

    this.notifyStateChange();
  }

  private checkPhaseCompletion(phase: RelayPhaseType): boolean {
    switch (phase) {
      case 'detection':
        return this.state.shared.discoveredTargets >= 4;
      case 'navigation':
        return this.playerPosition.y >= RELAY_CONFIG.MAP.HEIGHT - 100;
      case 'collection':
        const collected = this.targets.filter(t => t.type !== 'danger' && t.collected).length;
        return collected >= this.state.shared.discoveredTargets * 0.8;
      default:
        return false;
    }
  }

  private endGame(victory: boolean) {
    this.state.isPlaying = false;
    this.state.isGameOver = true;
    this.state.isVictory = victory;

    const result = this.calculateFinalResult(victory);
    this.onGameOver?.(result);
    this.notifyStateChange();
  }

  private calculateFinalResult(victory: boolean): RelayResult {
    const totalScore = this.state.shared.score;
    const playerResults = this.state.players.map(player => {
      const contribution = totalScore > 0 ? Math.round((player.stats.score / totalScore) * 100) : 0;
      return {
        playerId: player.id,
        role: player.role,
        totalScore: player.stats.score,
        discoveries: player.stats.discoveries,
        sonarUsed: player.stats.sonarUsed,
        damageTaken: player.stats.damageTaken,
        timePlayed: player.stats.timePlayed,
        contribution,
      };
    });

    const rank = this.calculateRank(totalScore, victory);
    const isNewRecord = this.checkNewRecord(totalScore);

    return {
      victory,
      finalScore: totalScore,
      totalDiscoveries: this.state.players.reduce((sum, p) => sum + p.stats.discoveries, 0),
      totalLevels: this.state.shared.level - 1,
      livesRemaining: this.state.shared.lives,
      totalPlayTime: this.state.totalPlayTime,
      maxCombo: this.state.shared.maxCombo,
      playerResults,
      phaseResults: [...this.phaseResults],
      rank,
      isNewRecord,
    };
  }

  private calculateRank(score: number, victory: boolean): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (!victory) return 'D';
    if (score >= 10000) return 'S';
    if (score >= 7000) return 'A';
    if (score >= 4000) return 'B';
    if (score >= 2000) return 'C';
    return 'D';
  }

  private checkNewRecord(score: number): boolean {
    try {
      const saved = localStorage.getItem('deepSeaSonar_relayHighScore');
      const highScore = saved ? parseInt(saved, 10) : 0;
      if (score > highScore) {
        localStorage.setItem('deepSeaSonar_relayHighScore', String(score));
        return true;
      }
    } catch (_e) {}
    return false;
  }

  private renderSonar() {
    const waves = this.sonar.getWaves();
    const echoes = this.sonar.getEchoPoints();

    this.renderer.renderWaves(waves);
    this.renderer.renderEchos(echoes);
  }

  screenToWorld(screenX: number, screenY: number): Position | null {
    return this.renderer.screenToWorld(screenX, screenY);
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  destroy() {
    this.renderer.destroy();
  }

  getTicker(): PIXI.Ticker {
    return this.renderer.getTicker();
  }
}
