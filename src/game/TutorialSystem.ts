import type {
  TutorialState,
  TutorialStepId,
  TutorialActionType,
  TutorialErrorType,
  TutorialStepConfig,
  TutorialErrorConfig,
} from '../types/game';
import { TUTORIAL_STEPS, TUTORIAL_ERROR_HINTS, GAME_CONFIG } from '../config/gameConfig';

export interface TutorialCallbacks {
  onStateChange?: (state: TutorialState) => void;
  onStepComplete?: (stepId: TutorialStepId) => void;
  onTutorialComplete?: () => void;
  onErrorHint?: (errorType: TutorialErrorType, config: TutorialErrorConfig) => void;
}

interface ErrorRecord {
  type: TutorialErrorType;
  count: number;
  lastShownAt: number;
}

export class TutorialSystem {
  private state: TutorialState;
  private callbacks: TutorialCallbacks;
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private errorHintTimer: ReturnType<typeof setTimeout> | null = null;
  private errorRecords: Map<TutorialErrorType, ErrorRecord> = new Map();
  private isFirstGame: boolean;

  constructor(callbacks: TutorialCallbacks = {}, isFirstGame: boolean = true) {
    this.callbacks = callbacks;
    this.isFirstGame = isFirstGame;
    this.state = this.createInitialState();
  }

  private createInitialState(): TutorialState {
    const shouldEnableTutorial = GAME_CONFIG.TUTORIAL.ENABLED && this.isFirstGame;
    const firstStep = TUTORIAL_STEPS[0];
    return {
      isTutorialMode: shouldEnableTutorial,
      tutorialComplete: false,
      currentStepIndex: 0,
      currentStep: firstStep.id,
      completedSteps: [],
      stepStartTime: Date.now(),
      isStepWaitingForAction: !firstStep.autoAdvance,
      lastErrorType: null,
      errorCount: 0,
      actionCount: {
        sonarFired: 0,
        targetsDiscovered: 0,
        targetsCollected: 0,
        creaturesCollected: 0,
        wrecksCollected: 0,
        dangersHit: 0,
      },
      showErrorHint: false,
      errorHintMessage: '',
      errorHintDuration: 0,
      totalDangerHits: 0,
    };
  }

  getState(): TutorialState {
    return { ...this.state };
  }

  getCurrentStepConfig(): TutorialStepConfig | undefined {
    return TUTORIAL_STEPS[this.state.currentStepIndex];
  }

  getStepConfig(stepId: TutorialStepId): TutorialStepConfig | undefined {
    return TUTORIAL_STEPS.find(s => s.id === stepId);
  }

  getAllSteps(): TutorialStepConfig[] {
    return [...TUTORIAL_STEPS];
  }

  isNewbieLevel(level: number): boolean {
    return level <= GAME_CONFIG.TUTORIAL.NEWBIE_MAX_LEVELS;
  }

  getLevelDangerModifier(level: number): { minCount: number; maxCount: number; ratio: number } {
    if (level === 1) {
      return {
        minCount: GAME_CONFIG.TUTORIAL.DANGER_REDUCTION.LEVEL_1_MIN_DANGER,
        maxCount: GAME_CONFIG.TUTORIAL.DANGER_REDUCTION.LEVEL_1_MAX_DANGER,
        ratio: GAME_CONFIG.TUTORIAL.DANGER_REDUCTION.LEVEL_1_DANGER_RATIO,
      };
    } else if (level === 2) {
      return {
        minCount: GAME_CONFIG.TUTORIAL.DANGER_REDUCTION.LEVEL_2_MIN_DANGER,
        maxCount: GAME_CONFIG.TUTORIAL.DANGER_REDUCTION.LEVEL_2_MAX_DANGER,
        ratio: GAME_CONFIG.TUTORIAL.DANGER_REDUCTION.LEVEL_2_DANGER_RATIO,
      };
    }
    return { minCount: 0, maxCount: Infinity, ratio: 1.0 };
  }

  getLevelLivesBonus(level: number): number {
    if (level === 1) return GAME_CONFIG.TUTORIAL.LIVES_BONUS.LEVEL_1_BONUS;
    if (level === 2) return GAME_CONFIG.TUTORIAL.LIVES_BONUS.LEVEL_2_BONUS;
    return 0;
  }

