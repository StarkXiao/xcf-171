<template>
  <div class="game-container" ref="containerRef">
    <div class="game-canvas" ref="canvasRef"></div>

    <FloatingScore ref="floatingScoreRef" />

    <GameHUD
      v-if="gameState.isPlaying && !gameState.isGameOver && !isRelayMode"
      :state="gameState"
      :show-hint="showHint"
    />

    <RelayGameHUD
      v-if="relayGameState.isPlaying && !relayGameState.isGameOver && isRelayMode"
      :state="relayGameState"
      :show-hint="showRelayHint"
    />

    <StartScreen
      v-if="!gameStarted && !showCollection && !showPrep && !showRelayIntro && !showSalvageEvent"
      :high-score="highScore"
      :collection-stats="collectionStats"
      :relay-high-score="relayHighScore"
      :event-state="salvageEventState"
      @start="handleStart"
      @open-collection="openCollection"
      @open-prep="openPrep"
      @open-relay-mode="openRelayIntro"
      @open-salvage-event="openSalvageEvent"
    />

    <RelayModeIntro
      v-if="showRelayIntro && !gameStarted"
      :high-score="relayHighScore"
      @start="handleRelayStart"
      @back="closeRelayIntro"
    />

    <ExpeditionPrep
      v-if="showPrep && !gameStarted && !showCollection"
      :initial-loadout="currentLoadout"
      @start="handlePrepStart"
      @back="closePrep"
    />

    <GameOverScreen
      v-if="gameState.isGameOver && !showCollection && !isRelayMode"
      :score="gameState.score"
      :level="gameState.level"
      :discovered="gameState.discoveredTargets"
      :high-score="highScore"
      :session-unlocks="sessionUnlocks"
      @restart="handleRestart"
      @home="handleHome"
      @open-collection="openCollection"
    />

    <RelayGameOver
      v-if="relayGameState.isGameOver && isRelayMode"
      :result="lastRelayResult!"
      :is-new-high-score="isRelayNewRecord"
      @restart="handleRelayRestart"
      @home="handleHome"
    />

    <SalvageEvent
      v-if="showSalvageEvent"
      :system="salvageEventSystem"
      @close="closeSalvageEvent"
    />

    <CollectionCenter
      v-if="showCollection"
      :collection-data="collectionData"
      :stats="collectionStats"
      @close="closeCollection"
      @reset="handleResetCollection"
    />

    <div
      v-if="(gameState.isPlaying || relayGameState.isPlaying) && !showCollection"
      class="touch-area"
      @click="handleClick"
      @touchstart.prevent="handleTouch"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import type { GameState, UnlockEvent, CollectionData, ExpeditionLoadout, RelayGameState, RelayResult, RelayEvent, SalvageEventState, SalvageEventType } from './types/game';
import { GameController } from './game/GameController';
import { CollectionSystem } from './game/CollectionSystem';
import { RelayModeSystem } from './game/RelayModeSystem';
import { VoyageArchiveSystem } from './game/VoyageArchiveSystem';
import { SalvageEventSystem } from './game/SalvageEventSystem';
import type { ScoreEvent } from './game/ScoreSystem';
import { DEFAULT_LOADOUT } from './config/expeditionConfig';
import GameHUD from './components/GameHUD.vue';
import StartScreen from './components/StartScreen.vue';
import GameOverScreen from './components/GameOverScreen.vue';
import FloatingScore from './components/FloatingScore.vue';
import CollectionCenter from './components/CollectionCenter.vue';
import ExpeditionPrep from './components/ExpeditionPrep.vue';
import RelayModeIntro from './components/RelayModeIntro.vue';
import RelayGameHUD from './components/RelayGameHUD.vue';
import RelayGameOver from './components/RelayGameOver.vue';
import SalvageEvent from './components/SalvageEvent.vue';

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const floatingScoreRef = ref<InstanceType<typeof FloatingScore> | null>(null);

const gameStarted = ref(false);
const showHint = ref(true);
const highScore = ref(0);
const showCollection = ref(false);
const showPrep = ref(false);
const sessionUnlocks = ref<UnlockEvent[]>([]);
const currentLoadout = ref<ExpeditionLoadout>({ ...DEFAULT_LOADOUT });

const isRelayMode = ref(false);
const showRelayIntro = ref(false);
const relayHighScore = ref(0);
const showRelayHint = ref(true);
const lastRelayResult = ref<RelayResult | null>(null);
const isRelayNewRecord = ref(false);

const showSalvageEvent = ref(false);
const salvageEventState = ref<SalvageEventState | null>(null);

