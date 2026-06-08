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

      <button class="start-btn" @click="$emit('start')">
        <span class="btn-text">开始探测</span>
        <span class="btn-glow"></span>
      </button>

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
}>();

defineEmits<{
  (e: 'start'): void;
  (e: 'openCollection'): void;
}>();

const collectionPercent = computed(() => {
  if (props.collectionStats.total === 0) return 0;
  return Math.round((props.collectionStats.unlocked / props.collectionStats.total) * 100);
});
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

.start-btn {
  position: relative;
  width: 100%;
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
</style>
