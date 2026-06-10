<template>
  <div class="game-container" ref="containerRef">
    <div class="game-canvas" ref="canvasRef"></div>

    <FloatingScore ref="floatingScoreRef" />

    <GameHUD
      v-if="gameState.isPlaying && !gameState.isGameOver && !isRescueMode"
      :state="gameState"
      :show-hint="showHint"
      :is-daily-challenge="isDailyChallengeMode"
      :daily-challenge-title="dailyChallenge?.title"
    />

    <RescueGameHUD
      v-if="rescueGameState.isPlaying && !rescueGameState.isGameOver && isRescueMode"
      :state="rescueGameState"
      :show-hint="showRescueHint"
    />

    <StartScreen
      v-if="!gameStarted && !showCollection && !showPrep && !showDailyChallenge && !showDailyLeaderboard && !showResearch && !showRescueIntro && !showOceanEditor && !showVoyageArchive"
      :high-score="highScore"
      :collection-stats="collectionStats"
      :daily-challenge-completed="dailyChallengeSystem.isTodayCompleted()"
      :daily-challenge-title="dailyChallenge?.title"
      :daily-best-score="dailyChallengeSystem.getTodayBestRecord()?.score ?? 0"
      :expedition-points="researchStationStats.expeditionPoints"
      :expeditions-completed="researchStationStats.expeditionsCompleted"
      :unlocked-tech-count="researchStationStats.unlockedCount"
      :total-tech-count="researchStationStats.totalTechCount"
      :voyage-count="voyageArchiveSystem.getRecords().length"
      @start="handleStart"
      @open-collection="openCollection"
      @open-prep="openPrep"
      @open-daily-challenge="openDailyChallenge"
      @open-research="openResearch"
      @open-rescue-mode="openRescueIntro"
      @open-ocean-editor="openOceanEditor"
      @open-voyage-archive="openVoyageArchive"
    />

    <OceanEditor
      v-if="showOceanEditor && !gameStarted"
      :system="oceanEditorSystem"
      @close="closeOceanEditor"
      @start-level="handleOceanLevelStart"
    />

    <VoyageArchive
      v-if="showVoyageArchive"
      :system="voyageArchiveSystem"
      @close="closeVoyageArchive"
    />

    <RescueModeIntro
      v-if="showRescueIntro && !gameStarted"
      :best-scores="rescueBestScores"
      :best-path-completion="rescueBestPathCompletion"
      :perfect-paths="rescuePerfectPaths"
      :lowest-offtrack="rescueLowestOfftrack"
      @start="handleRescueStart"
      @back="closeRescueIntro"
    />

    <DailyChallengeScreen
      v-if="showDailyChallenge && !gameStarted && !showCollection && !showPrep && !showDailyLeaderboard"
      :challenge="dailyChallenge!"
      :best-record="dailyChallengeSystem.getTodayBestRecord()"
      :attempts-today="dailyChallengeSystem.getAttemptsToday()"
      :player-rank="dailyChallengeSystem.getPlayerRank()"
      :streak-days="dailyChallengeSystem.getStreakDays()"
      :system="dailyChallengeSystem"
      @back="closeDailyChallenge"
      @start="handleDailyChallengeStart"
      @open-leaderboard="openDailyLeaderboard"
    />

    <DailyChallengeDetail
      v-if="showDailyLeaderboard"
      :challenge="dailyChallenge!"
      :leaderboard="dailyChallengeSystem.getLeaderboard()"
      :history="dailyChallengeSystem.getHistory()"
      @back="closeDailyLeaderboard"
    />

    <ExpeditionPrep
      v-if="showPrep && !gameStarted && !showCollection && !showDailyChallenge && !showDailyLeaderboard"
      :initial-loadout="currentLoadout"
      @start="handlePrepStart"
      @back="closePrep"
    />

    <GameOverScreen
      v-if="gameState.isGameOver && !showCollection && !showDailyLeaderboard && !showResearch && !isRescueMode"
      :score="gameState.score"
      :level="gameState.level"
      :discovered="gameState.discoveredTargets"
      :high-score="highScore"
      :session-unlocks="sessionUnlocks"
      :is-daily-challenge="isDailyChallengeMode"
      :daily-challenge-title="dailyChallenge?.title"
      :daily-best-score="dailyChallengeSystem.getTodayBestRecord()?.score ?? 0"
      :daily-player-rank="dailyChallengeSystem.getPlayerRank()"
      :daily-attempts="dailyChallengeSystem.getAttemptsToday()"
      :is-daily-new-record="isDailyNewRecord"
      :expedition-reward="lastExpeditionReward"
      :total-expedition-points="researchStationStats.expeditionPoints"
      @restart="handleRestart"
      @home="handleHome"
      @open-collection="openCollection"
      @open-leaderboard="openDailyLeaderboardFromGameOver"
    />

    <RescueGameOver
      v-if="rescueGameState.isGameOver && isRescueMode"
      :result="lastRescueResult!"
      :is-new-high-score="isRescueNewRecord"
      @restart="handleRescueRestart"
      @home="handleHome"
      @select-level="openRescueIntroFromRescueOver"
    />

    <CollectionCenter
      v-if="showCollection"
      :collection-data="collectionData"
      :stats="collectionStats"
      @close="closeCollection"
      @reset="handleResetCollection"
    />

    <ResearchStation
      v-if="showResearch"
      :stats="researchStationStats"
      :system="researchStationSystem"
      @close="closeResearch"
      @unlock="handleTechUnlock"
      @reset="handleResearchReset"
      @update="refreshResearchStation"
    />

    <div
      v-if="(gameState.isPlaying || rescueGameState.isPlaying) && !showCollection"
      class="touch-area"
      @click="handleClick"
      @touchstart.prevent="handleTouch"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import type { GameState, UnlockEvent, CollectionData, ExpeditionLoadout, DailyChallengeConfig, ResearchStationStats, ExpeditionReward, RescueGameState, RescueResult, RescueEvent, OceanLevelConfig } from './types/game';
