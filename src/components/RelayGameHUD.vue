<template>
  <div class="relay-hud">
    <div class="hud-top">
      <div class="phase-indicator">
        <div class="phase-icon" :style="{ color: currentPhaseColor }">{{ currentPhase.icon }}</div>
        <div class="phase-info">
          <div class="phase-name">{{ currentPhase.name }}</div>
          <div class="phase-timer" :class="{ warning: state.currentPhaseTimeRemaining < 10 }">
            ⏱ {{ formatTime(state.currentPhaseTimeRemaining) }}
          </div>
        </div>
      </div>

      <div class="current-player">
        <div class="player-avatar">{{ currentPlayer?.avatar }}</div>
        <div class="player-info">
          <div class="player-name">{{ currentPlayer?.name }}</div>
          <div class="player-role" :style="{ color: currentRoleColor }">
            {{ currentRole?.icon }} {{ currentRole?.name }}
          </div>
        </div>
      </div>
    </div>

    <div class="hud-middle">
      <div class="shared-stats">
        <div class="stat-item lives">
          <span class="stat-icon">❤️</span>
          <div class="stat-progress">
            <div
              class="stat-fill"
              :style="{ width: (state.shared.lives / state.shared.maxLives * 100) + '%' }"
            ></div>
          </div>
          <span class="stat-value">{{ state.shared.lives }}/{{ state.shared.maxLives }}</span>
        </div>

        <div class="stat-item sonar">
          <span class="stat-icon">🔊</span>
          <div class="stat-progress">
            <div
              class="stat-fill"
              :style="{ width: (state.shared.sonarCharges / state.shared.maxSonarCharges * 100) + '%' }"
            ></div>
          </div>
          <span class="stat-value">{{ state.shared.sonarCharges }}/{{ state.shared.maxSonarCharges }}</span>
        </div>
      </div>

      <div class="score-combo">
        <div class="score-display">
          <span class="score-label">总分</span>
          <span class="score-value">{{ state.shared.score.toLocaleString() }}</span>
        </div>
        <div v-if="state.shared.combo > 1" class="combo-display">
          <span class="combo-label">连击</span>
          <span class="combo-value">×{{ state.shared.combo }}</span>
        </div>
      </div>
    </div>

    <div class="hud-bottom">
      <div class="level-info">
        <span class="level-badge">Lv.{{ state.shared.level }}</span>
        <div class="discovery-progress">
          <span class="discovery-label">发现目标</span>
          <span class="discovery-value">{{ state.shared.discoveredTargets }}/{{ state.shared.totalTargets }}</span>
        </div>
      </div>

      <div class="phase-goal">
        <span class="goal-icon">🎯</span>
        <span class="goal-text">{{ currentPhase.targetGoal }}</span>
      </div>
    </div>

    <div class="players-status">
      <div
        v-for="(player, idx) in state.players"
        :key="player.id"
        class="player-status-item"
        :class="{ active: idx === state.currentPlayerIndex }"
      >
        <span class="status-avatar">{{ player.avatar }}</span>
        <div class="status-info">
          <div class="status-name">{{ player.name }}</div>
          <div class="status-stats">
            <span>🔊{{ player.stats.sonarUsed }}</span>
            <span>⭐{{ player.stats.discoveries }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="phase-transition" v-if="showTransition">
      <div class="transition-content">
        <div class="transition-phase">{{ nextPhase?.icon }} {{ nextPhase?.name }}</div>
        <div class="transition-player">
          <span>{{ nextPlayer?.avatar }}</span>
          <span>{{ nextPlayer?.name }} 准备</span>
        </div>
        <div class="transition-countdown">{{ transitionCountdown }}</div>
      </div>
    </div>

    <div class="hint-popup" v-if="showHint">
      <span class="hint-text">{{ getPhaseHint() }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { RelayGameState, RelayPlayer } from '../types/game';
import { RELAY_ROLES, RELAY_PHASES } from '../config/relayConfig';

const props = defineProps<{
  state: RelayGameState;
  showHint?: boolean;
}>();

const showTransition = ref(false);
const transitionCountdown = ref(3);
let transitionTimer: number | null = null;

const currentPhase = computed(() => {
  return RELAY_PHASES[props.state.phases[props.state.currentPhaseIndex]];
});

const currentPhaseColor = computed(() => {
  const role = RELAY_ROLES[currentPhase.value.role];
  return role?.color || '#00ffaa';
});

const currentPlayer = computed((): RelayPlayer | null => {
  if (props.state.players.length === 0) return null;
  return props.state.players[props.state.currentPlayerIndex];
});

const currentRole = computed(() => {
  if (!currentPlayer.value) return null;
  return RELAY_ROLES[currentPlayer.value.role];
});

const currentRoleColor = computed(() => {
  return currentRole.value?.color || '#00ffaa';
});

const nextPhase = computed(() => {
  const nextIndex = (props.state.currentPhaseIndex + 1) % props.state.phases.length;
  return RELAY_PHASES[props.state.phases[nextIndex]];
});

const nextPlayer = computed((): RelayPlayer | null => {
  if (props.state.players.length === 0) return null;
  const nextIndex = (props.state.currentPlayerIndex + 1) % props.state.players.length;
  return props.state.players[nextIndex];
});

const formatTime = (seconds: number): string => {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getPhaseHint = (): string => {
  const phase = currentPhase.value?.id;
  switch (phase) {
    case 'detection':
      return '🔊 点击地图释放声呐，探测隐藏目标';
    case 'navigation':
      return '🧭 点击地图移动潜航器，安全抵达深海';
    case 'collection':
      return '📦 点击发光的回波，收集生物和残骸';
    default:
      return '';
  }
};

watch(
  () => props.state.currentPhaseIndex,
  () => {
    showTransition.value = true;
    transitionCountdown.value = 3;

    if (transitionTimer) {
      clearInterval(transitionTimer);
    }

    transitionTimer = window.setInterval(() => {
      transitionCountdown.value--;
      if (transitionCountdown.value <= 0) {
        showTransition.value = false;
        if (transitionTimer) {
          clearInterval(transitionTimer);
          transitionTimer = null;
        }
      }
    }, 1000);
  },
);
</script>

<style scoped>
.relay-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  pointer-events: none;
  padding: 10px;
}

.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.phase-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 20, 40, 0.85);
  border: 1px solid rgba(0, 200, 255, 0.3);
  border-radius: 10px;
  backdrop-filter: blur(4px);
}

