import type {
  VoyageRecord,
  VoyageFilters,
  VoyageArchiveStats,
  VoyageMode,
  TrajectoryPoint,
  ScoreBreakdown,
  HitRateStats,
  AnomalyEvent,
  AnomalyEventType,
  DifficultyRecommendation,
  Position,
  ScoreBreakdownItem,
  ExpeditionLoadout,
  DailyChallengeConfig,
  GameState,
  RescueResult,
} from '../types/game';
import type { ScoreEvent } from './ScoreSystem';
import { GAME_CONFIG } from '../config/gameConfig';

const STORAGE_KEY = 'deepSeaSonar_voyageArchive';
const MAX_VOYAGES = 200;
const TRAJECTORY_INTERVAL = 200;

export interface ActiveVoyageBuilder {
  id: string;
  mode: VoyageMode;
  startedAt: number;
  startedAtLevel: number;
  lastTrajectoryTime: number;
  trajectory: TrajectoryPoint[];
  scoreEvents: ScoreEvent[];
  scoreCategoryMap: Record<string, ScoreBreakdownItem>;
  hitRate: {
    totalSonarFired: number;
    sonarWithDiscovery: number;
    lastDiscoveredCount: number;
    totalTaps: number;
    tapsWithHit: number;
    tapsWithMiss: number;
    totalTargets: number;
    collectedTargets: number;
    discoveredTargets: number;
  };
  anomalies: AnomalyEvent[];
  peakScore: number;
  peakLevel: number;
  livesLost: number;
  currentLevelStartTime: number;
  levelDurations: number[];
  dangerHitCount: number;
  loadout?: ExpeditionLoadout;
  dailyChallengeTitle?: string;
  rescueLevel?: number;
  lastGameState?: GameState;
}