import { GameController } from './game/GameController';
import { CollectionSystem } from './game/CollectionSystem';
import { DailyChallengeSystem } from './game/DailyChallengeSystem';
import { ResearchStationSystem } from './game/ResearchStationSystem';
import { RescueModeSystem } from './game/RescueModeSystem';
import { RescueRenderer } from './game/RescueRenderer';
import { OceanEditorSystem } from './game/OceanEditorSystem';
import { VoyageArchiveSystem } from './game/VoyageArchiveSystem';
import { RESCUE_CONFIG } from './config/gameConfig';
import type { ScoreEvent } from './game/ScoreSystem';
import { DEFAULT_LOADOUT } from './config/expeditionConfig';
import GameHUD from './components/GameHUD.vue';
import StartScreen from './components/StartScreen.vue';
import GameOverScreen from './components/GameOverScreen.vue';
import FloatingScore from './components/FloatingScore.vue';
import CollectionCenter from './components/CollectionCenter.vue';
import ExpeditionPrep from './components/ExpeditionPrep.vue';
import DailyChallengeScreen from './components/DailyChallengeScreen.vue';
import DailyChallengeDetail from './components/DailyChallengeDetail.vue';
import ResearchStation from './components/ResearchStation.vue';
import RescueModeIntro from './components/RescueModeIntro.vue';
import RescueGameHUD from './components/RescueGameHUD.vue';
import RescueGameOver from './components/RescueGameOver.vue';
import OceanEditor from './components/OceanEditor.vue';
import VoyageArchive from './components/VoyageArchive.vue';

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const floatingScoreRef = ref<InstanceType<typeof FloatingScore> | null>(null);