.phase-icon {
  font-size: 24px;
}

.phase-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.phase-name {
  font-size: 12px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.95);
  letter-spacing: 1px;
}

.phase-timer {
  font-size: 16px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.phase-timer.warning {
  color: #ff6644;
  animation: timer-blink 0.5s ease-in-out infinite;
}

@keyframes timer-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.current-player {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 20, 40, 0.85);
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  backdrop-filter: blur(4px);
}

.player-avatar {
  font-size: 28px;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: right;
}

.player-name {
  font-size: 12px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.95);
}

.player-role {
  font-size: 10px;
  font-weight: bold;
}

.hud-middle {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.shared-stats {
  display: flex;
  gap: 8px;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(0, 200, 255, 0.25);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.stat-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.stat-progress {
  flex: 1;
  height: 6px;
  background: rgba(0, 40, 70, 0.8);
  border-radius: 3px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffaa, #00e5ff);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stat-item.lives .stat-fill {
  background: linear-gradient(90deg, #ff6688, #ff4466);
}

.stat-item.sonar .stat-fill {
  background: linear-gradient(90deg, #00ccff, #0088ff);
}

.stat-value {
  font-size: 11px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.9);
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.score-combo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(255, 204, 0, 0.25);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.score-display {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.score-label {
  font-size: 10px;
  color: rgba(255, 200, 100, 0.7);
  letter-spacing: 1px;
}

.score-value {
  font-size: 20px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
}

.combo-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.combo-label {
  font-size: 10px;
  color: rgba(255, 150, 100, 0.7);
  letter-spacing: 1px;
}

.combo-value {
  font-size: 18px;
  font-weight: bold;
  color: #ff8844;
  font-family: 'Courier New', monospace;
  animation: combo-pulse 0.5s ease-out;
}

@keyframes combo-pulse {
  0% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.hud-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.level-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #00aaff, #0066ff);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  border-radius: 6px;
}

.discovery-progress {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.discovery-label {
  font-size: 9px;
  color: rgba(150, 200, 255, 0.6);
}

.discovery-value {
  font-size: 12px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.9);
  font-family: 'Courier New', monospace;
}

.phase-goal {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(0, 40, 60, 0.6);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.goal-icon {
  font-size: 14px;
}

.goal-text {
  font-size: 10px;
  color: rgba(150, 255, 200, 0.85);
}

.players-status {
  display: flex;
  gap: 6px;
  padding: 6px;
  background: rgba(0, 15, 30, 0.7);
  border: 1px solid rgba(0, 200, 255, 0.15);
  border-radius: 10px;
  backdrop-filter: blur(4px);
}

.player-status-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(0, 20, 40, 0.5);
  border: 1px solid rgba(0, 200, 255, 0.1);
  border-radius: 8px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.player-status-item.active {
  background: rgba(0, 60, 100, 0.4);
  border: 1px solid rgba(0, 255, 170, 0.5);
  opacity: 1;
  box-shadow: 0 0 12px rgba(0, 255, 170, 0.2);
}

.status-avatar {
  font-size: 18px;
  flex-shrink: 0;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-name {
  font-size: 10px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-stats {
  display: flex;
  gap: 6px;
  font-size: 9px;
  color: rgba(150, 200, 255, 0.7);
}

.phase-transition {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 10, 20, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: transition-fade 0.3s ease-out;
}

@keyframes transition-fade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.transition-content {
  text-align: center;
}

.transition-phase {
  font-size: 28px;
  font-weight: bold;
  color: #00ffcc;
  margin-bottom: 16px;
  letter-spacing: 2px;
}

.transition-player {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 20px;
  color: rgba(200, 230, 255, 0.9);
  margin-bottom: 20px;
}

.transition-player span:first-child {
  font-size: 36px;
}

.transition-countdown {
  font-size: 48px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
  animation: countdown-pulse 1s ease-in-out infinite;
}

@keyframes countdown-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.hint-popup {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: rgba(0, 40, 70, 0.9);
  border: 1px solid rgba(0, 200, 255, 0.4);
  border-radius: 20px;
  backdrop-filter: blur(4px);
  animation: hint-slide-up 0.3s ease-out;
}

@keyframes hint-slide-up {
  0% { opacity: 0; transform: translate(-50%, 20px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

.hint-text {
  font-size: 13px;
  color: rgba(200, 230, 255, 0.9);
  letter-spacing: 1px;
}
</style>