  getLevelSonarBonus(level: number): number {
    if (level === 1) return GAME_CONFIG.TUTORIAL.SONAR_BONUS.LEVEL_1_BONUS;
    if (level === 2) return GAME_CONFIG.TUTORIAL.SONAR_BONUS.LEVEL_2_BONUS;
    return 0;
  }

  getLevelDamageReduction(level: number): { scorePenaltyRatio: number; lifePenaltyRatio: number } {
    if (level === 1) {
      return {
        scorePenaltyRatio: GAME_CONFIG.TUTORIAL.DAMAGE_REDUCTION.LEVEL_1_DANGER_PENALTY_RATIO,
        lifePenaltyRatio: GAME_CONFIG.TUTORIAL.DAMAGE_REDUCTION.LEVEL_1_LIFE_PENALTY_RATIO,
      };
    } else if (level === 2) {
      return {
        scorePenaltyRatio: GAME_CONFIG.TUTORIAL.DAMAGE_REDUCTION.LEVEL_2_DANGER_PENALTY_RATIO,
        lifePenaltyRatio: GAME_CONFIG.TUTORIAL.DAMAGE_REDUCTION.LEVEL_2_LIFE_PENALTY_RATIO,
      };
    }
    return { scorePenaltyRatio: 1.0, lifePenaltyRatio: 1.0 };
  }

  reset() {
    this.clearAllTimers();
    this.errorRecords.clear();
    this.state = this.createInitialState();
    this.notifyStateChange();
    if (this.state.isTutorialMode) {
      this.startCurrentStep();
    }
  }

  start() {
    if (!this.state.isTutorialMode) return;
    this.startCurrentStep();
  }

  private startCurrentStep() {
    const step = this.getCurrentStepConfig();
    if (!step) return;

    this.state.stepStartTime = Date.now();
    this.state.isStepWaitingForAction = !step.autoAdvance;
    this.notifyStateChange();

    if (step.autoAdvance && step.duration > 0) {
      this.scheduleAutoAdvance(step.duration, step.nextStepDelay ?? 0);
    }
  }

