import type {
  Mission,
  MissionCategory,
  MissionObjectiveType,
  MissionObjective,
  MissionEffect,
  MissionEffectType,
  MissionState,
  MissionResult,
  Target,
  TargetType,
} from '../types/game';

interface MissionTemplate {
  objectiveType: MissionObjectiveType;
  category: MissionCategory;
  title: string;
  description: string;
  icon: string;
  targetValueRange: [number, number];
  levelScale: number;
  rewardEffects: MissionEffectType[];
  rewardValueRanges: Record<MissionEffectType, [number, number]>;
  completionBonusRange: [number, number];
}

const MAIN_TEMPLATES: MissionTemplate[] = [
  {
    objectiveType: 'collect_creatures',
    category: 'main',
    title: '深海生物调查',
    description: '收集 {n} 个深海生物',
    icon: '🐙',
    targetValueRange: [4, 6],
    levelScale: 0.5,
    rewardEffects: ['sonar_charge_bonus', 'score_bonus'],
    rewardValueRanges: {
      sonar_charge_bonus: [1, 2],
      sonar_recharge_speed: [0.1, 0.2],
      danger_count_modifier: [-1, -1],
      score_bonus: [100, 200],
      extra_life: [1, 1],
    },
    completionBonusRange: [200, 400],
  },
  {
    objectiveType: 'reach_level',
    category: 'main',
    title: '深渊探索',
    description: '到达关卡 {n}',
    icon: '🌊',
    targetValueRange: [3, 5],
    levelScale: 0,
    rewardEffects: ['score_bonus', 'sonar_charge_bonus'],
    rewardValueRanges: {
      sonar_charge_bonus: [1, 2],
      sonar_recharge_speed: [0.1, 0.2],
      danger_count_modifier: [-1, -1],
      score_bonus: [150, 300],
      extra_life: [1, 1],
    },
    completionBonusRange: [300, 500],
  },
  {
    objectiveType: 'collect_wrecks',
    category: 'main',
    title: '沉船寻宝',
    description: '收集 {n} 个沉船遗物',
    icon: '🚢',
    targetValueRange: [2, 4],
    levelScale: 0.3,
    rewardEffects: ['score_bonus', 'extra_life'],
    rewardValueRanges: {
      sonar_charge_bonus: [1, 2],
      sonar_recharge_speed: [0.1, 0.2],
      danger_count_modifier: [-1, -1],
      score_bonus: [150, 250],
      extra_life: [1, 1],
    },
    completionBonusRange: [250, 450],
  },
  {
    objectiveType: 'discover_targets',
    category: 'main',
    title: '全域扫描',
    description: '发现 {n} 个目标',
    icon: '📡',
    targetValueRange: [8, 15],
    levelScale: 1,
    rewardEffects: ['sonar_recharge_speed', 'score_bonus'],
    rewardValueRanges: {
      sonar_charge_bonus: [1, 2],
      sonar_recharge_speed: [0.15, 0.25],
      danger_count_modifier: [-1, -1],
      score_bonus: [100, 200],
      extra_life: [1, 1],
    },
    completionBonusRange: [200, 400],
  },
];

