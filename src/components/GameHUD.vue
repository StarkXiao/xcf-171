<template>
  <div class="game-hud">
    <div class="hud-top">
      <div class="hud-panel">
        <div class="daily-tag" v-if="isDailyChallenge">
          <span class="daily-tag-icon">🎯</span>
          <span class="daily-tag-text">{{ dailyChallengeTitle || '每日挑战' }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">分数</span>
          <span class="hud-value score">{{ formatNumber(state.score) }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">关卡</span>
          <span class="hud-value level">{{ state.level }}</span>
        </div>
      </div>

      <div class="hud-panel">
        <div class="hud-item lives">
          <span class="hud-label">生命</span>
          <div class="hearts">
            <span v-for="i in Math.max(state.lives, 0)" :key="i" class="heart">❤</span>
            <span v-for="i in Math.max((minLivesForDisplay - state.lives), 0)" :key="'empty' + i" class="heart empty">♡</span>
          </div>
        </div>
      </div>
    </div>

    <div class="hud-bottom">
      <div class="sonar-bar">
        <div class="sonar-label">声呐能量</div>
        <div class="sonar-charges">
          <div
            v-for="i in state.maxSonarCharges"
            :key="i"
            class="sonar-charge"
            :class="{ active: i <= state.sonarCharges }"
          >
            <div class="charge-inner"></div>
          </div>
        </div>
      </div>

      <div class="progress">
        <div class="progress-label">
          已发现 {{ state.discoveredTargets }} / {{ state.totalTargets }}
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <div class="hint" v-if="showHint">
      <span>🖱 点击地图释放声呐 · 点击回波收集目标</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameState } from '../types/game';

const props = defineProps<{
  state: GameState;
  showHint: boolean;
  isDailyChallenge?: boolean;
  dailyChallengeTitle?: string;
}>();

const progressPercent = computed(() => {
  if (props.state.totalTargets === 0) return 0;
  return (props.state.discoveredTargets / props.state.totalTargets) * 100;
});

const minLivesForDisplay = computed(() => {
  return Math.max(3, props.state.lives + (3 - props.state.lives > 0 ? 0 : 0));
});

const formatNumber = (n: number) => {
  return n.toLocaleString();
};
</script>

<style scoped>
.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.hud-top {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.hud-panel {
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.85), rgba(0, 20, 40, 0.9));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 20px rgba(0, 255, 170, 0.1);
}

.daily-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(255, 100, 50, 0.3), rgba(255, 50, 100, 0.3));
  border: 1px solid rgba(255, 150, 80, 0.5);
  border-radius: 14px;
  margin-bottom: 8px;
}

.daily-tag-icon {
  font-size: 14px;
}

.daily-tag-text {
  font-size: 11px;
  font-weight: bold;
  color: rgba(255, 200, 150, 0.95);
  letter-spacing: 1px;
}

.hud-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.hud-panel:nth-child(2) .hud-item {
  align-items: flex-end;
}

.hud-label {
  font-size: 11px;
  color: rgba(0, 255, 200, 0.7);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hud-value {
  font-size: 22px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.hud-value.score {
  color: #00ffcc;
  text-shadow: 0 0 10px rgba(0, 255, 200, 0.5);
}

.hud-value.level {
  color: #ffcc00;
  text-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
}

.hearts {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.heart {
  font-size: 18px;
  color: #ff4466;
  text-shadow: 0 0 8px rgba(255, 68, 102, 0.6);
}

.heart.empty {
  color: rgba(255, 68, 102, 0.25);
  text-shadow: none;
}

.hud-bottom {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sonar-bar {
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.85), rgba(0, 20, 40, 0.9));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
}

.sonar-label {
  font-size: 11px;
  color: rgba(0, 255, 200, 0.7);
  letter-spacing: 1px;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.sonar-charges {
  display: flex;
  gap: 6px;
}

.sonar-charge {
  flex: 1;
  height: 14px;
  background: rgba(0, 50, 70, 0.6);
  border-radius: 4px;
  border: 1px solid rgba(0, 255, 170, 0.2);
  overflow: hidden;
  position: relative;
}

.sonar-charge.active .charge-inner {
  position: absolute;
  inset: 2px;
  background: linear-gradient(90deg, #00ffaa, #00e5ff);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(0, 255, 170, 0.5);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.progress {
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.85), rgba(0, 20, 40, 0.9));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  padding: 8px 14px;
  backdrop-filter: blur(8px);
}

.progress-label {
  font-size: 11px;
  color: rgba(0, 255, 200, 0.7);
  margin-bottom: 5px;
}

.progress-bar {
  height: 6px;
  background: rgba(0, 50, 70, 0.6);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffaa, #00e5ff);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(0, 255, 170, 0.4);
}

.hint {
  position: absolute;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 30, 50, 0.85);
  border: 1px solid rgba(0, 255, 170, 0.4);
  color: rgba(0, 255, 200, 0.9);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(6px);
  animation: hint-float 3s ease-in-out infinite;
}

@keyframes hint-float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-4px); }
}
</style>
