<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="title-container">
        <h1 class="game-title">深海声呐辨影</h1>
        <div class="subtitle">Deep Sea Sonar Echo</div>
      </div>

      <div class="sonar-animation">
        <div class="sonar-ring ring-1"></div>
        <div class="sonar-ring ring-2"></div>
        <div class="sonar-ring ring-3"></div>
        <div class="sonar-center"></div>
      </div>

      <div class="instructions">
        <div class="instruction-item">
          <span class="icon">🔊</span>
          <span>点击地图释放声呐波，探测隐藏目标</span>
        </div>
        <div class="instruction-item">
          <span class="icon">🐟</span>
          <span>点击回波，收集生物和残骸获得分数</span>
        </div>
        <div class="instruction-item">
          <span class="icon">⚠️</span>
          <span>避开红色危险水雷，否则损失生命</span>
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot creature"></span>
          <span>海洋生物 +100</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot wreck"></span>
          <span>残骸遗迹 +200</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot danger"></span>
          <span>危险水雷 -150</span>
        </div>
      </div>

      <div class="salvage-entry" @click="$emit('openSalvageEvent')" v-if="eventState">
        <div class="salvage-icon-wrap">
          <span class="salvage-icon">🏴‍☠️</span>
          <span class="salvage-glow"></span>
        </div>
        <div class="salvage-info">
          <div class="salvage-title">{{ eventState.config?.title }}</div>
          <div class="salvage-subtitle">
            <span v-if="eventState.isActive">剩余 {{ formatCountdown(eventState.timeRemaining) }}</span>
            <span v-else-if="eventState.isComingSoon">即将开始</span>
            <span v-else>已结束</span>
          </div>
        </div>
        <div class="salvage-currency" v-if="eventState.progress && eventState.progress.eventCurrency > 0">
          <span class="salvage-currency-icon">💰</span>
          <span class="salvage-currency-value">{{ eventState.progress.eventCurrency }}</span>
        </div>
        <div class="salvage-badge" v-if="eventState.isActive">HOT</div>
        <div class="salvage-arrow">›</div>
      </div>

      <div class="relay-entry" @click="$emit('openRelayMode')">
        <div class="relay-icon-wrap">
          <span class="relay-icon">🤝</span>
          <span class="relay-glow"></span>
        </div>
        <div class="relay-info">
          <div class="relay-title">多人接力探索</div>
          <div class="relay-subtitle">同设备轮流 · 分工协作</div>
        </div>
        <div class="relay-score" v-if="(relayHighScore ?? 0) > 0">
          <span class="relay-score-label">最佳</span>
          <span class="relay-score-value">{{ relayHighScore }}</span>
        </div>
        <div class="relay-badge">NEW</div>
        <div class="relay-arrow">›</div>
      </div>

      <div class="voiceprint-entry" @click="$emit('openVoiceprintLab')">
        <div class="voiceprint-icon-wrap">
          <span class="voiceprint-icon">🔬</span>
          <span class="voiceprint-glow"></span>
        </div>
        <div class="voiceprint-info">
          <div class="voiceprint-title">声纹识别实验室</div>
          <div class="voiceprint-subtitle">多次采样 · 真伪判别 · 高风险高收益</div>
        </div>
        <div class="voiceprint-score" v-if="(voiceprintHighScore ?? 0) > 0">
          <span class="voiceprint-score-label">最佳</span>
          <span class="voiceprint-score-value">{{ voiceprintHighScore }}</span>
        </div>
        <div class="voiceprint-badge">HOT</div>
        <div class="voiceprint-arrow">›</div>
      </div>

      <div class="btn-row">
        <button class="prep-btn" @click="$emit('openPrep')">
          <span class="prep-icon">⚙️</span>
          <span class="prep-label">远征筹备</span>
        </button>
        <button class="start-btn" @click="$emit('start')">
          <span class="btn-text">开始探测</span>
          <span class="btn-glow"></span>
        </button>
      </div>

      <div class="high-score" v-if="highScore > 0">
        最高分: <span class="high-score-value">{{ highScore }}</span>
      </div>

      <div class="collection-entry" @click="$emit('openCollection')">
        <div class="collection-entry-icon">📖</div>
        <div class="collection-entry-info">
          <div class="collection-entry-title">深海图鉴中心</div>
          <div class="collection-entry-progress">
            <span class="progress-text">已解锁 {{ collectionStats.unlocked }}/{{ collectionStats.total }}</span>
            <div class="progress-bar-mini">
              <div
                class="progress-fill-mini"
                :style="{ width: collectionPercent + '%' }"
              ></div>
            </div>
          </div>
        </div>
        <div class="collection-entry-arrow">›</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SalvageEventState } from '../types/game';

