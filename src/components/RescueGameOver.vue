<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="result-header" :class="{ victory: result.victory, defeat: !result.victory }">
        <div class="result-icon">{{ result.victory ? '🎉' : '💔' }}</div>
        <div class="result-title">{{ result.victory ? '救援成功！' : '任务失败' }}</div>
        <div class="result-subtitle">
          {{ result.victory ? 'All Capsules Rescued' : 'Mission Failed' }}
        </div>
      </div>

      <div v-if="isNewHighScore" class="new-record">
        <span class="record-icon">🏆</span> 新纪录！
      </div>

      <div v-if="result.perfectPathBonus" class="perfect-path-badge">
        <span class="pp-icon">🛤️</span> 完美航线！
      </div>

      <div class="score-display">
        <div class="score-label">救援总分</div>
        <div class="final-score">{{ formatNumber(result.score) }}</div>
        <div v-if="result.totalPathBonus > 0" class="score-path-bonus">
          含航线加成 +{{ result.totalPathBonus }}
        </div>
      </div>

      <div class="rank-section">
        <div class="rank-label">任务评级</div>
        <div class="rank-badge" :class="'rank-' + result.rank.toLowerCase()">
          {{ result.rank }}
        </div>
      </div>

      <div class="stats">
        <div class="stat-item">
          <div class="stat-icon">🛟</div>
          <div class="stat-value rescued">{{ result.capsulesRescued }}/{{ result.totalRealCapsules }}</div>
          <div class="stat-label">救援成功</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">⚠️</div>
          <div class="stat-value danger">{{ result.falseReports }}</div>
          <div class="stat-label">误报次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">⏱</div>
          <div class="stat-value">{{ formatTime(result.timeRemaining) }}</div>
          <div class="stat-label">剩余时间</div>
        </div>
      </div>

      <div class="path-stats-section" v-if="result.safeTravelDistance > 0 || result.offtrackCount > 0">
        <div class="ps-header">
          <span class="ps-icon">🛤️</span>
          <span class="ps-title">航线数据</span>
        </div>

        <div class="ps-metrics">
          <div class="ps-metric">
            <span class="psm-label">航行距离</span>
            <span class="psm-value">{{ result.safeTravelDistance }}m</span>
          </div>
          <div class="ps-metric">
            <span class="psm-label">完成率</span>
            <span class="psm-value" :class="getCompletionClass(result.pathCompletionRate)">
              {{ result.pathCompletionRate }}%
            </span>
          </div>
          <div class="ps-metric">
            <span class="psm-label">航线加成</span>
            <span class="psm-value bonus">+{{ result.totalPathBonus }}</span>
          </div>
        </div>

        <div class="ps-violations">
          <div class="psv-item" v-if="result.offtrackCount > 0">
            <span class="psv-icon">⚠️</span>
            <span class="psv-label">偏航次数</span>
            <span class="psv-value danger">{{ result.offtrackCount }}</span>
          </div>
          <div class="psv-item" v-if="result.highRiskIncursions > 0">
            <span class="psv-icon">☢️</span>
            <span class="psv-label">高危区侵入</span>
            <span class="psv-value danger">{{ result.highRiskIncursions }}</span>
          </div>
          <div class="psv-item" v-if="result.blockerCollisions > 0">
            <span class="psv-icon">🚧</span>
            <span class="psv-label">阻断区碰撞</span>
            <span class="psv-value danger">{{ result.blockerCollisions }}</span>
          </div>
          <div class="psv-item perfect" v-if="result.perfectPathBonus">
            <span class="psv-icon">✨</span>
            <span class="psv-label">零违规航行</span>
            <span class="psv-value bonus">+500</span>
          </div>
        </div>
      </div>

      <div class="detail-stats">
        <div class="detail-row">
          <span class="detail-label">准确率</span>
          <span class="detail-value" :class="accuracyClass">{{ result.accuracy }}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">声呐使用</span>
          <span class="detail-value">{{ result.sonarUsed }} 次</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">关卡等级</span>
          <span class="detail-value">Lv.{{ result.level }}</span>
        </div>
        <div class="detail-row" v-if="result.offtrackCount > 0">
          <span class="detail-label">偏航处罚</span>
          <span class="detail-value danger">-{{ result.offtrackCount * 80 }}</span>
        </div>
        <div class="detail-row" v-if="result.highRiskIncursions > 0">
          <span class="detail-label">高危区处罚</span>
          <span class="detail-value danger">-{{ result.highRiskIncursions * 120 }}</span>
        </div>
      </div>

      <div class="reward-section">
        <div class="reward-header">
          <span class="reward-icon">⚡</span>
          <span>航次积分奖励</span>
        </div>
        <div class="reward-amount">
          <span class="reward-plus">+</span>
          <span class="reward-value">{{ result.rescuePoints }}</span>
        </div>
      </div>

      <div v-if="result.victory && result.level < 5" class="next-level-hint">
        🔓 解锁更高难度关卡！
      </div>

      <button class="restart-btn" @click="$emit('restart')">
        <span class="btn-icon">🔄</span>
        <span>{{ result.victory ? '再次挑战' : '重新救援' }}</span>
      </button>

      <div class="btn-row-2">
        <button class="level-btn" @click="$emit('selectLevel')">
          <span class="btn-icon">📋</span>
          <span>选择难度</span>
        </button>
        <button class="home-btn" @click="$emit('home')">
          <span class="btn-icon">🏠</span>
          <span>返回主页</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RescueResult } from '../types/game';