export class VoyageArchiveSystem {
  private records: VoyageRecord[] = [];
  private activeBuilder: ActiveVoyageBuilder | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.records = parsed.filter((r) => r && r.id);
        }
      }
    } catch (_e) {}
  }

  private saveToStorage() {
    try {
      const toSave = this.records.slice(0, MAX_VOYAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (_e) {}
  }

  private generateId(): string {
    return `voy_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private anomalyId(): string {
    return `anom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  private getModeLabel(mode: VoyageMode): string {
    const map: Record<VoyageMode, string> = {
      normal: '常规探险',
      daily_challenge: '每日挑战',
      rescue: '救援任务',
      custom: '自定义海域',
    };
    return map[mode] || '未知';
  }

  startVoyage(
    mode: VoyageMode,
    loadout?: ExpeditionLoadout,
    dailyChallenge?: DailyChallengeConfig | null,
    customConfig?: any
  ): ActiveVoyageBuilder {
    const now = Date.now();
    let effectiveMode: VoyageMode = mode;
    if (customConfig) effectiveMode = 'custom';

    this.activeBuilder = {
      id: this.generateId(),
      mode: effectiveMode,
      startedAt: now,
      startedAtLevel: 1,
      lastTrajectoryTime: now,
      trajectory: [],
      scoreEvents: [],
      scoreCategoryMap: {},
      hitRate: {
        totalSonarFired: 0,
        sonarWithDiscovery: 0,
        lastDiscoveredCount: 0,
        totalTaps: 0,
        tapsWithHit: 0,
        tapsWithMiss: 0,
        totalTargets: 0,
        collectedTargets: 0,
        discoveredTargets: 0,
      },
      anomalies: [],
      peakScore: 0,
      peakLevel: 1,
      livesLost: 0,
      currentLevelStartTime: now,
      levelDurations: [],
      dangerHitCount: 0,
      loadout: loadout ? { ...loadout } : undefined,
      dailyChallengeTitle: dailyChallenge?.title,
    };

    return this.activeBuilder;
  }

  startRescueVoyage(level: number): ActiveVoyageBuilder {
    const now = Date.now();
    this.activeBuilder = {
      id: this.generateId(),
      mode: 'rescue',
      startedAt: now,
      startedAtLevel: level,
      lastTrajectoryTime: now,
      trajectory: [],
      scoreEvents: [],
      scoreCategoryMap: {},
      hitRate: {
        totalSonarFired: 0,
        sonarWithDiscovery: 0,
        lastDiscoveredCount: 0,
        totalTaps: 0,
        tapsWithHit: 0,
        tapsWithMiss: 0,
        totalTargets: 0,
        collectedTargets: 0,
        discoveredTargets: 0,
      },
      anomalies: [],
      peakScore: 0,
      peakLevel: level,
      livesLost: 0,
      currentLevelStartTime: now,
      levelDurations: [],
      dangerHitCount: 0,
      rescueLevel: level,
    };
    return this.activeBuilder;
  }

  recordTrajectory(position: Position, event?: TrajectoryPoint['event']) {
    if (!this.activeBuilder) return;
    const now = Date.now();
    const shouldRecord = event || now - this.activeBuilder.lastTrajectoryTime >= TRAJECTORY_INTERVAL;
    if (!shouldRecord) return;

    this.activeBuilder.trajectory.push({
      timestamp: now,
      position: { x: position.x, y: position.y },
      event,
    });
    this.activeBuilder.lastTrajectoryTime = now;
  }

  recordScoreEvent(event: ScoreEvent, state: GameState) {
    if (!this.activeBuilder) return;
    this.activeBuilder.scoreEvents.push(event);

    if (state.score > this.activeBuilder.peakScore) {
      this.activeBuilder.peakScore = state.score;
    }
    if (state.level > this.activeBuilder.peakLevel) {
      this.activeBuilder.peakLevel = state.level;
    }

    let category: ScoreBreakdownItem['category'] = 'bonus';
    if (event.type === 'collect') {
      if (event.targetName.includes('生物') || event.type === 'collect' && event.points > 0) {
        category = 'creature';
      }
      if (event.points < 0) {
        category = 'danger';
      }
    } else if (event.type === 'damage') {
      category = 'danger';
    } else if (event.type === 'levelUp') {
      category = 'level_up';
    }

    const key = `${category}_${event.targetName}`;
    if (!this.activeBuilder.scoreCategoryMap[key]) {
      this.activeBuilder.scoreCategoryMap[key] = {
        category,
        name: event.targetName,
        count: 0,
        totalPoints: 0,
        avgPoints: 0,
      };
    }
    const item = this.activeBuilder.scoreCategoryMap[key];
    item.count++;
    item.totalPoints += event.points;
    item.avgPoints = Math.round(item.totalPoints / item.count);
  }

  recordSonarFired(position: Position, discoveredCountBefore: number, discoveredCountAfter: number) {
    if (!this.activeBuilder) return;
    this.activeBuilder.hitRate.totalSonarFired++;
    if (discoveredCountAfter > discoveredCountBefore) {
      this.activeBuilder.hitRate.sonarWithDiscovery++;
    }
    this.recordTrajectory(position, 'sonar');
  }

  recordTap(position: Position, hit: boolean) {
    if (!this.activeBuilder) return;
    this.activeBuilder.hitRate.totalTaps++;
    if (hit) {
      this.activeBuilder.hitRate.tapsWithHit++;
      this.activeBuilder.hitRate.collectedTargets++;
      this.recordTrajectory(position, 'collect');
    } else {
      this.activeBuilder.hitRate.tapsWithMiss++;
    }
  }

  recordTargetInfo(totalTargets: number) {
    if (!this.activeBuilder) return;
    this.activeBuilder.hitRate.totalTargets = Math.max(
      this.activeBuilder.hitRate.totalTargets,
      totalTargets
    );
  }

  recordDiscovered(discoveredCount: number) {
    if (!this.activeBuilder) return;
    this.activeBuilder.hitRate.discoveredTargets = Math.max(
      this.activeBuilder.hitRate.discoveredTargets,
      discoveredCount
    );
  }

  recordLevelUp(newLevel: number) {
    if (!this.activeBuilder) return;
    const now = Date.now();
    this.activeBuilder.levelDurations.push(now - this.activeBuilder.currentLevelStartTime);
    this.activeBuilder.currentLevelStartTime = now;
    this.activeBuilder.peakLevel = Math.max(this.activeBuilder.peakLevel, newLevel);
  }

  recordDamage(position: Position, reason: string, livesLost: number) {
    if (!this.activeBuilder) return;
    this.activeBuilder.livesLost += livesLost;
    this.activeBuilder.dangerHitCount++;
    this.addAnomaly({
      type: 'danger_hit',
      position,
      description: `${reason}（损失 ${livesLost} 条生命）`,
      severity: livesLost >= 2 ? 'high' : 'medium',
      data: { reason, livesLost },
    });
  }

  recordEmptySonar(position: Position) {
    this.addAnomaly({
      type: 'sonar_empty',
      position,
      description: '空放声呐，未发现任何目标',
      severity: 'low',
    });
  }

  addAnomaly(params: {
    type: AnomalyEventType;
    position: Position;
    description: string;
    severity: AnomalyEvent['severity'];
    data?: Record<string, any>;
  }) {
    if (!this.activeBuilder) return;
    this.activeBuilder.anomalies.push({
      id: this.anomalyId(),
      type: params.type,
      timestamp: Date.now(),
      position: { x: params.position.x, y: params.position.y },
      description: params.description,
      severity: params.severity,
      data: params.data,
    });
  }

  updateGameState(state: GameState) {
    if (!this.activeBuilder) return;
    this.activeBuilder.lastGameState = { ...state };
    if (state.score > this.activeBuilder.peakScore) {
      this.activeBuilder.peakScore = state.score;
    }
    if (state.level > this.activeBuilder.peakLevel) {
      this.activeBuilder.peakLevel = state.level;
    }
  }

  finishVoyage(state: GameState, isVictory: boolean, isNewRecord: boolean, rescueResult?: RescueResult): VoyageRecord | null {
    if (!this.activeBuilder) return null;

    const builder = this.activeBuilder;
    const now = Date.now();
    const duration = now - builder.startedAt;

    if (builder.currentLevelStartTime > 0) {
      builder.levelDurations.push(now - builder.currentLevelStartTime);
    }

    const scoreBreakdown = this.buildScoreBreakdown(builder);
    const hitRate = this.buildHitRate(builder);

    const record: VoyageRecord = {
      id: builder.id,
      mode: builder.mode,
      modeLabel: this.getModeLabel(builder.mode),
      startedAt: builder.startedAt,
      endedAt: now,
      duration,
      finalScore: state.score,
      peakScore: Math.max(builder.peakScore, state.score),
      finalLevel: state.level,
      peakLevel: Math.max(builder.peakLevel, state.level),
      loadout: builder.loadout,
      dailyChallengeTitle: builder.dailyChallengeTitle,
      rescueLevel: builder.rescueLevel,
      isVictory,
      isNewRecord,
      trajectory: builder.trajectory.slice(0, 500),
      scoreBreakdown,
      hitRate,
      anomalies: builder.anomalies,
    };

    if (rescueResult) {
      record.rank = rescueResult.rank;
      record.rescueDetails = {
        capsulesFound: rescueResult.capsulesRescued,
        capsulesRescued: rescueResult.capsulesRescued,
        totalRealCapsules: rescueResult.totalRealCapsules,
        falseReports: rescueResult.falseReports,
        sonarUsed: rescueResult.sonarUsed,
        accuracy: rescueResult.accuracy,
        pathCompletionRate: rescueResult.pathCompletionRate,
        offtrackCount: rescueResult.offtrackCount,
        highRiskIncursions: rescueResult.highRiskIncursions,
        blockerCollisions: rescueResult.blockerCollisions,
        safeTravelDistance: rescueResult.safeTravelDistance,
        totalPathLength: rescueResult.totalPathLength,
        perfectPathBonus: rescueResult.perfectPathBonus,
      };
      record.finalScore = rescueResult.score;
      record.peakScore = rescueResult.score;
      record.finalLevel = rescueResult.level;
      record.peakLevel = rescueResult.level;
      record.isVictory = rescueResult.victory;
    }

    record.difficultySnapshot = {
      mapWidth: GAME_CONFIG.MAP_WIDTH,
      mapHeight: GAME_CONFIG.MAP_HEIGHT,
      targetDensity: {
        creature: GAME_CONFIG.TARGETS.CREATURE_COUNT,
        wreck: GAME_CONFIG.TARGETS.WRECK_COUNT,
        danger: GAME_CONFIG.TARGETS.DANGER_COUNT,
      },
      initialLives: GAME_CONFIG.GAME.INITIAL_LIVES,
      sonarMaxCharges: GAME_CONFIG.SONAR.MAX_CHARGES,
      sonarRechargeTime: GAME_CONFIG.SONAR.RECHARGE_TIME,
      targetsPerLevel: GAME_CONFIG.GAME.TARGETS_PER_LEVEL,
    };

    this.records.unshift(record);
    if (this.records.length > MAX_VOYAGES) {
      this.records = this.records.slice(0, MAX_VOYAGES);
    }
    this.saveToStorage();

    this.activeBuilder = null;
    return record;
  }

  private buildScoreBreakdown(builder: ActiveVoyageBuilder): ScoreBreakdown {
    const items = Object.values(builder.scoreCategoryMap);
    let totalScore = 0;
    let fromCreatures = 0;
    let fromWrecks = 0;
    let fromDanger = 0;
    let fromBonus = 0;
    let fromLevelUp = 0;
    let fromCombo = 0;

    for (const item of items) {
      totalScore += item.totalPoints;
      switch (item.category) {
        case 'creature':
          fromCreatures += item.totalPoints;
          break;
        case 'wreck':
          fromWrecks += item.totalPoints;
          break;
        case 'danger':
          fromDanger += item.totalPoints;
          break;
        case 'level_up':
          fromLevelUp += item.totalPoints;
          break;
        case 'combo':
          fromCombo += item.totalPoints;
          break;
        case 'bonus':
        default:
          fromBonus += item.totalPoints;
          break;
      }
    }

    return {
      items: items.sort((a, b) => Math.abs(b.totalPoints) - Math.abs(a.totalPoints)),
      totalScore,
      fromCreatures,
      fromWrecks,
      fromDanger,
      fromBonus,
      fromLevelUp,
      fromCombo,
    };
  }

  private buildHitRate(builder: ActiveVoyageBuilder): HitRateStats {
    const h = builder.hitRate;
    const discoveryRate = h.totalSonarFired > 0 ? h.sonarWithDiscovery / h.totalSonarFired : 0;
    const tapAccuracy = h.totalTaps > 0 ? h.tapsWithHit / h.totalTaps : 0;
    const collectionRate = h.totalTargets > 0 ? h.collectedTargets / h.totalTargets : 0;
    const discoveryCoverage = h.totalTargets > 0 ? h.discoveredTargets / h.totalTargets : 0;
    const avgSonarPerDiscovery =
      h.sonarWithDiscovery > 0 ? h.totalSonarFired / h.sonarWithDiscovery : h.totalSonarFired;

    return {
      totalSonarFired: h.totalSonarFired,
      sonarWithDiscovery: h.sonarWithDiscovery,
      discoveryRate,
      totalTaps: h.totalTaps,
      tapsWithHit: h.tapsWithHit,
      tapAccuracy,
      tapsWithMiss: h.tapsWithMiss,
      totalTargets: h.totalTargets,
      collectedTargets: h.collectedTargets,
      collectionRate,
      discoveredTargets: h.discoveredTargets,
      discoveryCoverage,
      avgSonarPerDiscovery,
    };
  }

  getRecords(filters?: Partial<VoyageFilters>): VoyageRecord[] {
    if (!filters) return [...this.records];
    return this.records.filter((r) => this.matchFilters(r, filters));
  }

  getRecordById(id: string): VoyageRecord | null {
    return this.records.find((r) => r.id === id) || null;
  }

  private matchFilters(record: VoyageRecord, f: Partial<VoyageFilters>): boolean {
    if (f.modes && f.modes.length > 0 && !f.modes.includes(record.mode)) return false;
    if (f.dateRange?.start != null && record.endedAt < f.dateRange.start) return false;
    if (f.dateRange?.end != null && record.endedAt > f.dateRange.end) return false;
    if (f.scoreRange?.min != null && record.finalScore < f.scoreRange.min) return false;
    if (f.scoreRange?.max != null && record.finalScore > f.scoreRange.max) return false;
    if (f.levelRange?.min != null && record.finalLevel < f.levelRange.min) return false;
    if (f.levelRange?.max != null && record.finalLevel > f.levelRange.max) return false;
    if (f.anomalyTypes && f.anomalyTypes.length > 0) {
      const hasType = record.anomalies.some((a) => f.anomalyTypes!.includes(a.type));
      if (!hasType) return false;
    }
    if (f.hasAnomaliesOnly && record.anomalies.length === 0) return false;
    if (f.searchText) {
      const search = f.searchText.toLowerCase();
      const match =
        record.modeLabel.toLowerCase().includes(search) ||
        (record.dailyChallengeTitle || '').toLowerCase().includes(search) ||
        record.scoreBreakdown.items.some((i) => i.name.toLowerCase().includes(search)) ||
        record.anomalies.some((a) => a.description.toLowerCase().includes(search));
      if (!match) return false;
    }
    return true;
  }

  deleteRecord(id: string) {
    this.records = this.records.filter((r) => r.id !== id);
    this.saveToStorage();
  }

  clearAll() {
    this.records = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
  }

  getStats(filters?: Partial<VoyageFilters>): VoyageArchiveStats {
    const records = filters ? this.records.filter((r) => this.matchFilters(r, filters)) : this.records;

    const totalVoyages = records.length;
    const totalPlayTime = records.reduce((sum, r) => sum + r.duration, 0);
    const avgScore = totalVoyages > 0 ? records.reduce((s, r) => s + r.finalScore, 0) / totalVoyages : 0;
    const avgDuration = totalVoyages > 0 ? totalPlayTime / totalVoyages : 0;
    const avgLevel = totalVoyages > 0 ? records.reduce((s, r) => s + r.finalLevel, 0) / totalVoyages : 0;
    const highScore = totalVoyages > 0 ? Math.max(...records.map((r) => r.finalScore)) : 0;
    const highestLevel = totalVoyages > 0 ? Math.max(...records.map((r) => r.peakLevel)) : 0;
    const totalAnomalies = records.reduce((s, r) => s + r.anomalies.length, 0);
    const avgDiscoveryRate =
      totalVoyages > 0 ? records.reduce((s, r) => s + r.hitRate.discoveryRate, 0) / totalVoyages : 0;
    const avgTapAccuracy =
      totalVoyages > 0 ? records.reduce((s, r) => s + r.hitRate.tapAccuracy, 0) / totalVoyages : 0;
    const winRate = totalVoyages > 0 ? records.filter((r) => r.isVictory).length / totalVoyages : 0;

    const modeBreakdown: VoyageArchiveStats['modeBreakdown'] = {
      normal: { count: 0, avgScore: 0, highScore: 0 },
      daily_challenge: { count: 0, avgScore: 0, highScore: 0 },
      rescue: { count: 0, avgScore: 0, highScore: 0 },
      custom: { count: 0, avgScore: 0, highScore: 0 },
    };

    for (const r of records) {
      const mb = modeBreakdown[r.mode];
      mb.count++;
      mb.avgScore += r.finalScore;
      mb.highScore = Math.max(mb.highScore, r.finalScore);
    }
    for (const key of Object.keys(modeBreakdown) as VoyageMode[]) {
      const mb = modeBreakdown[key];
      if (mb.count > 0) mb.avgScore = Math.round(mb.avgScore / mb.count);
    }

    const anomalyCounts: Record<string, { type: AnomalyEventType; count: number; description: string }> = {};
    const anomalyDescriptions: Record<AnomalyEventType, string> = {
      danger_hit: '危险区域碰撞',
      sonar_empty: '空放声呐',
      target_missed: '目标错过',
      false_report: '误报',
      path_offtrack: '偏航',
      high_risk_enter: '进入高危区',
      blocker_collision: '阻断区碰撞',
      yaw_warning: '偏航警告',
      yaw_failure: '偏航超限',
    };
    for (const r of records) {
      for (const a of r.anomalies) {
        if (!anomalyCounts[a.type]) {
          anomalyCounts[a.type] = {
            type: a.type,
            count: 0,
            description: anomalyDescriptions[a.type] || a.type,
          };
        }
        anomalyCounts[a.type].count++;
      }
    }
    const topAnomalies = Object.values(anomalyCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalVoyages,
      totalPlayTime,
      avgScore: Math.round(avgScore),
      avgDuration: Math.round(avgDuration),
      avgLevel: Math.round(avgLevel * 10) / 10,
      highScore,
      highestLevel,
      totalAnomalies,
      avgDiscoveryRate: Math.round(avgDiscoveryRate * 1000) / 10,
      avgTapAccuracy: Math.round(avgTapAccuracy * 1000) / 10,
      winRate: Math.round(winRate * 1000) / 10,
      modeBreakdown,
      topAnomalies,
    };
  }

  getDifficultyRecommendations(filters?: Partial<VoyageFilters>): DifficultyRecommendation[] {
    const records = filters ? this.records.filter((r) => this.matchFilters(r, filters)) : this.records;
    if (records.length === 0) return [];

    const recs: DifficultyRecommendation[] = [];
    const stats = this.getStats(filters);

    const recentCount = Math.min(10, records.length);
    const recent = records.slice(0, recentCount);

    const avgLevel = stats.avgLevel;
    const avgDiscoveryRate = stats.avgDiscoveryRate / 100;
    const avgTapAccuracy = stats.avgTapAccuracy / 100;
    const avgAnomalies = records.length > 0 ? stats.totalAnomalies / records.length : 0;
    const dangerAnomalies = records.reduce((s, r) => s + r.anomalies.filter((a) => a.type === 'danger_hit').length, 0);
    const avgDangerHits = records.length > 0 ? dangerAnomalies / records.length : 0;

    if (avgDiscoveryRate < 0.25 && recent.length >= 3) {
      recs.push({
        id: 'rec_sonar_radius',
        category: 'sonar',
        severity: 'warning',
        title: '增大声呐侦测半径',
        description: `近期平均发现率仅 ${Math.round(avgDiscoveryRate * 100)}%，低于健康阈值 40%，玩家难以通过声呐有效定位目标`,
        currentValue: GAME_CONFIG.SONAR.MAX_RADIUS,
        suggestedValue: Math.round(GAME_CONFIG.SONAR.MAX_RADIUS * 1.25),
        impact: '提升声呐有效覆盖范围 25%，让玩家更容易发现目标',
      });
    }

    if (avgDiscoveryRate > 0.7 && recent.length >= 3) {
      recs.push({
        id: 'rec_sonar_charges',
        category: 'sonar',
        severity: 'suggestion',
        title: '减少初始声呐充能数',
        description: `发现率高达 ${Math.round(avgDiscoveryRate * 100)}%，玩家几乎不会放空，声呐策略性较弱`,
        currentValue: GAME_CONFIG.SONAR.MAX_CHARGES,
        suggestedValue: Math.max(3, GAME_CONFIG.SONAR.MAX_CHARGES - 1),
        impact: '减少声呐滥用，鼓励玩家更精准地规划探测位置',
      });
    }

    if (avgLevel < 3 && records.length >= 5) {
      recs.push({
        id: 'rec_targets_level',
        category: 'target',
        severity: 'warning',
        title: '降低升级所需目标数',
        description: `平均通关等级仅 ${avgLevel.toFixed(1)}，多数玩家未能体验到后期关卡内容`,
        currentValue: GAME_CONFIG.GAME.TARGETS_PER_LEVEL,
        suggestedValue: Math.max(3, Math.round(GAME_CONFIG.GAME.TARGETS_PER_LEVEL * 0.8)),
        impact: '升级更快，让更多玩家体验到等级递进的乐趣',
      });
    }

    if (avgDangerHits > 2 && recent.length >= 3) {
      recs.push({
        id: 'rec_danger_density',
        category: 'danger',
        severity: 'warning',
        title: '降低危险目标密度',
        description: `每局平均碰撞危险 ${avgDangerHits.toFixed(1)} 次，可能导致挫败感过强`,
        currentValue: GAME_CONFIG.TARGETS.DANGER_COUNT,
        suggestedValue: Math.max(1, GAME_CONFIG.TARGETS.DANGER_COUNT - 1),
        impact: '减少危险目标，降低意外死亡概率',
      });
    }

    if (stats.winRate < 0.2 && records.length >= 5) {
      recs.push({
        id: 'rec_initial_lives',
        category: 'lives',
        severity: 'warning',
        title: '增加初始生命值',
        description: `胜率仅 ${stats.winRate.toFixed(1)}%，难度曲线可能过于陡峭`,
        currentValue: GAME_CONFIG.GAME.INITIAL_LIVES,
        suggestedValue: GAME_CONFIG.GAME.INITIAL_LIVES + 1,
        impact: '给予玩家更多容错空间，学习曲线更平滑',
      });
    }

    if (stats.winRate > 0.7 && records.length >= 5) {
      recs.push({
        id: 'rec_lives_reduce',
        category: 'lives',
        severity: 'suggestion',
        title: '减少初始生命值',
        description: `胜率高达 ${stats.winRate.toFixed(1)}%，当前难度不足以提供挑战感`,
        currentValue: GAME_CONFIG.GAME.INITIAL_LIVES,
        suggestedValue: Math.max(2, GAME_CONFIG.GAME.INITIAL_LIVES - 1),
        impact: '提升紧张感，让每一次决策更有分量',
      });
    }

    if (avgLevel > 7 && records.length >= 5) {
      recs.push({
        id: 'rec_level_scaling',
        category: 'level_progression',
        severity: 'adjustment',
        title: '提升后期难度曲线斜率',
        description: `平均达到等级 ${avgLevel.toFixed(1)}，关卡递增的难度可能不够，后期缺乏挑战性`,
        currentValue: 2,
        suggestedValue: 3,
        impact: '每升一级所需目标数增加更快，后期关卡更具挑战性',
      });
    }

    if (avgTapAccuracy < 0.4 && recent.length >= 3) {
      recs.push({
        id: 'rec_target_radius',
        category: 'target',
        severity: 'adjustment',
        title: '增大目标判定半径',
        description: `点击准确率仅 ${Math.round(avgTapAccuracy * 100)}%，玩家发现后仍难以选中目标`,
        currentValue: 20,
        suggestedValue: 28,
        impact: '目标点击判定更宽松，减少因操作精度导致的挫败',
      });
    }

    return recs;
  }

  compareRecords(ids: string[]): {
    records: VoyageRecord[];
    deltaMatrix: Record<string, Record<string, { metric: string; diff: number; pct: number }>>;
  } {
    const records = ids.map((id) => this.getRecordById(id)).filter(Boolean) as VoyageRecord[];
    const deltaMatrix: Record<string, Record<string, { metric: string; diff: number; pct: number }>> = {};

    const metrics: Array<{ key: string; label: string; getValue: (r: VoyageRecord) => number }> = [
      { key: 'finalScore', label: '最终得分', getValue: (r) => r.finalScore },
      { key: 'duration', label: '持续时长(秒)', getValue: (r) => Math.round(r.duration / 1000) },
      { key: 'finalLevel', label: '最终等级', getValue: (r) => r.finalLevel },
      { key: 'discoveryRate', label: '发现率(%)', getValue: (r) => Math.round(r.hitRate.discoveryRate * 1000) / 10 },
      { key: 'tapAccuracy', label: '点击准确率(%)', getValue: (r) => Math.round(r.hitRate.tapAccuracy * 1000) / 10 },
      { key: 'anomalyCount', label: '异常事件数', getValue: (r) => r.anomalies.length },
    ];

    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const a = records[i];
        const b = records[j];
        const key = `${a.id}__${b.id}`;
        deltaMatrix[key] = {};

        for (const m of metrics) {
          const valA = m.getValue(a);
          const valB = m.getValue(b);
          const diff = valB - valA;
          const pct = valA !== 0 ? Math.round((diff / valA) * 1000) / 10 : 0;
          deltaMatrix[key][m.key] = { metric: m.label, diff, pct };
        }
      }
    }

    return { records, deltaMatrix };
  }
}