const gameStarted = ref(false);
const showHint = ref(true);
const showRescueHint = ref(true);
const highScore = ref(0);
const showCollection = ref(false);
const showPrep = ref(false);
const showDailyChallenge = ref(false);
const showDailyLeaderboard = ref(false);
const showResearch = ref(false);
const showRescueIntro = ref(false);
const showOceanEditor = ref(false);
const showVoyageArchive = ref(false);
const leaderboardOpenedFromGameOver = ref(false);
const rescueIntroOpenedFromRescueOver = ref(false);
const isDailyChallengeMode = ref(false);
const isRescueMode = ref(false);
const isDailyNewRecord = ref(false);
const isRescueNewRecord = ref(false);
const sessionUnlocks = ref<UnlockEvent[]>([]);
const currentLoadout = ref<ExpeditionLoadout>({ ...DEFAULT_LOADOUT });
const lastExpeditionReward = ref<ExpeditionReward | null>(null);
const lastRescueResult = ref<RescueResult | null>(null);
const rescueBestScores = ref<number[]>([0, 0, 0, 0, 0]);
const rescueBestPathCompletion = ref<number[]>([0, 0, 0, 0, 0]);
const rescuePerfectPaths = ref<boolean[]>([false, false, false, false, false]);
const rescueLowestOfftrack = ref<number[]>([999, 999, 999, 999, 999]);
const currentRescueLevel = ref(1);

const collectionSystem = new CollectionSystem();
const dailyChallengeSystem = new DailyChallengeSystem();
const researchStationSystem = new ResearchStationSystem();
const voyageArchiveSystem = new VoyageArchiveSystem();
const rescueModeSystem = new RescueModeSystem(voyageArchiveSystem);
const oceanEditorSystem = new OceanEditorSystem();

const dailyChallenge = ref<DailyChallengeConfig | null>(null);

const collectionData = ref<CollectionData>(collectionSystem.getData());
const collectionStats = ref(collectionSystem.getStats());
const researchStationStats = ref<ResearchStationStats>(researchStationSystem.getStats());

const refreshCollection = () => {
  collectionData.value = collectionSystem.getData();
  collectionStats.value = collectionSystem.getStats();
};

const refreshDailyChallenge = () => {
  dailyChallenge.value = dailyChallengeSystem.getTodayChallenge();
};

const refreshResearchStation = () => {
  researchStationStats.value = researchStationSystem.getStats();
};

const gameState = reactive<GameState>({
  score: 0,
  lives: 3,
  level: 1,
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  sonarCharges: 5,
  maxSonarCharges: 5,
  discoveredTargets: 0,
  totalTargets: 0,
});

const rescueGameState = reactive<RescueGameState>(rescueModeSystem.getState());

let gameController: GameController | null = null;
let rescueRenderer: RescueRenderer | null = null;

const updateState = (state: GameState) => {
  Object.assign(gameState, state);
};

const updateRescueState = (state: RescueGameState) => {
  Object.assign(rescueGameState, state);
};

const handleRescueEvent = (event: RescueEvent) => {
  if (event.type === 'capsule_detected' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const world = rescueRenderer?.screenToWorld(event.position.x, event.position.y);
    let x = rect.width / 2;
    let y = rect.height / 2;
    if (world) {
      x = Math.max(40, Math.min(rect.width - 40, world.x));
      y = Math.max(60, Math.min(rect.height - 160, event.position.y));
    }
    floatingScoreRef.value.addScore(RESCUE_CONFIG.SCORE.DETECT_BONUS, '发现信号', 'collect', x, y);
  } else if (event.type === 'false_report' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(event.penalty, '误报!', 'damage', rect.width / 2, rect.height / 2);
  } else if (event.type === 'capsule_confirmed' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(event.bonus, '确认目标', 'collect', rect.width / 2, rect.height / 2);
  } else if (event.type === 'rescue_success' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(event.bonus, '救援成功!', 'collect', rect.width / 2, rect.height / 2);
  } else if (event.type === 'path_start' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(0, '点击地图移动潜航器', 'bonus', rect.width / 2, rect.height / 3);
  } else if (event.type === 'path_offtrack' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(event.penalty, '偏航!', 'damage', rect.width / 2, rect.height / 2);
  } else if (event.type === 'path_return' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(event.bonus, '回到航线', 'bonus', rect.width / 2, rect.height / 2);
  } else if (event.type === 'path_progress' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(event.bonus, '航线进度', 'bonus', rect.width / 2, rect.height / 3);
  } else if (event.type === 'path_complete' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const label = event.perfect ? '完美航线!' : '航线完成';
    floatingScoreRef.value.addScore(event.bonus, label, 'bonus', rect.width / 2, rect.height / 2);
  } else if (event.type === 'high_risk_enter' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(event.penalty, '高危区!', 'damage', rect.width / 2, rect.height / 2);
  } else if (event.type === 'blocker_collision' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(event.penalty, '阻断区!', 'damage', rect.width / 2, rect.height / 2);
  } else if (event.type === 'yaw_warning' && floatingScoreRef.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    floatingScoreRef.value.addScore(0, `偏航警告 剩余${event.remaining}次`, 'damage', rect.width / 2, rect.height / 2);
  }
};

