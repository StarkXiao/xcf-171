<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="game-over-title">探测终止</div>
      <div class="game-over-subtitle">Mission Terminated</div>

      <div class="score-display">
        <div class="score-label">最终得分</div>
        <div class="final-score">{{ formatNumber(score) }}</div>
        <div v-if="isNewHighScore" class="new-record">
          <span class="record-icon">🏆</span> 新纪录！
        </div>
      </div>

      <div class="stats">
        <div class="stat-item">
          <div class="stat-value">{{ level }}</div>
          <div class="stat-label">到达关卡</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ discovered }}</div>
          <div class="stat-label">发现目标</div>
        </div>
        <div class="stat-item">
          <div class="stat-value high">{{ formatNumber(highScore) }}</div>
          <div class="stat-label">最高纪录</div>
        </div>
      </div>

      <div class="rank-display">
        <span class="rank-label">评价等级</span>
        <span class="rank-badge" :class="rankClass">{{ rank }}</span>
      </div>

      <button class="restart-btn" @click="$emit('restart')">
        <span class="btn-icon">🔄</span>
        <span>再次探测</span>
      </button>

      <button class="home-btn" @click="$emit('home')">
        返回主页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  score: number;
  level: number;
  discovered: number;
  highScore: number;
}>();

defineEmits<{
  (e: 'restart'): void;
  (e: 'home'): void;
}>();

const isNewHighScore = computed(() => props.score >= props.highScore && props.score > 0);

const rank = computed(() => {
  if (props.score >= 3000) return 'S';
  if (props.score >= 2000) return 'A';
  if (props.score >= 1000) return 'B';
  if (props.score >= 500) return 'C';
  return 'D';
});

const rankClass = computed(() => ({
  'rank-s': rank.value === 'S',
  'rank-a': rank.value === 'A',
  'rank-b': rank.value === 'B',
  'rank-c': rank.value === 'C',
  'rank-d': rank.value === 'D',
}));

const formatNumber = (n: number) => n.toLocaleString();
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(20, 0, 20, 0.95) 0%, rgba(5, 0, 10, 0.98) 100%);
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
  padding: 30px 24px;
  max-width: 360px;
  width: 100%;
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

.game-over-title {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4466 0%, #ff6688 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 6px;
}

.game-over-subtitle {
  font-size: 11px;
  color: rgba(255, 100, 120, 0.5);
  letter-spacing: 5px;
  margin-top: 4px;
  text-transform: uppercase;
}

.score-display {
  margin: 28px 0 20px;
}

.score-label {
  font-size: 12px;
  color: rgba(200, 200, 220, 0.6);
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.final-score {
  font-size: 56px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #ffcc00 0%, #ff8800 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(255, 204, 0, 0.3);
  line-height: 1;
}

.new-record {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
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

.stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  background: rgba(0, 40, 60, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 10px;
  padding: 12px 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.stat-value.high {
  color: #ffcc00;
}

.stat-label {
  font-size: 10px;
  color: rgba(200, 200, 220, 0.5);
  margin-top: 4px;
  letter-spacing: 1px;
}

.rank-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.rank-label {
  font-size: 13px;
  color: rgba(200, 200, 220, 0.6);
  letter-spacing: 1px;
}

.rank-badge {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  border-radius: 50%;
  font-family: 'Courier New', monospace;
}

.rank-s {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #2a1800;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
}

.rank-a {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #1a1a1a;
  box-shadow: 0 0 16px rgba(192, 192, 192, 0.5);
}

.rank-b {
  background: linear-gradient(135deg, #cd7f32, #a06028);
  color: #fff;
  box-shadow: 0 0 14px rgba(205, 127, 50, 0.5);
}

.rank-c {
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
  box-shadow: 0 0 12px rgba(74, 144, 217, 0.4);
}

.rank-d {
  background: linear-gradient(135deg, #666, #444);
  color: #ccc;
  box-shadow: 0 0 10px rgba(100, 100, 100, 0.3);
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
  color: #001a2e;
  background: linear-gradient(135deg, #00ffcc 0%, #00aaff 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 3px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 255, 200, 0.4);
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(0, 255, 200, 0.6);
}

.btn-icon {
  font-size: 18px;
}

.home-btn {
  width: 100%;
  padding: 12px 24px;
  font-size: 14px;
  color: rgba(200, 220, 255, 0.8);
  background: transparent;
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.3s ease;
}

.home-btn:hover {
  background: rgba(0, 255, 170, 0.1);
  border-color: rgba(0, 255, 170, 0.5);
}
</style>
