<template>
  <div class="game-container" ref="containerRef">
    <div class="game-canvas" ref="canvasRef"></div>

    <FloatingScore ref="floatingScoreRef" />

    <GameHUD
      v-if="gameState.isPlaying && !gameState.isGameOver"
      :state="gameState"
      :show-hint="showHint"
      :is-daily-challenge="isDailyChallengeMode"
      :daily-challenge-title="dailyChallenge?.title"
    />

    <StartScreen
      v-if="!gameStarted && !showCollection && !showPrep && !showDailyChallenge && !showDailyLeaderboard && !showResearch"
      :high-score="highScore"
      :collection-stats="collectionStats"
      :daily-challenge-completed="dailyChallengeSystem.isTodayCompleted()"
      :daily-challenge-title="dailyChallenge?.title"
      :daily-best-score="dailyChallengeSystem.getTodayBestRecord()?.score ?? 0"
      :expedition-points="researchStationStats.expeditionPoints"
      :expeditions-completed="researchStationStats.expeditionsCompleted"
      :unlocked-tech-count="researchStationStats.unlockedCount"
      :total-tech-count="researchStationStats.totalTechCount"
      @start="handleStart"
      @open-collection="openCollection"
      @open-prep="openPrep"
      @open-daily-challenge="openDailyChallenge"
      @open-research="openResearch"
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
      v-if="gameState.isGameOver && !showCollection && !showDailyLeaderboard && !showResearch"
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
      v-if="gameState.isPlaying && !gameState.isGameOver && !showCollection"
      class="touch-area"
      @click="handleClick"
      @touchstart.prevent="handleTouch"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import type { GameState, UnlockEvent, CollectionData, ExpeditionLoadout, DailyChallengeConfig, ResearchStationStats, ExpeditionReward } from './types/game';
import { GameController } from './game/GameController';
import { CollectionSystem } from './game/CollectionSystem';
import { DailyChallengeSystem } from './game/DailyChallengeSystem';
import { ResearchStationSystem } from './game/ResearchStationSystem';
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

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const floatingScoreRef = ref<InstanceType<typeof FloatingScore> | null>(null);

const gameStarted = ref(false);
const showHint = ref(true);
const highScore = ref(0);
const showCollection = ref(false);
const showPrep = ref(false);
const showDailyChallenge = ref(false);
const showDailyLeaderboard = ref(false);
const showResearch = ref(false);
const leaderboardOpenedFromGameOver = ref(false);
const isDailyChallengeMode = ref(false);
const isDailyNewRecord = ref(false);
const sessionUnlocks = ref<UnlockEvent[]>([]);
const currentLoadout = ref<ExpeditionLoadout>({ ...DEFAULT_LOADOUT });
const lastExpeditionReward = ref<ExpeditionReward | null>(null);

const collectionSystem = new CollectionSystem();
const dailyChallengeSystem = new DailyChallengeSystem();
const researchStationSystem = new ResearchStationSystem();

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

let gameController: GameController | null = null;

const updateState = (state: GameState) => {
  Object.assign(gameState, state);
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

const handleLevelUp = (_newLevel: number) => {};

const handleStart = () => {
  isDailyChallengeMode.value = false;
  isDailyNewRecord.value = false;
  gameController?.setDailyChallenge(null);
  gameStarted.value = true;
  gameController?.setLoadout(currentLoadout.value);
  gameController?.startGame();
  setTimeout(() => {
    showHint.value = false;
  }, 5000);
};

const handleDailyChallengeStart = () => {
  isDailyChallengeMode.value = true;
  isDailyNewRecord.value = false;
  refreshDailyChallenge();
  if (dailyChallenge.value) {
    gameController?.setDailyChallenge(dailyChallenge.value);
  }
  showDailyChallenge.value = false;
  gameStarted.value = true;
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
  gameStarted.value = true;
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
  isDailyNewRecord.value = false;
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
  showHint.value = true;
  showDailyLeaderboard.value = false;
  showResearch.value = false;
  lastExpeditionReward.value = null;
  refreshCollection();
  refreshDailyChallenge();
  refreshResearchStation();
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
  if (!canvasRef.value || !gameController) return null;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return gameController.screenToWorld(x, y);
};

const handleClick = (e: MouseEvent) => {
  const pos = getEventPosition(e.clientX, e.clientY);
  if (!pos || !gameController) return;
  processInteraction(pos, e.clientX, e.clientY);
};

const handleTouch = (e: TouchEvent) => {
  if (e.touches.length === 0) return;
  const touch = e.touches[0];
  const pos = getEventPosition(touch.clientX, touch.clientY);
  if (!pos || !gameController) return;
  processInteraction(pos, touch.clientX, touch.clientY);
};

const processInteraction = (worldPos: { x: number; y: number }, _screenX: number, _screenY: number) => {
  if (!gameController) return;

  const result = gameController.handleTap(worldPos);
  if (!result.hit) {
    gameController.fireSonar(worldPos);
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
  } catch (_e) {}

  refreshCollection();
  refreshDailyChallenge();
  refreshResearchStation();

  if (canvasRef.value) {
    gameController = new GameController(canvasRef.value, collectionSystem, researchStationSystem);
    gameController.setLoadout(currentLoadout.value);
    gameController.setCallbacks(
      updateState,
      handleScoreEvent,
      handleGameOver,
      handleLevelUp,
      handleUnlockEvent
    );
  }
});

onUnmounted(() => {
  gameController?.destroy();
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