const props = defineProps<{
  result: RescueResult;
  isNewHighScore: boolean;
}>();

defineEmits<{
  (e: 'restart'): void;
  (e: 'home'): void;
  (e: 'selectLevel'): void;
}>();

const formatNumber = (n: number) => n.toLocaleString();

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const accuracyClass = computed(() => {
  if (props.result.accuracy >= 90) return 'excellent';
  if (props.result.accuracy >= 70) return 'good';
  if (props.result.accuracy >= 50) return 'normal';
  return 'poor';
});

const getCompletionClass = (rate: number) => {
  if (rate >= 90) return 'excellent';
  if (rate >= 70) return 'good';
  if (rate >= 50) return 'normal';
  return 'poor';
};
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(30, 0, 50, 0.95) 0%, rgba(10, 0, 25, 0.98) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(6px);
  animation: fade-in 0.4s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.overlay-content {
  text-align: center;
  padding: 28px 22px;
  max-width: 360px;
  width: 100%;
  max-height: 100vh;
  overflow-y: auto;
  animation: slide-up 0.5s ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-header {
  margin-bottom: 18px;
}

.result-header.victory {
  animation: victory-glow 2s ease-in-out infinite;
}

@keyframes victory-glow {
  0%, 100% { filter: none; }
  50% { filter: drop-shadow(0 0 20px rgba(0, 255, 170, 0.4)); }
}

.result-icon {
  font-size: 52px;
  margin-bottom: 8px;
}

.result-title {
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 4px;
}

.result-header.victory .result-title {
  background: linear-gradient(135deg, #00ffcc 0%, #00e5ff 50%, #00ccff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(0, 255, 200, 0.3);
}

.result-header.defeat .result-title {
  background: linear-gradient(135deg, #ff4466 0%, #ff6688 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(255, 68, 102, 0.3);
}

.result-subtitle {
  font-size: 11px;
  color: rgba(200, 200, 220, 0.45);
  letter-spacing: 5px;
  margin-top: 4px;
  text-transform: uppercase;
}

.new-record {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 136, 0, 0.2));
  border: 1px solid rgba(255, 204, 0, 0.5);
  border-radius: 20px;
  color: #ffcc00;
  font-size: 14px;
  font-weight: bold;
  animation: pulse-record 1.5s ease-in-out infinite;
}

@keyframes pulse-record {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.record-icon {
  font-size: 16px;
}

.perfect-path-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  margin-left: 8px;
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(0, 255, 200, 0.15), rgba(0, 170, 255, 0.15));
  border: 1px solid rgba(0, 255, 200, 0.5);
  border-radius: 20px;
  color: #00ffcc;
  font-size: 12px;
  font-weight: bold;
  animation: pulse-perfect 2s ease-in-out infinite;
}

@keyframes pulse-perfect {
  0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 200, 0.3); }
  50% { box-shadow: 0 0 25px rgba(0, 255, 200, 0.5); }
}

.pp-icon {
  font-size: 14px;
}

.score-display {
  margin: 16px 0;
}

