<template>
  <div class="rescue-hud">
    <div class="hud-top">
      <div class="hud-panel left">
        <div class="rescue-tag">
          <span class="rescue-tag-icon">🚨</span>
          <span class="rescue-tag-text">救援任务 · Lv.{{ state.currentLevel }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">救援分数</span>
          <span class="hud-value score">{{ formatNumber(state.score) }}</span>
        </div>
      </div>

      <div class="hud-panel right">
        <div class="timer-container" :class="{ warning: isWarning, critical: isCritical }">
          <div class="timer-icon">⏱</div>
          <div class="timer-value">{{ formatTime(state.timeRemaining) }}</div>
        </div>
        <div class="false-reports-container">
          <div class="fr-label">误报</div>
          <div class="fr-hearts">
            <span
              v-for="i in state.maxFalseReports"
              :key="i"
              class="fr-heart"
              :class="{ lost: i <= state.falseReports }"
            >{{ i <= state.falseReports ? '✗' : '●' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="rescue-progress">
      <div class="rp-header">
        <div class="rp-label">
          <span class="rp-icon">🛟</span>
          <span>救援进度</span>
        </div>
        <div class="rp-count">
          <span class="rescued">{{ state.capsulesRescued }}</span>
          <span class="sep">/</span>
          <span class="total">{{ state.totalRealCapsules }}</span>
        </div>
      </div>
      <div class="rp-bar">
        <div
          class="rp-fill"
          :style="{ width: rescuePercent + '%' }"
        ></div>
      </div>
      <div class="rp-sub">
        <span>已发现 <b>{{ state.capsulesFound }}</b> 个可疑信号</span>
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
    </div>

    <div class="hint" v-if="showHint">
      <span>🔊 点击释放声呐 · 📡 点击可疑回波确认</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RescueGameState } from '../types/game';

const props = defineProps<{
  state: RescueGameState;
  showHint: boolean;
}>();

const rescuePercent = computed(() => {
  if (props.state.totalRealCapsules === 0) return 0;
  return (props.state.capsulesRescued / props.state.totalRealCapsules) * 100;
});

const isWarning = computed(() => props.state.timeRemaining <= 30 && props.state.timeRemaining > 10);
const isCritical = computed(() => props.state.timeRemaining <= 10);

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const formatNumber = (n: number) => n.toLocaleString();
</script>

<style scoped>
.rescue-hud {
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
  background: linear-gradient(135deg, rgba(40, 0, 60, 0.88), rgba(20, 0, 40, 0.92));
  border: 1px solid rgba(255, 120, 180, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 20px rgba(255, 80, 140, 0.1);
}

.hud-panel.left {
  max-width: 55%;
}

.hud-panel.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.rescue-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  background: linear-gradient(135deg, rgba(255, 80, 120, 0.3), rgba(255, 50, 100, 0.3));
  border: 1px solid rgba(255, 120, 150, 0.5);
  border-radius: 12px;
  margin-bottom: 8px;
}

.rescue-tag-icon { font-size: 12px; }

.rescue-tag-text {
  font-size: 10px;
  font-weight: bold;
  color: rgba(255, 200, 220, 0.95);
  letter-spacing: 1px;
}

.hud-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.hud-label {
  font-size: 10px;
  color: rgba(255, 180, 210, 0.65);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hud-value {
  font-size: 22px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.hud-value.score {
  color: #ff88cc;
  text-shadow: 0 0 10px rgba(255, 136, 204, 0.5);
}

.timer-container {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(80, 20, 50, 0.5);
  border: 1px solid rgba(255, 120, 170, 0.35);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.timer-container.warning {
  border-color: rgba(255, 180, 80, 0.7);
  background: rgba(100, 60, 10, 0.5);
  animation: timer-warn 0.8s ease-in-out infinite;
}

.timer-container.critical {
  border-color: rgba(255, 80, 80, 0.85);
  background: rgba(100, 20, 20, 0.6);
  animation: timer-critical 0.4s ease-in-out infinite;
}

@keyframes timer-warn {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 180, 80, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 180, 80, 0.55); }
}

@keyframes timer-critical {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 80, 80, 0.4); transform: scale(1); }
  50% { box-shadow: 0 0 25px rgba(255, 80, 80, 0.7); transform: scale(1.02); }
}

.timer-icon { font-size: 14px; }

.timer-value {
  font-size: 20px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #ffaacc;
  text-shadow: 0 0 8px rgba(255, 170, 204, 0.5);
}

.timer-container.warning .timer-value { color: #ffcc66; }
.timer-container.critical .timer-value { color: #ff6666; }

.false-reports-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: rgba(60, 0, 30, 0.5);
  border-radius: 8px;
}

.fr-label {
  font-size: 10px;
  color: rgba(255, 150, 180, 0.6);
  letter-spacing: 1px;
}

.fr-hearts {
  display: flex;
  gap: 4px;
}

.fr-heart {
  font-size: 13px;
  color: #00ff88;
  text-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
  transition: all 0.3s ease;
}

.fr-heart.lost {
  color: #ff4466;
  text-shadow: 0 0 6px rgba(255, 68, 102, 0.5);
}

.rescue-progress {
  position: absolute;
  top: 110px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 340px;
  background: linear-gradient(135deg, rgba(30, 0, 60, 0.88), rgba(15, 0, 35, 0.92));
  border: 1px solid rgba(0, 255, 170, 0.25);
  border-radius: 12px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
}

.rp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.rp-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(0, 255, 200, 0.8);
  letter-spacing: 1px;
}

.rp-icon { font-size: 13px; }

.rp-count {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.rp-count .rescued {
  font-size: 18px;
  color: #00ffcc;
  text-shadow: 0 0 8px rgba(0, 255, 204, 0.5);
}

.rp-count .sep {
  font-size: 14px;
  color: rgba(150, 200, 220, 0.5);
  margin: 0 2px;
}

.rp-count .total {
  font-size: 14px;
  color: rgba(150, 220, 255, 0.6);
}

.rp-bar {
  height: 8px;
  background: rgba(0, 50, 80, 0.6);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.rp-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00ffcc, #00e5ff);
  border-radius: 4px;
  transition: width 0.4s ease;
  box-shadow: 0 0 10px rgba(0, 255, 170, 0.4);
}

.rp-sub {
  font-size: 10px;
  color: rgba(150, 220, 255, 0.55);
  text-align: center;
}

.rp-sub b {
  color: rgba(200, 240, 255, 0.85);
  font-weight: bold;
}

.hud-bottom {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
}

.sonar-bar {
  background: linear-gradient(135deg, rgba(40, 0, 60, 0.88), rgba(20, 0, 40, 0.92));
  border: 1px solid rgba(0, 204, 255, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
}

.sonar-label {
  font-size: 11px;
  color: rgba(0, 204, 255, 0.7);
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
  background: rgba(0, 40, 70, 0.6);
  border-radius: 4px;
  border: 1px solid rgba(0, 204, 255, 0.2);
  overflow: hidden;
  position: relative;
}

.sonar-charge.active .charge-inner {
  position: absolute;
  inset: 2px;
  background: linear-gradient(90deg, #00ccff, #00e5ff, #00ffff);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(0, 204, 255, 0.5);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.hint {
  position: absolute;
  bottom: 110px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(40, 0, 60, 0.9);
  border: 1px solid rgba(255, 120, 180, 0.4);
  color: rgba(255, 200, 230, 0.9);
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