const collectionSystem = new CollectionSystem();
const voyageArchiveSystem = new VoyageArchiveSystem();
const salvageEventSystem = new SalvageEventSystem();

const relayGameState = reactive<RelayGameState>({
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  isVictory: false,
  currentPhaseIndex: 0,
  phases: ['detection', 'navigation', 'collection'],
  currentPlayerIndex: 0,
  players: [],
  shared: {
    score: 0,
    lives: 3,
    maxLives: 3,
    sonarCharges: 6,
    maxSonarCharges: 6,
    level: 1,
    discoveredTargets: 0,
    totalTargets: 0,
    combo: 0,
    maxCombo: 0,
  },
  phaseStartTime: 0,
  totalPlayTime: 0,
  currentPhaseTimeRemaining: 0,
});

let relaySystem: RelayModeSystem | null = null;

const collectionData = ref<CollectionData>(collectionSystem.getData());
const collectionStats = ref(collectionSystem.getStats());

const refreshCollection = () => {
  collectionData.value = collectionSystem.getData();
  collectionStats.value = collectionSystem.getStats();
};

const refreshSalvageEventState = () => {
  salvageEventState.value = salvageEventSystem.getState();
};

const handleSalvageEvent = (_event: SalvageEventType) => {
  refreshSalvageEventState();
};

const openSalvageEvent = () => {
  refreshSalvageEventState();
  showSalvageEvent.value = true;
};

const closeSalvageEvent = () => {
  showSalvageEvent.value = false;
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
      y = Math.max(60, Math.min(rect.height - 160, event.position.y - (world.y - event.position.y > 0 ? 0 : 0)));
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

  if (finalScore > highScore.value) {
    highScore.value = finalScore;
    try {
      localStorage.setItem('deepSeaSonar_highScore', String(finalScore));
    } catch (_e) {}
  }
};

const handleLevelUp = (_newLevel: number) => {};

const updateRelayState = (state: RelayGameState) => {
  Object.assign(relayGameState, state);
};

