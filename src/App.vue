<template>
  <div class="game-container" ref="containerRef">
    <div class="game-canvas" ref="canvasRef"></div>

    <FloatingScore ref="floatingScoreRef" />

    <GameHUD
      v-if="gameState.isPlaying && !gameState.isGameOver"
      :state="gameState"
      :show-hint="showHint"
    />

    <StartScreen
      v-if="!gameStarted"
      :high-score="highScore"
      @start="handleStart"
    />

    <GameOverScreen
      v-if="gameState.isGameOver"
      :score="gameState.score"
      :level="gameState.level"
      :discovered="gameState.discoveredTargets"
      :high-score="highScore"
      @restart="handleRestart"
      @home="handleHome"
    />

    <div
      v-if="gameState.isPlaying && !gameState.isGameOver"
      class="touch-area"
      @click="handleClick"
      @touchstart.prevent="handleTouch"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import type { GameState } from './types/game';
import { GameController } from './game/GameController';
import type { ScoreEvent } from './game/ScoreSystem';
import GameHUD from './components/GameHUD.vue';
import StartScreen from './components/StartScreen.vue';
import GameOverScreen from './components/GameOverScreen.vue';
import FloatingScore from './components/FloatingScore.vue';

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const floatingScoreRef = ref<InstanceType<typeof FloatingScore> | null>(null);

const gameStarted = ref(false);
const showHint = ref(true);
const highScore = ref(0);

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
      y = Math.max(60, Math.min(rect.height - 160, event.position.y - (world.y - event.position.y > 0 ? 0 : 0)));
    }
  }

  const type = event.type === 'levelUp' ? 'levelUp' : event.type === 'damage' ? 'damage' : 'collect';
  floatingScoreRef.value.addScore(event.points, event.targetName, type, x, y);
};

const handleGameOver = (finalScore: number) => {
  if (finalScore > highScore.value) {
    highScore.value = finalScore;
    try {
      localStorage.setItem('deepSeaSonar_highScore', String(finalScore));
    } catch (_e) {}
  }
};

const handleLevelUp = (_newLevel: number) => {};

const handleStart = () => {
  gameStarted.value = true;
  gameController?.startGame();
  setTimeout(() => {
    showHint.value = false;
  }, 5000);
};

const handleRestart = () => {
  gameController?.startGame();
};

const handleHome = () => {
  gameStarted.value = false;
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
    const saved = localStorage.getItem('deepSeaSonar_highScore');
    if (saved) highScore.value = parseInt(saved, 10) || 0;
  } catch (_e) {}

  if (canvasRef.value) {
    gameController = new GameController(canvasRef.value);
    gameController.setCallbacks(
      updateState,
      handleScoreEvent,
      handleGameOver,
      handleLevelUp
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