const SIDE_TEMPLATES: MissionTemplate[] = [
  {
    objectiveType: 'no_damage_levels',
    category: 'side',
    title: '安全航行',
    description: '连续 {n} 关不触碰危险物',
    icon: '🛡️',
    targetValueRange: [2, 4],
    levelScale: 0,
    rewardEffects: ['danger_count_modifier', 'sonar_charge_bonus'],
    rewardValueRanges: {
      sonar_charge_bonus: [1, 2],
      sonar_recharge_speed: [0.1, 0.2],
      danger_count_modifier: [-1, -2],
      score_bonus: [100, 200],
      extra_life: [1, 1],
    },
    completionBonusRange: [150, 300],
  },
  {
    objectiveType: 'avoid_all_dangers',
    category: 'side',
    title: '危机回避',
    description: '本局避开所有危险物',
    icon: '⚡',
    targetValueRange: [1, 1],
    levelScale: 0,
    rewardEffects: ['extra_life', 'score_bonus'],
    rewardValueRanges: {
      sonar_charge_bonus: [1, 2],
      sonar_recharge_speed: [0.1, 0.2],
      danger_count_modifier: [-1, -1],
      score_bonus: [200, 350],
      extra_life: [1, 1],
    },
    completionBonusRange: [200, 400],
  },
  {
    objectiveType: 'sonar_efficiency',
    category: 'side',
    title: '精准探测',
    description: '声呐命中率达 {n}%',
    icon: '🎯',
    targetValueRange: [60, 80],
    levelScale: 0,
    rewardEffects: ['sonar_recharge_speed', 'score_bonus'],
    rewardValueRanges: {
      sonar_charge_bonus: [1, 2],
      sonar_recharge_speed: [0.15, 0.3],
      danger_count_modifier: [-1, -1],
      score_bonus: [100, 250],
      extra_life: [1, 1],
    },
    completionBonusRange: [150, 350],
  },
  {
    objectiveType: 'use_sonar_under',
    category: 'side',
    title: '节约能源',
    description: '声呐使用不超过 {n} 次通关',
    icon: '🔋',
    targetValueRange: [15, 25],
    levelScale: 2,
    rewardEffects: ['sonar_charge_bonus', 'score_bonus'],
    rewardValueRanges: {
      sonar_charge_bonus: [2, 3],
      sonar_recharge_speed: [0.1, 0.2],
      danger_count_modifier: [-1, -1],
      score_bonus: [150, 300],
      extra_life: [1, 1],
    },
    completionBonusRange: [200, 400],
  },
  {
    objectiveType: 'collect_all_in_level',
    category: 'side',
    title: '完美扫荡',
    description: '在任意关卡收集全部目标',
    icon: '✨',
    targetValueRange: [1, 1],
    levelScale: 0,
    rewardEffects: ['score_bonus', 'sonar_charge_bonus'],
    rewardValueRanges: {
      sonar_charge_bonus: [1, 3],
      sonar_recharge_speed: [0.1, 0.2],
      danger_count_modifier: [-1, -1],
      score_bonus: [200, 400],
      extra_life: [1, 1],
    },
    completionBonusRange: [250, 500],
  },
];

let missionIdCounter = 0;