const handleRelayEvent = (event: RelayEvent) => {
  if (!floatingScoreRef.value || !containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const x = rect.width / 2;
  const y = rect.height / 2;

  if (event.type === 'phase_start') {
    const phaseNames: Record<string, string> = {
      detection: '探测阶段',
      navigation: '导航阶段',
      collection: '采集阶段',
    };
    floatingScoreRef.value.addScore(0, phaseNames[event.phase] || event.phase, 'bonus', x, y / 3);
  } else if (event.type === 'player_switch') {
    const player = relayGameState.players.find(p => p.id === event.toPlayerId);
    if (player) {
      floatingScoreRef.value.addScore(0, `轮到 ${player.name}`, 'bonus', x, y / 2);
    }
  } else if (event.type === 'combo_increase' && event.combo > 1) {
    floatingScoreRef.value.addScore(0, `连击 ×${event.combo}!`, 'bonus', x, y / 2);
  } else if (event.type === 'combo_break') {
    floatingScoreRef.value.addScore(0, '连击中断', 'damage', x, y / 2);
  } else if (event.type === 'danger_hit') {
    floatingScoreRef.value.addScore(-150, `触碰${event.targetType}`, 'damage', x, y / 2);
  } else if (event.type === 'target_discovered') {
    floatingScoreRef.value.addScore(50, `发现${event.targetType}`, 'collect', x, y / 2);
  } else if (event.type === 'shared_gained') {
    const typeNames: Record<string, string> = {
      life: '生命恢复',
      sonar: '声呐恢复',
      score: '额外奖励',
    };
    floatingScoreRef.value.addScore(event.bonus, typeNames[event.resourceType] || '奖励', 'bonus', x, y / 2);
  }
};

const handleRelayScoreEvent = (event: ScoreEvent) => {
  if (!floatingScoreRef.value || !containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  let x = rect.width / 2;
  let y = rect.height / 2;

  if (event.position.x !== 0 || event.position.y !== 0) {
    const world = relaySystem?.screenToWorld(event.position.x, event.position.y);
    if (world) {
      x = Math.max(40, Math.min(rect.width - 40, world.x));
      y = Math.max(60, Math.min(rect.height - 160, event.position.y));
    }
  }

  const type = event.type === 'levelUp' ? 'levelUp' : event.type === 'damage' ? 'damage' : 'collect';
  floatingScoreRef.value.addScore(event.points, event.targetName, type, x, y);
};

const handleRelayGameOver = (result: RelayResult) => {
  lastRelayResult.value = result;
  isRelayNewRecord.value = result.isNewRecord;

  if (result.isNewRecord) {
    relayHighScore.value = result.finalScore;
  }
};

const openRelayIntro = () => {
  showRelayIntro.value = true;
};

const closeRelayIntro = () => {
  showRelayIntro.value = false;
};

const startRelayGameLoop = () => {
  if (!relaySystem) return;
  relaySystem.getTicker().add((deltaTime) => {
    if (!relayGameState.isPlaying || relayGameState.isPaused || relayGameState.isGameOver) return;

    const delta = (deltaTime as unknown as { deltaTime?: number }).deltaTime
      ? (deltaTime as unknown as { deltaTime: number }).deltaTime / 60
      : (deltaTime as number) / 60;

    relaySystem?.update(delta);
  });
};

const handleRelayStart = (playerCount: number, playerNames: string[]) => {
  isRelayMode.value = true;
  showRelayIntro.value = false;
  gameStarted.value = true;

  if (gameController) {
    gameController.destroy();
    gameController = null;
  }

  if (canvasRef.value && !relaySystem) {
    relaySystem = new RelayModeSystem(canvasRef.value, voyageArchiveSystem);
    startRelayGameLoop();
  }

  if (relaySystem) {
    relaySystem.setupPlayers(playerCount, playerNames);
    relaySystem.setCallbacks(
      updateRelayState,
      handleRelayEvent,
      handleRelayGameOver,
      handleRelayScoreEvent,
    );
    relaySystem.startGame();
  }

  setTimeout(() => {
    showRelayHint.value = false;
  }, 8000);
};

const handleRelayRestart = () => {
  if (!relaySystem) return;
  showRelayHint.value = true;
  relaySystem.startGame();
  setTimeout(() => {
    showRelayHint.value = false;
  }, 6000);
};

const handleStart = () => {
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

const handleRestart = () => {
  gameController?.setLoadout(currentLoadout.value);
  gameController?.startGame();
};

const handleHome = () => {
  gameStarted.value = false;
  isRelayMode.value = false;
  isRelayNewRecord.value = false;
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
  Object.assign(relayGameState, {
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    isVictory: false,
    currentPhaseIndex: 0,
    phases: ['detection', 'navigation', 'collection'],
    currentPlayerIndex: 0,
    players: [],
    shared: {
      score: 0,
      lives: 3,
      maxLives: 3,
      sonarCharges: 6,
      maxSonarCharges: 6,
      level: 1,
      discoveredTargets: 0,
      totalTargets: 0,
      combo: 0,
      maxCombo: 0,
    },
    phaseStartTime: 0,
    totalPlayTime: 0,
    currentPhaseTimeRemaining: 0,
  });
  showHint.value = true;
  showRelayHint.value = true;
  showRelayIntro.value = false;
  lastRelayResult.value = null;
  refreshCollection();

  if (relaySystem) {
    relaySystem.destroy();
    relaySystem = null;
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

const getEventPosition = (clientX: number, clientY: number) => {
  if (!canvasRef.value) return null;
  if (isRelayMode.value) {
    if (!relaySystem) return null;
    const rect = canvasRef.value.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return relaySystem.screenToWorld(x, y);
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
  if (isRelayMode.value) {
    if (!relaySystem) return;

    relaySystem.setMoveTarget(worldPos);

    const result = relaySystem.handleTap(worldPos);
    if (!result.hit) {
      relaySystem.fireSonar(worldPos);
    }
  } else {
    if (!gameController) return;

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
    const savedRelayScore = localStorage.getItem('deepSeaSonar_relayHighScore');
    if (savedRelayScore) {
      try {
        relayHighScore.value = parseInt(savedRelayScore, 10) || 0;
      } catch (_e) {}
    }
  } catch (_e) {}

  refreshCollection();
  refreshSalvageEventState();

  salvageEventSystem.setEventCallback(handleSalvageEvent);

  if (canvasRef.value) {
    gameController = new GameController(canvasRef.value, collectionSystem, salvageEventSystem);
    gameController.setLoadout(currentLoadout.value);
    gameController.setCallbacks(
      updateState,
      handleScoreEvent,
      handleGameOver,
      handleLevelUp,
      handleUnlockEvent
    );
  }

  const salvageTimer = window.setInterval(() => {
    refreshSalvageEventState();
  }, 1000);
  (window as any).__salvageTimer = salvageTimer;
});

onUnmounted(() => {
  gameController?.destroy();
  relaySystem?.destroy();
  salvageEventSystem.destroy();
  const salvageTimer = (window as any).__salvageTimer;
  if (salvageTimer) {
    clearInterval(salvageTimer);
  }
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