.score-label {
  font-size: 12px;
  color: rgba(220, 200, 255, 0.6);
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.final-score {
  font-size: 52px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #ffcc00 0%, #ff8800 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(255, 204, 0, 0.3);
  line-height: 1;
}

.score-path-bonus {
  font-size: 11px;
  color: #00ffaa;
  margin-top: 4px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.rank-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 16px;
}

.rank-label {
  font-size: 13px;
  color: rgba(220, 200, 255, 0.6);
  letter-spacing: 1px;
}

.rank-badge {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  font-weight: bold;
  border-radius: 50%;
  font-family: 'Courier New', monospace;
}

.rank-s {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #2a1800;
  box-shadow: 0 0 24px rgba(255, 215, 0, 0.6);
  animation: rank-s-pulse 2s ease-in-out infinite;
}

@keyframes rank-s-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

.rank-a {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #1a1a1a;
  box-shadow: 0 0 18px rgba(192, 192, 192, 0.5);
}

.rank-b {
  background: linear-gradient(135deg, #cd7f32, #a06028);
  color: #fff;
  box-shadow: 0 0 16px rgba(205, 127, 50, 0.5);
}

.rank-c {
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
  box-shadow: 0 0 14px rgba(74, 144, 217, 0.4);
}

.rank-d {
  background: linear-gradient(135deg, #666, #444);
  color: #ccc;
  box-shadow: 0 0 12px rgba(100, 100, 100, 0.3);
}

.stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-item {
  flex: 1;
  background: rgba(40, 0, 70, 0.5);
  border: 1px solid rgba(255, 120, 180, 0.2);
  border-radius: 12px;
  padding: 12px 8px;
}

.stat-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #ff88cc;
  font-family: 'Courier New', monospace;
}

.stat-value.rescued {
  color: #00ffcc;
}

.stat-value.danger {
  color: #ff6688;
}

.stat-label {
  font-size: 10px;
  color: rgba(200, 180, 230, 0.5);
  margin-top: 3px;
  letter-spacing: 0.5px;
}

.path-stats-section {
  background: linear-gradient(135deg, rgba(10, 40, 60, 0.6), rgba(5, 20, 40, 0.7));
  border: 1px solid rgba(0, 255, 200, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.ps-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 255, 200, 0.15);
}

.ps-icon {
  font-size: 14px;
}

.ps-title {
  font-size: 12px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.9);
  letter-spacing: 2px;
}

.ps-metrics {
  display: flex;
  justify-content: space-around;
  margin-bottom: 10px;
}

.ps-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.psm-label {
  font-size: 9px;
  color: rgba(150, 220, 255, 0.5);
  letter-spacing: 0.5px;
}

.psm-value {
  font-size: 14px;
  font-weight: bold;
  color: #aaddff;
  font-family: 'Courier New', monospace;
}

.psm-value.bonus {
  color: #00ffaa;
}

.psm-value.excellent { color: #00ffcc; }
.psm-value.good { color: #66ff99; }
.psm-value.normal { color: #ffcc66; }
.psm-value.poor { color: #ff6688; }

.ps-violations {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 200, 255, 0.15);
}

.psv-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(0, 30, 50, 0.4);
  border-radius: 6px;
  font-size: 11px;
}

.psv-item.perfect {
  background: rgba(0, 80, 60, 0.4);
  border: 1px solid rgba(0, 255, 150, 0.3);
}

.psv-icon {
  font-size: 12px;
}

.psv-label {
  flex: 1;
  color: rgba(200, 230, 255, 0.65);
  text-align: left;
}

.psv-value {
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.psv-value.danger {
  color: #ff6666;
}

.psv-value.bonus {
  color: #00ffaa;
}

.detail-stats {
  background: rgba(30, 0, 50, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 12px;
}

.detail-row + .detail-row {
  border-top: 1px solid rgba(150, 150, 200, 0.08);
}

.detail-label {
  color: rgba(200, 180, 230, 0.55);
}

.detail-value {
  font-weight: bold;
  color: rgba(230, 210, 255, 0.85);
  font-family: 'Courier New', monospace;
}

.detail-value.excellent { color: #00ffcc; }
.detail-value.good { color: #66ff99; }
.detail-value.normal { color: #ffcc66; }
.detail-value.poor { color: #ff6688; }
.detail-value.danger { color: #ff6666; }

.reward-section {
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.12), rgba(255, 136, 0, 0.12));
  border: 1px solid rgba(255, 204, 0, 0.4);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}

.reward-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: bold;
  color: rgba(255, 204, 100, 0.95);
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.reward-icon { font-size: 17px; }

.reward-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}

.reward-plus {
  font-size: 22px;
  font-weight: bold;
  color: #ffcc66;
}

.reward-value {
  font-size: 36px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 14px rgba(255, 204, 0, 0.45);
}

.next-level-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, rgba(0, 255, 200, 0.12), rgba(0, 170, 255, 0.12));
  border: 1px solid rgba(0, 255, 200, 0.4);
  border-radius: 16px;
  font-size: 12px;
  color: rgba(0, 255, 220, 0.9);
  font-weight: bold;
}

.restart-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: bold;
  color: #2a0a1a;
  background: linear-gradient(135deg, #ff6699 0%, #ff4477 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 3px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 22px rgba(255, 80, 120, 0.45);
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(255, 80, 140, 0.65);
}

.btn-icon {
  font-size: 18px;
}

.btn-row-2 {
  display: flex;
  gap: 10px;
}

.level-btn,
.home-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: bold;
  color: rgba(220, 200, 255, 0.85);
  background: rgba(40, 0, 60, 0.6);
  border: 1px solid rgba(255, 120, 180, 0.25);
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.25s ease;
}

.level-btn:hover,
.home-btn:hover {
  background: rgba(70, 10, 100, 0.6);
  border-color: rgba(255, 150, 200, 0.45);
  transform: translateY(-1px);
}
</style>