const handleScoreEvent = (event: ScoreEvent) => {
  if (!floatingScoreRef.value || !containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  let x = rect.width / 2;
  let y = rect.height / 2;

  if (event.position.x !== 0 || event.position.y !== 0) {
    const world = gameController?.screenToWorld(event.position.x, event.position.y);
    if (world) {
      x = Math.max(40, Math.min(rect.width - 40, world.x));
      y = Math.max(60, Math.min(rect.height - 160, event.position.y));
    }
  }

  const type = event.type === 'levelUp' ? 'levelUp' : event.type === 'damage' ? 'damage' : 'collect';
  floatingScoreRef.value.addScore(event.points, event.targetName, type, x, y);
};

const handleUnlockEvent = (_event: UnlockEvent) => {
  refreshCollection();
};

const handleRewardTriggered = (event: import('./game/RewardSystem').RewardTriggeredEvent) => {
  if (!floatingScoreRef.value || !containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const x = rect.width / 2;
  const y = rect.height / 2;

  let message = event.rule.name;
  if (event.bonusType === 'score' && event.points > 0) {
    message = `${event.rule.name} +${event.points}`;
  } else if (event.bonusType === 'life') {
    message = `${event.rule.name} 生命+${event.rule.value}`;
  } else if (event.bonusType === 'sonar') {
    message = `${event.rule.name} 声呐+${event.rule.value}`;
  } else if (event.bonusType === 'combo') {
    message = `${event.rule.name} x${event.rule.value}`;
  }

  floatingScoreRef.value.addScore(event.points, message, 'bonus', x, y - 50);
};

const handleGameOver = (finalScore: number) => {
  sessionUnlocks.value = gameController?.getSessionUnlocks() ?? [];
  refreshCollection();

  lastExpeditionReward.value = researchStationSystem.grantExpeditionReward(
    finalScore,
    gameState.level,
    gameState.discoveredTargets,
    isDailyChallengeMode.value
  );
  refreshResearchStation();

  if (isDailyChallengeMode.value) {
    const prevBest = dailyChallengeSystem.getTodayBestRecord();
    const prevBestScore = prevBest?.score ?? 0;
    dailyChallengeSystem.recordAttempt(
      finalScore,
      gameState.level,
      gameState.discoveredTargets
    );
    isDailyNewRecord.value = finalScore > prevBestScore;
  }

  if (finalScore > highScore.value) {
    highScore.value = finalScore;
    try {
      localStorage.setItem('deepSeaSonar_highScore', String(finalScore));
    } catch (_e) {}
  }
};

const handleRescueGameOver = (result: RescueResult) => {
  lastRescueResult.value = result;
  isRescueNewRecord.value = false;

  const levelIdx = result.level - 1;
  if (levelIdx >= 0 && levelIdx < rescueBestScores.value.length) {
    if (result.score > rescueBestScores.value[levelIdx]) {
      rescueBestScores.value[levelIdx] = result.score;
      isRescueNewRecord.value = true;
      try {
        localStorage.setItem('deepSeaSonar_rescueBestScores', JSON.stringify(rescueBestScores.value));
      } catch (_e) {}
    }

    if (result.pathCompletionRate > rescueBestPathCompletion.value[levelIdx]) {
      rescueBestPathCompletion.value[levelIdx] = result.pathCompletionRate;
      try {
        localStorage.setItem('deepSeaSonar_rescueBestPathCompletion', JSON.stringify(rescueBestPathCompletion.value));
      } catch (_e) {}
    }

    if (result.perfectPathBonus && !rescuePerfectPaths.value[levelIdx]) {
      rescuePerfectPaths.value[levelIdx] = true;
      try {
        localStorage.setItem('deepSeaSonar_rescuePerfectPaths', JSON.stringify(rescuePerfectPaths.value));
      } catch (_e) {}
    }

    if (result.offtrackCount < rescueLowestOfftrack.value[levelIdx]) {
      rescueLowestOfftrack.value[levelIdx] = result.offtrackCount;
      try {
        localStorage.setItem('deepSeaSonar_rescueLowestOfftrack', JSON.stringify(rescueLowestOfftrack.value));
      } catch (_e) {}
    }
  }

  if (result.rescuePoints > 0) {
    researchStationSystem.grantExpeditionReward(
      result.score,
      result.level,
      result.capsulesRescued,
      false
    );
    refreshResearchStation();
  }
};

const handleLevelUp = (_newLevel: number) => {};

const openRescueIntro = () => {
  showRescueIntro.value = true;
};

const closeRescueIntro = () => {
  showRescueIntro.value = false;
};

const openOceanEditor = () => {
  showOceanEditor.value = true;
};

const closeOceanEditor = () => {
  showOceanEditor.value = false;
};

const openVoyageArchive = () => {
  showVoyageArchive.value = true;
};

const closeVoyageArchive = () => {
  showVoyageArchive.value = false;
};

const handleOceanLevelStart = (level: OceanLevelConfig) => {
  isDailyChallengeMode.value = false;
  isRescueMode.value = false;
  isDailyNewRecord.value = false;
  showOceanEditor.value = false;
  gameStarted.value = true;

  const oceanConfig = oceanEditorSystem.buildGameConfig(level);

  if (rescueRenderer) {
    rescueRenderer.destroy();
    rescueRenderer = null;
  }

  if (canvasRef.value && !gameController) {
    gameController = new GameController(canvasRef.value, collectionSystem, researchStationSystem, voyageArchiveSystem);
    gameController.setLoadout(currentLoadout.value);
    gameController.setCallbacks(
      updateState,
      handleScoreEvent,
      handleGameOver,
      handleLevelUp,
      handleUnlockEvent,
      handleRewardTriggered
    );
  }

  if (gameController) {
    gameController.setCustomConfig(oceanConfig);
  }

  gameController?.setLoadout(currentLoadout.value);
  gameController?.startGame();
  setTimeout(() => {
    showHint.value = false;
  }, 5000);
};

const openRescueIntroFromRescueOver = () => {
  rescueIntroOpenedFromRescueOver.value = true;
  showRescueIntro.value = true;
};

const handleRescueStart = (level: number) => {
  isRescueMode.value = true;
  isDailyChallengeMode.value = false;
  currentRescueLevel.value = level;
  showRescueIntro.value = false;
  rescueIntroOpenedFromRescueOver.value = false;
  gameStarted.value = true;

  if (gameController) {
    gameController.destroy();
    gameController = null;
  }

  if (canvasRef.value && !rescueRenderer) {
    rescueRenderer = new RescueRenderer(canvasRef.value, RESCUE_CONFIG.MAP_WIDTH, RESCUE_CONFIG.MAP_HEIGHT);
    startRescueGameLoop();
  }

  rescueModeSystem.setCallbacks(updateRescueState, handleRescueEvent, handleRescueGameOver);
  rescueModeSystem.startGame(level);

  if (rescueRenderer) {
    rescueRenderer.clear();
  }

  setTimeout(() => {
    showRescueHint.value = false;
  }, 6000);
};

const handleRescueRestart = () => {
  if (!rescueRenderer) return;
  rescueRenderer.clear();
  rescueModeSystem.startGame(currentRescueLevel.value);
  setTimeout(() => {
    showRescueHint.value = false;
  }, 4000);
};

const startRescueGameLoop = () => {
  if (!rescueRenderer) return;
  rescueRenderer.getTicker().add((deltaTime) => {
    if (!rescueGameState.isPlaying || rescueGameState.isPaused || rescueGameState.isGameOver) return;

    const delta = (deltaTime as unknown as { deltaTime?: number }).deltaTime
      ? (deltaTime as unknown as { deltaTime: number }).deltaTime / 60
      : (deltaTime as number) / 60;

    rescueModeSystem.update(delta);

    if (rescueRenderer) {
      rescueRenderer.updateParticles(delta);
      rescueRenderer.updateCamera(rescueGameState.playerPosition.y);
      rescueRenderer.renderInterferenceZones(rescueModeSystem.getInterferenceZones());
      rescueRenderer.renderPaths(rescueModeSystem.getSafePaths(), rescueGameState.path);
      rescueRenderer.renderCapsules(rescueModeSystem.getCapsules());
      rescueRenderer.renderEchoPoints(rescueModeSystem.getEchoPoints() as any);
      rescueRenderer.renderSonarWaves(rescueModeSystem.getSonarWaves() as any);
      rescueRenderer.renderMoveTarget(rescueModeSystem.getMoveTarget(), rescueGameState.playerPosition);
      rescueRenderer.renderPathStateIndicator(rescueGameState.path, rescueGameState.playerPosition);
      rescueRenderer.drawPlayer(rescueGameState.playerPosition);
    }
  });
};

const handleStart = () => {
  isDailyChallengeMode.value = false;
  isRescueMode.value = false;
  isDailyNewRecord.value = false;
  gameController?.setDailyChallenge(null);
  gameStarted.value = true;

  if (rescueRenderer) {
    rescueRenderer.destroy();
    rescueRenderer = null;
  }

  if (canvasRef.value && !gameController) {
    gameController = new GameController(canvasRef.value, collectionSystem, researchStationSystem, voyageArchiveSystem);
    gameController.setLoadout(currentLoadout.value);
    gameController.setCallbacks(
      updateState,
      handleScoreEvent,
      handleGameOver,
      handleLevelUp,
      handleUnlockEvent,
      handleRewardTriggered
    );
  }

  gameController?.setLoadout(currentLoadout.value);
  gameController?.startGame();
  setTimeout(() => {
    showHint.value = false;
  }, 5000);
};

const handleDailyChallengeStart = () => {
  isDailyChallengeMode.value = true;
  isRescueMode.value = false;
  isDailyNewRecord.value = false;
  refreshDailyChallenge();
  if (dailyChallenge.value) {
    gameController?.setDailyChallenge(dailyChallenge.value);
  }
  showDailyChallenge.value = false;
  gameStarted.value = true;

  if (rescueRenderer) {
    rescueRenderer.destroy();
    rescueRenderer = null;
  }

  if (canvasRef.value && !gameController) {
    gameController = new GameController(canvasRef.value, collectionSystem, researchStationSystem, voyageArchiveSystem);
    gameController.setLoadout(currentLoadout.value);
    gameController.setCallbacks(
      updateState,
      handleScoreEvent,
      handleGameOver,
      handleLevelUp,
      handleUnlockEvent,
      handleRewardTriggered
    );
  }

  gameController?.setLoadout(currentLoadout.value);
  gameController?.startGame();
  setTimeout(() => {
    showHint.value = false;
  }, 5000);
};

const handlePrepStart = (loadout: ExpeditionLoadout) => {
  currentLoadout.value = { ...loadout };
  try {
    localStorage.setItem('deepSeaSonar_loadout', JSON.stringify(loadout));
  } catch (_e) {}
  showPrep.value = false;
  isRescueMode.value = false;
  gameStarted.value = true;

  if (rescueRenderer) {
    rescueRenderer.destroy();
    rescueRenderer = null;
  }

  if (canvasRef.value && !gameController) {
    gameController = new GameController(canvasRef.value, collectionSystem, researchStationSystem, voyageArchiveSystem);
    gameController.setLoadout(currentLoadout.value);
    gameController.setCallbacks(
      updateState,
      handleScoreEvent,
      handleGameOver,
      handleLevelUp,
      handleUnlockEvent,
      handleRewardTriggered
    );
  }

  gameController?.setLoadout(currentLoadout.value);
  gameController?.startGame();
  setTimeout(() => {
    showHint.value = false;
  }, 5000);
};

const openPrep = () => {
  showPrep.value = true;
};

const closePrep = () => {
  showPrep.value = false;
};

const openDailyChallenge = () => {
  refreshDailyChallenge();
  showDailyChallenge.value = true;
};

const closeDailyChallenge = () => {
  showDailyChallenge.value = false;
};

const openDailyLeaderboard = () => {
  leaderboardOpenedFromGameOver.value = false;
  showDailyLeaderboard.value = true;
};

const openDailyLeaderboardFromGameOver = () => {
  leaderboardOpenedFromGameOver.value = true;
  refreshDailyChallenge();
  showDailyLeaderboard.value = true;
};

const closeDailyLeaderboard = () => {
  showDailyLeaderboard.value = false;
  if (leaderboardOpenedFromGameOver.value) {
    leaderboardOpenedFromGameOver.value = false;
  }
};

const handleRestart = () => {
  isDailyNewRecord.value = false;
  if (isDailyChallengeMode.value) {
    refreshDailyChallenge();
    if (dailyChallenge.value) {
      gameController?.setDailyChallenge(dailyChallenge.value);
    }
  }
  gameController?.setLoadout(currentLoadout.value);
  gameController?.startGame();
};

const handleHome = () => {
  gameStarted.value = false;
  isDailyChallengeMode.value = false;
  isRescueMode.value = false;
  isDailyNewRecord.value = false;
  isRescueNewRecord.value = false;
  showOceanEditor.value = false;
  showVoyageArchive.value = false;
  Object.assign(gameState, {
    score: 0,
    lives: 3,
    level: 1,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    sonarCharges: 5,
    maxSonarCharges: 5,
    discoveredTargets: 0,
    totalTargets: 0,
  });
  Object.assign(rescueGameState, rescueModeSystem.getState());
  showHint.value = true;
  showRescueHint.value = true;
  showDailyLeaderboard.value = false;
  showResearch.value = false;
  showRescueIntro.value = false;
  lastExpeditionReward.value = null;
  lastRescueResult.value = null;
  refreshCollection();
  refreshDailyChallenge();
  refreshResearchStation();

  if (rescueRenderer) {
    rescueRenderer.destroy();
    rescueRenderer = null;
  }
  if (gameController) {
    gameController.destroy();
    gameController = null;
  }
};

const openCollection = () => {
  refreshCollection();
  showCollection.value = true;
};

const closeCollection = () => {
  showCollection.value = false;
};

const handleResetCollection = () => {
  collectionSystem.resetAll();
  refreshCollection();
};

const openResearch = () => {
  refreshResearchStation();
  showResearch.value = true;
};

const closeResearch = () => {
  showResearch.value = false;
};

const handleTechUnlock = (_techId: string) => {
  refreshResearchStation();
};

const handleResearchReset = () => {
  refreshResearchStation();
};

const getEventPosition = (clientX: number, clientY: number) => {
  if (!canvasRef.value) return null;
  if (isRescueMode.value) {
    if (!rescueRenderer) return null;
    const rect = canvasRef.value.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return rescueRenderer.screenToWorld(x, y);
  }
  if (!gameController) return null;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return gameController.screenToWorld(x, y);
};

const handleClick = (e: MouseEvent) => {
  const pos = getEventPosition(e.clientX, e.clientY);
  if (!pos) return;
  processInteraction(pos, e.clientX, e.clientY);
};

const handleTouch = (e: TouchEvent) => {
  if (e.touches.length === 0) return;
  const touch = e.touches[0];
  const pos = getEventPosition(touch.clientX, touch.clientY);
  if (!pos) return;
  processInteraction(pos, touch.clientX, touch.clientY);
};

const processInteraction = (worldPos: { x: number; y: number }, _screenX: number, _screenY: number) => {
  if (isRescueMode.value) {
    if (!rescueModeSystem) return;

    const result = rescueModeSystem.handleTap(worldPos);
    if (!result.handled) {
      const rescueState = rescueModeSystem.getState();
      const hasActivePath = rescueState.path.activePathId !== null &&
        rescueState.path.followStatus === 'following';
      if (hasActivePath) {
        rescueModeSystem.setMoveTarget(worldPos);
      } else {
        rescueModeSystem.fireSonar(worldPos);
      }
    }
  } else {
    if (!gameController) return;

    gameController.setMoveTarget(worldPos);

    const result = gameController.handleTap(worldPos);
    if (!result.hit) {
      gameController.fireSonar(worldPos);
    }
  }
};

onMounted(() => {
  try {
    const savedScore = localStorage.getItem('deepSeaSonar_highScore');
    if (savedScore) highScore.value = parseInt(savedScore, 10) || 0;
    const savedLoadout = localStorage.getItem('deepSeaSonar_loadout');
    if (savedLoadout) {
      try {
        const parsed = JSON.parse(savedLoadout);
        if (parsed && parsed.submarine && parsed.sonarChip && parsed.supplyPack) {
          currentLoadout.value = parsed;
        }
      } catch (_e) {}
    }
    const savedRescueScores = localStorage.getItem('deepSeaSonar_rescueBestScores');
    if (savedRescueScores) {
      try {
        const parsed = JSON.parse(savedRescueScores);
        if (Array.isArray(parsed) && parsed.length === 5) {
          rescueBestScores.value = parsed;
        }
      } catch (_e) {}
    }

    const savedPathCompletion = localStorage.getItem('deepSeaSonar_rescueBestPathCompletion');
    if (savedPathCompletion) {
      try {
        const parsed = JSON.parse(savedPathCompletion);
        if (Array.isArray(parsed) && parsed.length === 5) {
          rescueBestPathCompletion.value = parsed;
        }
      } catch (_e) {}
    }

    const savedPerfectPaths = localStorage.getItem('deepSeaSonar_rescuePerfectPaths');
    if (savedPerfectPaths) {
      try {
        const parsed = JSON.parse(savedPerfectPaths);
        if (Array.isArray(parsed) && parsed.length === 5) {
          rescuePerfectPaths.value = parsed;
        }
      } catch (_e) {}
    }

    const savedLowestOfftrack = localStorage.getItem('deepSeaSonar_rescueLowestOfftrack');
    if (savedLowestOfftrack) {
      try {
        const parsed = JSON.parse(savedLowestOfftrack);
        if (Array.isArray(parsed) && parsed.length === 5) {
          rescueLowestOfftrack.value = parsed;
        }
      } catch (_e) {}
    }
  } catch (_e) {}

  refreshCollection();
  refreshDailyChallenge();
  refreshResearchStation();

  if (canvasRef.value) {
    gameController = new GameController(canvasRef.value, collectionSystem, researchStationSystem, voyageArchiveSystem);
    gameController.setLoadout(currentLoadout.value);
    gameController.setCallbacks(
      updateState,
      handleScoreEvent,
      handleGameOver,
      handleLevelUp,
      handleUnlockEvent,
      handleRewardTriggered
    );
  }
});

onUnmounted(() => {
  gameController?.destroy();
  rescueRenderer?.destroy();
});
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000510;
}

.game-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.game-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.touch-area {
  position: absolute;
  inset: 0;
  z-index: 5;
  cursor: crosshair;
}
</style>