  private scheduleAutoAdvance(duration: number, nextDelay: number) {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
    }
    this.autoAdvanceTimer = setTimeout(() => {
      this.advanceToNextStep(nextDelay);
    }, duration);
  }

  private clearAllTimers() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    if (this.errorHintTimer) {
      clearTimeout(this.errorHintTimer);
      this.errorHintTimer = null;
    }
  }

  recordAction(action: TutorialActionType, _level?: number, count?: number) {
    if (!this.state.isTutorialMode) return;

    this.updateActionCount(action, count);
    this.checkStepCompletion(action);
  }

  private updateActionCount(action: TutorialActionType, count: number = 1) {
    switch (action) {
      case 'sonar_fire':
      case 'SONAR_FIRED':
        this.state.actionCount.sonarFired += count;
        break;
      case 'target_discover':
      case 'TARGET_DISCOVERED':
        this.state.actionCount.targetsDiscovered += count;
        break;
      case 'collect_target':
      case 'TARGET_COLLECTED':
        this.state.actionCount.targetsCollected += count;
        break;
      case 'collect_creature':
      case 'CREATURE_COLLECTED':
        this.state.actionCount.targetsCollected += count;
        this.state.actionCount.creaturesCollected += count;
        break;
      case 'collect_wreck':
      case 'WRECK_COLLECTED':
        this.state.actionCount.targetsCollected += count;
        this.state.actionCount.wrecksCollected += count;
        break;
      case 'LEVEL_UP':
      case 'DEPTH_200_REACHED':
      case 'avoid_danger':
      case 'reach_level_2':
      case 'acknowledge':
        break;
    }
  }

  private checkStepCompletion(action: TutorialActionType) {
    const step = this.getCurrentStepConfig();
    if (!step || step.autoAdvance) return;

    const normalizedAction = this.normalizeActionType(action);
    const normalizedRequired = step.requiredAction ? this.normalizeActionType(step.requiredAction) : null;
    if (normalizedRequired !== normalizedAction) return;

    const requiredCount = step.actionCountRequired ?? 1;
    let currentCount = 0;

    switch (normalizedAction) {
      case 'sonar_fire':
        currentCount = this.state.actionCount.sonarFired;
        break;
      case 'target_discover':
        currentCount = this.state.actionCount.targetsDiscovered;
        break;
      case 'collect_target':
        currentCount = this.state.actionCount.targetsCollected;
        break;
      case 'collect_creature':
        currentCount = this.state.actionCount.creaturesCollected;
        break;
      case 'collect_wreck':
        currentCount = this.state.actionCount.wrecksCollected;
        break;
      default:
        currentCount = 1;
    }

    if (currentCount >= requiredCount) {
      this.advanceToNextStep(step.nextStepDelay ?? 300);
    }
  }

  private normalizeActionType(action: TutorialActionType): string {
    const map: Record<string, string> = {
      'SONAR_FIRED': 'sonar_fire',
      'TARGET_DISCOVERED': 'target_discover',
      'TARGET_COLLECTED': 'collect_target',
      'CREATURE_COLLECTED': 'collect_creature',
      'WRECK_COLLECTED': 'collect_wreck',
      'LEVEL_UP': 'reach_level_2',
      'DEPTH_200_REACHED': 'reach_level_2',
    };
    return map[action] ?? action;
  }

  private advanceToNextStep(delay: number) {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }

    const currentStep = this.getCurrentStepConfig();
    if (currentStep) {
      this.state.completedSteps.push(currentStep.id);
      this.callbacks.onStepComplete?.(currentStep.id);
    }

    if (this.state.currentStepIndex >= TUTORIAL_STEPS.length - 1) {
      this.completeTutorial();
      return;
    }

    setTimeout(() => {
      this.state.currentStepIndex++;
      this.state.currentStep = TUTORIAL_STEPS[this.state.currentStepIndex].id;
      this.startCurrentStep();
    }, delay);
  }

  skipCurrentStep() {
    if (!this.state.isTutorialMode) return;
    const step = this.getCurrentStepConfig();
    if (!step || !step.skipable) return;
    this.advanceToNextStep(step.nextStepDelay ?? 300);
  }

  skipAllTutorial() {
    if (!this.state.isTutorialMode) return;
    this.completeTutorial();
  }

  private completeTutorial() {
    this.clearAllTimers();
    this.state.isTutorialMode = false;
    this.state.tutorialComplete = true;
    this.state.currentStep = 'tutorial_complete';
    this.notifyStateChange();
    this.callbacks.onTutorialComplete?.();
  }

  recordError(errorType: TutorialErrorType, _level?: number) {
    this.state.lastErrorType = errorType;
    this.state.errorCount++;
    if (
      errorType === 'danger_collision' ||
      errorType === 'tap_danger' ||
      errorType === 'HIT_DANGER'
    ) {
      this.state.totalDangerHits++;
    }

    const normalizedError = this.normalizeErrorType(errorType);
    const config = TUTORIAL_ERROR_HINTS[normalizedError] || TUTORIAL_ERROR_HINTS[errorType];
    if (!config) return;

    const record = this.errorRecords.get(errorType);
    const now = Date.now();

    if (!record) {
      this.errorRecords.set(errorType, {
        type: errorType,
        count: 1,
        lastShownAt: now,
      });
    } else {
      record.count++;
      if (record.count < config.repeatThreshold) return;
      record.count = 0;
      record.lastShownAt = now;
    }

    this.showErrorHint(config);
    this.callbacks.onErrorHint?.(errorType, config);
  }

  private normalizeErrorType(errorType: TutorialErrorType): TutorialErrorType {
    const map: Partial<Record<TutorialErrorType, TutorialErrorType>> = {
      'NO_SONAR_CHARGE': 'sonar_no_charges',
      'HIT_DANGER': 'tap_danger',
    };
    return map[errorType] ?? errorType;
  }

  private showErrorHint(config: TutorialErrorConfig) {
    if (this.errorHintTimer) {
      clearTimeout(this.errorHintTimer);
    }

    this.state.showErrorHint = true;
    this.state.errorHintMessage = config.suggestion;
    this.state.errorHintDuration = config.duration;
    this.notifyStateChange();

    this.errorHintTimer = setTimeout(() => {
      this.hideErrorHint();
    }, config.duration);
  }

  private hideErrorHint() {
    this.state.showErrorHint = false;
    this.state.errorHintMessage = '';
    this.state.errorHintDuration = 0;
    this.notifyStateChange();
  }

  getErrorConfig(errorType: TutorialErrorType): TutorialErrorConfig | null {
    return TUTORIAL_ERROR_HINTS[errorType] ?? null;
  }

  private notifyStateChange() {
    this.callbacks.onStateChange?.({ ...this.state });
  }

  setFirstGame(isFirstGame: boolean) {
    this.isFirstGame = isFirstGame;
  }

  destroy() {
    this.clearAllTimers();
  }
}