function randomInRange(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class MissionSystem {
  private missions: Mission[] = [];
  private activeEffects: MissionEffect[] = [];
  private currentLevel: number = 1;
  private creaturesCollected: number = 0;
  private wrecksCollected: number = 0;
  private dangersHit: number = 0;
  private targetsDiscovered: number = 0;
  private sonarFired: number = 0;
  private sonarPulsesWithDiscovery: number = 0;
  private currentPulseDiscovered: boolean = false;
  private consecutiveNoDamageLevels: number = 0;
  private hitDangerThisLevel: boolean = false;
  private isGameOver: boolean = false;
  private levelCollections: Map<number, { collected: number; total: number }> = new Map();
  private onMissionCompleted?: (mission: Mission) => void;
  private onMissionProgress?: (mission: Mission) => void;
  private onEffectsChanged?: (effects: MissionEffect[]) => void;

  generateMissions(level: number): void {
    this.missions = [];
    this.activeEffects = [];
    this.currentLevel = level;
    this.creaturesCollected = 0;
    this.wrecksCollected = 0;
    this.dangersHit = 0;
    this.targetsDiscovered = 0;
    this.sonarFired = 0;
    this.sonarPulsesWithDiscovery = 0;
    this.currentPulseDiscovered = false;
    this.consecutiveNoDamageLevels = 0;
    this.hitDangerThisLevel = false;
    this.isGameOver = false;
    this.levelCollections.clear();
    missionIdCounter = 0;

    const mainPool = shuffleArray(MAIN_TEMPLATES);
    const sidePool = shuffleArray(SIDE_TEMPLATES);

    const mainCount = 2;
    const sideCount = 2;

    const selectedMain = mainPool.slice(0, mainCount);
    const selectedSide = sidePool.slice(0, sideCount);

    for (const tmpl of selectedMain) {
      this.missions.push(this.createMission(tmpl, level));
    }
    for (const tmpl of selectedSide) {
      this.missions.push(this.createMission(tmpl, level));
    }
  }

  private createMission(tmpl: MissionTemplate, level: number): Mission {
    const scaledTarget = Math.round(
      tmpl.targetValueRange[0] +
      (tmpl.targetValueRange[1] - tmpl.targetValueRange[0]) * Math.random() +
      tmpl.levelScale * (level - 1)
    );
    const targetValue = Math.max(tmpl.targetValueRange[0], scaledTarget);

    const desc = tmpl.description.replace('{n}', String(targetValue));

    const effects: MissionEffect[] = [];
    for (const effectType of tmpl.rewardEffects) {
      const range = tmpl.rewardValueRanges[effectType];
      effects.push({
        type: effectType,
        value: randomInRange(range[0], range[1]),
      });
    }

    const objective: MissionObjective = {
      type: tmpl.objectiveType,
      targetValue,
      currentValue: 0,
    };

    if (tmpl.objectiveType === 'use_sonar_under') {
      objective.limitValue = targetValue;
      objective.targetValue = 1;
    }

    return {
      id: `mission_${++missionIdCounter}_${Date.now()}`,
      category: tmpl.category,
      title: tmpl.title,
      description: desc,
      icon: tmpl.icon,
      objective,
      rewardEffects: effects,
      completionBonus: randomInRange(
        tmpl.completionBonusRange[0],
        tmpl.completionBonusRange[1]
      ),
      completed: false,
      failed: false,
    };
  }

  setCallbacks(
    onMissionCompleted?: (mission: Mission) => void,
    onMissionProgress?: (mission: Mission) => void,
    onEffectsChanged?: (effects: MissionEffect[]) => void
  ) {
    this.onMissionCompleted = onMissionCompleted;
    this.onMissionProgress = onMissionProgress;
    this.onEffectsChanged = onEffectsChanged;
  }

  onCollectTarget(target: Target, level: number): void {
    if (target.type === 'creature') {
      this.creaturesCollected++;
    } else if (target.type === 'wreck') {
      this.wrecksCollected++;
    } else if (target.type === 'danger') {
      this.dangersHit++;
      this.hitDangerThisLevel = true;
    }

    const levelData = this.levelCollections.get(level) ?? { collected: 0, total: 0 };
    levelData.collected++;
    this.levelCollections.set(level, levelData);

    this.updateAllObjectives(level);
  }

  onDiscoverTarget(): void {
    this.targetsDiscovered++;
    this.currentPulseDiscovered = true;
    this.updateAllObjectives(this.currentLevel);
  }

  onFireSonar(): void {
    if (this.currentPulseDiscovered) {
      this.sonarPulsesWithDiscovery++;
      this.currentPulseDiscovered = false;
    }
    this.sonarFired++;
    this.updateAllObjectives(this.currentLevel);
  }

  onLevelUp(newLevel: number): void {
    if (!this.hitDangerThisLevel) {
      this.consecutiveNoDamageLevels++;
    } else {
      this.consecutiveNoDamageLevels = 0;
    }
    this.hitDangerThisLevel = false;
    this.currentLevel = newLevel;
    this.updateAllObjectives(newLevel);
  }

  onGameOver(): void {
    this.isGameOver = true;
    if (this.currentPulseDiscovered) {
      this.sonarPulsesWithDiscovery++;
      this.currentPulseDiscovered = false;
    }
    this.updateAllObjectives(this.currentLevel);
  }

  setLevelTargetCounts(level: number, total: number): void {
    const existing = this.levelCollections.get(level);
    if (existing) {
      existing.total = total;
    } else {
      this.levelCollections.set(level, { collected: 0, total });
    }
  }

  private updateAllObjectives(level: number): void {
    for (const mission of this.missions) {
      if (mission.completed || mission.failed) continue;

      const prevValue = mission.objective.currentValue;
      mission.objective.currentValue = this.computeObjectiveValue(mission, level);

      if (mission.objective.currentValue !== prevValue) {
        this.onMissionProgress?.(mission);
      }

      if (mission.objective.currentValue >= mission.objective.targetValue) {
        mission.completed = true;
        this.applyMissionEffects(mission);
        this.onMissionCompleted?.(mission);
      }
    }

    for (const mission of this.missions) {
      if (mission.completed || mission.failed) continue;
      if (this.isMissionFailed(mission)) {
        mission.failed = true;
      }
    }
  }

  private computeObjectiveValue(mission: Mission, _level: number): number {
    switch (mission.objective.type) {
      case 'collect_creatures':
        return this.creaturesCollected;
      case 'collect_wrecks':
        return this.wrecksCollected;
      case 'reach_level':
        return this.currentLevel;
      case 'no_damage_levels':
        return this.consecutiveNoDamageLevels;
      case 'discover_targets':
        return this.targetsDiscovered;
      case 'sonar_efficiency':
        if (this.sonarFired === 0) return 0;
        return Math.round((this.sonarPulsesWithDiscovery / this.sonarFired) * 100);
      case 'avoid_all_dangers':
        return this.isGameOver && this.dangersHit === 0 ? 1 : 0;
      case 'collect_all_in_level':
        for (const [, data] of this.levelCollections) {
          if (data.total > 0 && data.collected >= data.total) return 1;
        }
        return 0;
      case 'use_sonar_under': {
        const limit = mission.objective.limitValue ?? mission.objective.targetValue;
        return this.isGameOver && this.sonarFired <= limit ? 1 : 0;
      }
      default:
        return 0;
    }
  }

  private isMissionFailed(mission: Mission): boolean {
    switch (mission.objective.type) {
      case 'avoid_all_dangers':
        return this.dangersHit > 0 && !mission.completed;
      case 'use_sonar_under': {
        const limit = mission.objective.limitValue ?? mission.objective.targetValue;
        return this.sonarFired > limit && !mission.completed;
      }
      default:
        return false;
    }
  }

  private applyMissionEffects(mission: Mission): void {
    for (const effect of mission.rewardEffects) {
      this.activeEffects.push({ ...effect });
    }
    this.onEffectsChanged?.(this.activeEffects);
  }

  getSonarChargeBonus(): number {
    return this.sumEffect('sonar_charge_bonus');
  }

  getSonarRechargeSpeedBonus(): number {
    return this.sumEffect('sonar_recharge_speed');
  }

  getDangerCountModifier(): number {
    return this.sumEffect('danger_count_modifier');
  }

  getScoreBonus(): number {
    return this.sumEffect('score_bonus');
  }

  getExtraLives(): number {
    return this.sumEffect('extra_life');
  }

  private sumEffect(type: MissionEffectType): number {
    let total = 0;
    for (const e of this.activeEffects) {
      if (e.type === type) total += e.value;
    }
    return total;
  }

  getState(): MissionState {
    const mainMissions = this.missions.filter((m) => m.category === 'main');
    const sideMissions = this.missions.filter((m) => m.category === 'side');
    const mainCompleted = mainMissions.filter((m) => m.completed).length;
    const sideCompleted = sideMissions.filter((m) => m.completed).length;
    const total = this.missions.length;
    const completed = this.missions.filter((m) => m.completed).length;
    const ratio = total > 0 ? completed / total : 0;

    return {
      missions: this.missions.map((m) => ({ ...m })),
      mainCompletedCount: mainCompleted,
      sideCompletedCount: sideCompleted,
      totalMainMissions: mainMissions.length,
      totalSideMissions: sideMissions.length,
      completionRatio: ratio,
      ratingBonus: this.computeRatingBonus(ratio),
    };
  }

  private computeRatingBonus(ratio: number): number {
    return Math.round(ratio * 500);
  }

  getResult(): MissionResult {
    const state = this.getState();
    const effectSummary = this.buildEffectSummary();

    return {
      ...state,
      ratingAdjustment: state.ratingBonus,
      effectSummary,
    };
  }

  private buildEffectSummary(): string[] {
    const summaries: string[] = [];
    for (const mission of this.missions) {
      if (mission.completed) {
        summaries.push(`✅ ${mission.title} — 完成 (+${mission.completionBonus}分)`);
      } else if (mission.failed) {
        summaries.push(`❌ ${mission.title} — 失败`);
      } else {
        summaries.push(`⏳ ${mission.title} — ${mission.objective.currentValue}/${mission.objective.targetValue}`);
      }
    }
    return summaries;
  }

  getMissions(): Mission[] {
    return this.missions.map((m) => ({ ...m }));
  }

  getActiveEffects(): MissionEffect[] {
    return this.activeEffects.map((e) => ({ ...e }));
  }

  reset(): void {
    this.missions = [];
    this.activeEffects = [];
    this.creaturesCollected = 0;
    this.wrecksCollected = 0;
    this.dangersHit = 0;
    this.targetsDiscovered = 0;
    this.sonarFired = 0;
    this.sonarPulsesWithDiscovery = 0;
    this.currentPulseDiscovered = false;
    this.consecutiveNoDamageLevels = 0;
    this.hitDangerThisLevel = false;
    this.isGameOver = false;
    this.levelCollections.clear();
  }
}