const props = defineProps<{
  highScore: number;
  collectionStats: {
    total: number;
    unlocked: number;
    totalDiscoveries: number;
    creatures: { total: number; unlocked: number };
    wrecks: { total: number; unlocked: number };
    dangers: { total: number; unlocked: number };
  };
  relayHighScore?: number;
  voiceprintHighScore?: number;
  eventState?: SalvageEventState | null;
}>();

defineEmits<{
  (e: 'start'): void;
  (e: 'openCollection'): void;
  (e: 'openPrep'): void;
  (e: 'openRelayMode'): void;
  (e: 'openSalvageEvent'): void;
  (e: 'openVoiceprintLab'): void;
}>();

const collectionPercent = computed(() => {
  if (props.collectionStats.total === 0) return 0;
  return Math.round((props.collectionStats.unlocked / props.collectionStats.total) * 100);
});

const formatCountdown = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  if (days > 0) {
    return `${days}天${hours}小时`;
  }
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}小时${minutes}分`;
};
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(0, 20, 40, 0.95) 0%, rgba(0, 5, 15, 0.98) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.overlay-content {
  text-align: center;
  padding: 30px 24px;
  max-width: 380px;
  width: 100%;
}

.title-container {
  margin-bottom: 20px;
}

.game-title {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(135deg, #00ffcc 0%, #00aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  margin: 0;
  text-shadow: 0 0 40px rgba(0, 255, 200, 0.3);
}

.subtitle {
  font-size: 12px;
  color: rgba(0, 255, 200, 0.5);
  letter-spacing: 6px;
  margin-top: 6px;
  text-transform: uppercase;
}

.sonar-animation {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 24px auto;
}

.sonar-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: radial-gradient(circle, #00ffcc 0%, #00ffaa 100%);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 255, 200, 0.8), 0 0 40px rgba(0, 255, 200, 0.4);
}

.sonar-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(0, 255, 200, 0.6);
  border-radius: 50%;
  animation: sonar-expand 3s ease-out infinite;
}

.ring-1 { animation-delay: 0s; }
.ring-2 { animation-delay: 1s; }
.ring-3 { animation-delay: 2s; }

@keyframes sonar-expand {
  0% {
    width: 20px;
    height: 20px;
    opacity: 1;
  }
  100% {
    width: 160px;
    height: 160px;
    opacity: 0;
  }
}

.instructions {
  text-align: left;
  background: rgba(0, 40, 60, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  color: rgba(200, 240, 255, 0.85);
}

.instruction-item .icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(200, 240, 255, 0.7);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.creature {
  background: #00e5ff;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
}

.legend-dot.wreck {
  background: #ffcc00;
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.6);
}

.legend-dot.danger {
  background: #ff3355;
  box-shadow: 0 0 8px rgba(255, 51, 85, 0.6);
}

.btn-row {
  display: flex;
  gap: 10px;
}

.prep-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(0, 60, 100, 0.7), rgba(0, 30, 70, 0.8));
  border: 1px solid rgba(0, 255, 170, 0.4);
  border-radius: 12px;
  cursor: pointer;
  color: rgba(0, 255, 200, 0.95);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.prep-btn:hover {
  background: linear-gradient(135deg, rgba(0, 100, 150, 0.7), rgba(0, 50, 100, 0.8));
  border-color: rgba(0, 255, 170, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 200, 0.2);
}

.prep-btn:active {
  transform: translateY(0);
}

.prep-icon {
  font-size: 20px;
}

.prep-label {
  font-size: 11px;
  letter-spacing: 1px;
  font-weight: bold;
}

.start-btn {
  position: relative;
  flex: 1;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: bold;
  color: #001a2e;
  background: linear-gradient(135deg, #00ffcc 0%, #00aaff 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 255, 200, 0.4);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(0, 255, 200, 0.6);
}

.start-btn:active {
  transform: translateY(0);
}

.btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 60%
  );
  animation: btn-sheen 3s ease-in-out infinite;
}

@keyframes btn-sheen {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.high-score {
  margin-top: 16px;
  font-size: 13px;
  color: rgba(0, 255, 200, 0.6);
  letter-spacing: 1px;
}

.high-score-value {
  color: #ffcc00;
  font-weight: bold;
  font-size: 16px;
  margin-left: 4px;
}

.collection-entry {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(0, 50, 80, 0.6), rgba(0, 25, 45, 0.7));
  border: 1px solid rgba(0, 255, 170, 0.25);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.collection-entry:hover {
  background: linear-gradient(135deg, rgba(0, 80, 120, 0.6), rgba(0, 40, 70, 0.7));
  border-color: rgba(0, 255, 170, 0.45);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0, 255, 200, 0.1);
}

.collection-entry-icon {
  font-size: 26px;
  flex-shrink: 0;
}

.collection-entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.collection-entry-title {
  font-size: 14px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.95);
  letter-spacing: 2px;
}

.collection-entry-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 11px;
  color: rgba(200, 220, 255, 0.6);
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.progress-bar-mini {
  flex: 1;
  height: 5px;
  background: rgba(0, 50, 70, 0.6);
  border-radius: 3px;
  overflow: hidden;
  min-width: 0;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, #00ffaa, #00e5ff);
  border-radius: 3px;
  transition: width 0.4s ease;
  box-shadow: 0 0 6px rgba(0, 255, 170, 0.4);
}

.collection-entry-arrow {
  font-size: 22px;
  color: rgba(0, 255, 200, 0.5);
  font-weight: bold;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.collection-entry:hover .collection-entry-arrow {
  transform: translateX(3px);
  color: rgba(0, 255, 200, 0.8);
}

.relay-entry {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(150, 100, 255, 0.1), rgba(100, 50, 200, 0.1));
  border: 1px solid rgba(150, 120, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.relay-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(150, 120, 255, 0.08),
    transparent
  );
  animation: relay-shine 3s ease-in-out infinite;
}

@keyframes relay-shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.relay-entry:hover {
  background: linear-gradient(135deg, rgba(170, 120, 255, 0.18), rgba(120, 70, 220, 0.18));
  border-color: rgba(170, 140, 255, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(150, 120, 255, 0.2);
}

.relay-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.relay-icon {
  font-size: 28px;
  display: block;
  position: relative;
  z-index: 2;
}

.relay-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: rgba(150, 100, 255, 0.3);
  border-radius: 50%;
  animation: relay-icon-glow 2s ease-in-out infinite;
}

@keyframes relay-icon-glow {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.2;
  }
}

.relay-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.relay-title {
  font-size: 14px;
  font-weight: bold;
  color: rgba(180, 160, 255, 0.95);
  letter-spacing: 2px;
}

.relay-subtitle {
  font-size: 11px;
  color: rgba(160, 140, 240, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.relay-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
  margin-right: 8px;
}

.relay-score-label {
  font-size: 9px;
  color: rgba(160, 140, 240, 0.5);
  letter-spacing: 1px;
}

.relay-score-value {
  font-size: 16px;
  font-weight: bold;
  color: #cc99ff;
  font-family: 'Courier New', monospace;
}

.relay-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #9966ff, #7744dd);
  color: #fff;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(150, 100, 255, 0.5);
}

.relay-arrow {
  font-size: 22px;
  color: rgba(150, 120, 255, 0.5);
  font-weight: bold;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.relay-entry:hover .relay-arrow {
  transform: translateX(3px);
  color: rgba(180, 150, 255, 0.8);
}

.salvage-entry {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(255, 150, 50, 0.1), rgba(200, 80, 20, 0.1));
  border: 1px solid rgba(255, 180, 80, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.salvage-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 180, 80, 0.08),
    transparent
  );
  animation: salvage-shine 3s ease-in-out infinite;
}

@keyframes salvage-shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.salvage-entry:hover {
  background: linear-gradient(135deg, rgba(255, 170, 70, 0.18), rgba(220, 100, 40, 0.18));
  border-color: rgba(255, 200, 100, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(255, 150, 50, 0.2);
}

.salvage-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.salvage-icon {
  font-size: 28px;
  display: block;
  position: relative;
  z-index: 2;
}

.salvage-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: rgba(255, 180, 80, 0.3);
  border-radius: 50%;
  animation: salvage-icon-glow 2s ease-in-out infinite;
}

@keyframes salvage-icon-glow {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.2;
  }
}

.salvage-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.salvage-title {
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 210, 140, 0.95);
  letter-spacing: 2px;
}

.salvage-subtitle {
  font-size: 11px;
  color: rgba(255, 180, 120, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.salvage-currency {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  background: rgba(255, 150, 50, 0.15);
  border: 1px solid rgba(255, 180, 80, 0.3);
  border-radius: 12px;
  flex-shrink: 0;
  margin-right: 4px;
}

.salvage-currency-icon {
  font-size: 12px;
}

.salvage-currency-value {
  font-size: 13px;
  font-weight: bold;
  color: #ffcc66;
  font-family: 'Courier New', monospace;
}

.salvage-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #ff6644, #dd3322);
  color: #fff;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(255, 100, 50, 0.5);
  animation: badge-pulse 1.5s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.salvage-arrow {
  font-size: 22px;
  color: rgba(255, 180, 100, 0.5);
  font-weight: bold;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.salvage-entry:hover .salvage-arrow {
  transform: translateX(3px);
  color: rgba(255, 210, 140, 0.8);
}

.voiceprint-entry {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(255, 102, 255, 0.08), rgba(0, 170, 255, 0.08));
  border: 1px solid rgba(255, 102, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.voiceprint-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 102, 255, 0.08),
    transparent
  );
  animation: voiceprint-shine 3s ease-in-out infinite;
}

@keyframes voiceprint-shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.voiceprint-entry:hover {
  background: linear-gradient(135deg, rgba(255, 102, 255, 0.15), rgba(0, 170, 255, 0.15));
  border-color: rgba(255, 150, 255, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(255, 102, 255, 0.2);
}

.voiceprint-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.voiceprint-icon {
  font-size: 28px;
  display: block;
  position: relative;
  z-index: 2;
}

.voiceprint-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: rgba(255, 102, 255, 0.3);
  border-radius: 50%;
  animation: voiceprint-icon-glow 2s ease-in-out infinite;
}

@keyframes voiceprint-icon-glow {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.2;
  }
}

.voiceprint-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.voiceprint-title {
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 150, 255, 0.95);
  letter-spacing: 2px;
}

.voiceprint-subtitle {
  font-size: 11px;
  color: rgba(200, 150, 255, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voiceprint-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
  margin-right: 8px;
}

.voiceprint-score-label {
  font-size: 9px;
  color: rgba(200, 150, 255, 0.5);
  letter-spacing: 1px;
}

.voiceprint-score-value {
  font-size: 16px;
  font-weight: bold;
  color: #ff99ff;
  font-family: 'Courier New', monospace;
}

.voiceprint-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #ff66ff, #00aaff);
  color: #fff;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(255, 102, 255, 0.5);
  animation: badge-pulse 1.5s ease-in-out infinite;
}

.voiceprint-arrow {
  font-size: 22px;
  color: rgba(255, 102, 255, 0.5);
  font-weight: bold;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.voiceprint-entry:hover .voiceprint-arrow {
  transform: translateX(3px);
  color: rgba(255, 150, 255, 0.8);
}
</style>
