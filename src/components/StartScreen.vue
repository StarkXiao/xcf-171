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

      <div class="daily-challenge-entry" @click="$emit('openDailyChallenge')">
        <div class="daily-icon-wrap">
          <span class="daily-icon">🎯</span>
          <span class="daily-badge" v-if="dailyChallengeCompleted">✓</span>
        </div>
        <div class="daily-info">
          <div class="daily-title">每日挑战</div>
          <div class="daily-subtitle" v-if="dailyChallengeTitle">{{ dailyChallengeTitle }}</div>
          <div class="daily-subtitle" v-else>今日挑战已解锁</div>
        </div>
        <div class="daily-score" v-if="(dailyBestScore ?? 0) > 0">
          <span class="daily-score-label">最佳</span>
          <span class="daily-score-value">{{ dailyBestScore }}</span>
        </div>
        <div class="daily-arrow">›</div>
      </div>

      <div class="rescue-entry" @click="$emit('openRescueMode')">
        <div class="rescue-icon-wrap">
          <span class="rescue-icon">🚨</span>
          <span class="rescue-pulse"></span>
        </div>
        <div class="rescue-info">
          <div class="rescue-title">深海救援模式</div>
          <div class="rescue-subtitle">紧急任务 · 定位失联舱体</div>
        </div>
        <div class="rescue-badge">NEW</div>
        <div class="rescue-arrow">›</div>
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

      <div class="stats-row">
        <div class="stat-item" v-if="highScore > 0">
          <span class="stat-label">最高分</span>
          <span class="stat-value high-score">{{ formatNumber(highScore) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">航次积分</span>
          <span class="stat-value points">{{ formatNumber(expeditionPoints) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">完成航次</span>
          <span class="stat-value">{{ expeditionsCompleted }}</span>
        </div>
      </div>

      <div class="research-entry" @click="$emit('openResearch')">
        <div class="research-icon-wrap">
          <span class="research-icon">🔬</span>
          <span class="research-badge" v-if="unlockedTechCount > 0">{{ unlockedTechCount }}</span>
        </div>
        <div class="research-info">
          <div class="research-title">研究站升级</div>
          <div class="research-subtitle">
            已解锁 {{ unlockedTechCount }}/{{ totalTechCount }} 项科技
          </div>
        </div>
        <div class="research-points">
          <span class="research-points-icon">⚡</span>
          <span class="research-points-value">{{ formatNumber(expeditionPoints) }}</span>
        </div>
        <div class="research-arrow">›</div>
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
  dailyChallengeCompleted?: boolean;
  dailyChallengeTitle?: string;
  dailyBestScore?: number;
  expeditionPoints: number;
  expeditionsCompleted: number;
  unlockedTechCount: number;
  totalTechCount: number;
}>();

defineEmits<{
  (e: 'start'): void;
  (e: 'openCollection'): void;
  (e: 'openPrep'): void;
  (e: 'openDailyChallenge'): void;
  (e: 'openResearch'): void;
  (e: 'openRescueMode'): void;
}>();

const collectionPercent = computed(() => {
  if (props.collectionStats.total === 0) return 0;
  return Math.round((props.collectionStats.unlocked / props.collectionStats.total) * 100);
});

const formatNumber = (n: number) => n.toLocaleString();
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

.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.stats-row .stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 8px;
  background: rgba(0, 40, 60, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 10px;
}

.stats-row .stat-label {
  font-size: 10px;
  color: rgba(200, 220, 255, 0.5);
  letter-spacing: 1px;
}

.stats-row .stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.stats-row .stat-value.high-score {
  color: #ffcc00;
}

.stats-row .stat-value.points {
  color: #ffaa00;
}

.research-entry {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(0, 100, 150, 0.15), rgba(0, 80, 180, 0.15));
  border: 1px solid rgba(100, 200, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.research-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(100, 200, 255, 0.08),
    transparent
  );
  animation: research-shine 4s ease-in-out infinite;
}

@keyframes research-shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.research-entry:hover {
  background: linear-gradient(135deg, rgba(0, 130, 180, 0.25), rgba(0, 100, 200, 0.25));
  border-color: rgba(100, 200, 255, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(100, 200, 255, 0.15);
}

.research-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.research-icon {
  font-size: 28px;
  display: block;
}

.research-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: linear-gradient(135deg, #00aaff, #0066ff);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(0, 170, 255, 0.5);
}

.research-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.research-title {
  font-size: 14px;
  font-weight: bold;
  color: rgba(150, 220, 255, 0.95);
  letter-spacing: 2px;
}

.research-subtitle {
  font-size: 11px;
  color: rgba(150, 200, 255, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.research-points {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  background: rgba(255, 204, 0, 0.12);
  border-radius: 14px;
  flex-shrink: 0;
}

.research-points-icon {
  font-size: 12px;
}

.research-points-value {
  font-size: 14px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
}

.research-arrow {
  font-size: 22px;
  color: rgba(100, 200, 255, 0.5);
  font-weight: bold;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.research-entry:hover .research-arrow {
  transform: translateX(3px);
  color: rgba(100, 200, 255, 0.8);
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

.daily-challenge-entry {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(255, 100, 50, 0.12), rgba(255, 50, 100, 0.12));
  border: 1px solid rgba(255, 150, 80, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.daily-challenge-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 180, 100, 0.1),
    transparent
  );
  animation: daily-shine 3s ease-in-out infinite;
}

@keyframes daily-shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.daily-challenge-entry:hover {
  background: linear-gradient(135deg, rgba(255, 120, 60, 0.2), rgba(255, 80, 120, 0.2));
  border-color: rgba(255, 180, 100, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(255, 150, 80, 0.2);
}

.daily-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.daily-icon {
  font-size: 28px;
  display: block;
}

.daily-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #00ff88, #00cc66);
  color: #003322;
  font-size: 11px;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
}

.daily-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.daily-title {
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 180, 100, 0.95);
  letter-spacing: 2px;
}

.daily-subtitle {
  font-size: 11px;
  color: rgba(255, 200, 150, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.daily-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.daily-score-label {
  font-size: 9px;
  color: rgba(255, 200, 150, 0.5);
  letter-spacing: 1px;
}

.daily-score-value {
  font-size: 16px;
  font-weight: bold;
  color: #ffcc66;
  font-family: 'Courier New', monospace;
}

.daily-arrow {
  font-size: 22px;
  color: rgba(255, 180, 100, 0.5);
  font-weight: bold;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.daily-challenge-entry:hover .daily-arrow {
  transform: translateX(3px);
  color: rgba(255, 180, 100, 0.8);
}

.rescue-entry {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(255, 60, 100, 0.1), rgba(200, 30, 120, 0.1));
  border: 1px solid rgba(255, 100, 150, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.rescue-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 100, 150, 0.08),
    transparent
  );
  animation: rescue-shine 2.5s ease-in-out infinite;
}

@keyframes rescue-shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.rescue-entry:hover {
  background: linear-gradient(135deg, rgba(255, 80, 120, 0.18), rgba(220, 50, 140, 0.18));
  border-color: rgba(255, 120, 170, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(255, 80, 140, 0.18);
}

.rescue-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.rescue-icon {
  font-size: 28px;
  display: block;
  position: relative;
  z-index: 2;
}

.rescue-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: rgba(255, 80, 100, 0.5);
  border-radius: 50%;
  animation: rescue-icon-pulse 1.2s ease-out infinite;
}

@keyframes rescue-icon-pulse {
  0% {
    width: 12px;
    height: 12px;
    opacity: 0.8;
  }
  100% {
    width: 48px;
    height: 48px;
    opacity: 0;
  }
}

.rescue-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.rescue-title {
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 180, 210, 0.95);
  letter-spacing: 2px;
}

.rescue-subtitle {
  font-size: 11px;
  color: rgba(255, 160, 190, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rescue-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #ff3366, #ff6699);
  color: #fff;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
  border-radius: 8px;
  flex-shrink: 0;
  animation: rescue-badge-pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(255, 80, 120, 0.5);
}

@keyframes rescue-badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.rescue-arrow {
  font-size: 22px;
  color: rgba(255, 120, 160, 0.5);
  font-weight: bold;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.rescue-entry:hover .rescue-arrow {
  transform: translateX(3px);
  color: rgba(255, 150, 180, 0.8);
}
</style>
