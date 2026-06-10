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

      <div v-if="isDailyChallenge" class="daily-info">
        <div class="daily-header">
          <span class="daily-icon">🎯</span>
          <span class="daily-title">每日挑战 - {{ dailyChallengeTitle }}</span>
        </div>
        <div class="daily-stats-row">
          <div class="daily-stat">
            <span class="daily-stat-label">今日最佳</span>
            <span class="daily-stat-value best">{{ formatNumber(dailyBestScore ?? 0) }}</span>
          </div>
          <div class="daily-stat" v-if="dailyPlayerRank">
            <span class="daily-stat-label">当前排名</span>
            <span class="daily-stat-value rank">#{{ dailyPlayerRank }}</span>
          </div>
          <div class="daily-stat">
            <span class="daily-stat-label">尝试次数</span>
            <span class="daily-stat-value">{{ dailyAttempts }}</span>
          </div>
        </div>
        <div v-if="isDailyNewRecord" class="daily-new-record">
          <span class="record-icon">🏆</span> 刷新今日最佳！
        </div>
      </div>

      <div class="rank-display">
        <span class="rank-label">评价等级</span>
        <span class="rank-badge" :class="rankClass">{{ rank }}</span>
      </div>

      <div v-if="expeditionReward" class="expedition-reward-section">
        <div class="expedition-title">
          <span class="expedition-icon">⚡</span>
          <span>航次积分奖励</span>
        </div>
        <div class="expedition-total">
          <span class="expedition-total-label">获得积分</span>
          <span class="expedition-total-value">+{{ expeditionReward.points }}</span>
        </div>
        <div class="expedition-breakdown">
          <div class="breakdown-item">
            <span class="breakdown-label">基础奖励</span>
            <span class="breakdown-value">+{{ expeditionReward.breakdown.base }}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">关卡奖励</span>
            <span class="breakdown-value">+{{ expeditionReward.breakdown.level }}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">发现奖励</span>
            <span class="breakdown-value">+{{ expeditionReward.breakdown.discoveries }}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">得分奖励</span>
            <span class="breakdown-value">+{{ expeditionReward.breakdown.score }}</span>
          </div>
          <div class="breakdown-item" v-if="(expeditionReward.breakdown.dailyBonus ?? 0) > 0">
            <span class="breakdown-label daily">每日挑战加成</span>
            <span class="breakdown-value daily">+{{ expeditionReward.breakdown.dailyBonus }}</span>
          </div>
        </div>
        <div class="expedition-total-points">
          <span>当前总积分：</span>
          <span class="total-points-value">{{ formatNumber(totalExpeditionPoints) }}</span>
        </div>
      </div>

      <div v-if="sessionUnlocks.length > 0" class="unlocks-section">
        <div class="unlocks-title">
          <span class="unlocks-icon">📖</span>
          <span>本局图鉴解锁</span>
        </div>
        <div class="unlocks-list">
          <div
            v-for="u in sessionUnlocks"
            :key="u.name + u.entry.lastDiscoveredAt"
            class="unlock-item"
            :class="u.type"
          >
            <span class="unlock-name">{{ u.name }}</span>
            <span v-if="u.isNew" class="unlock-new">NEW</span>
          </div>
        </div>
      </div>

      <button class="restart-btn" @click="$emit('restart')">
        <span class="btn-icon">🔄</span>
        <span>{{ isDailyChallenge ? '再次挑战' : '再次探测' }}</span>
      </button>

      <button class="leaderboard-btn" @click="$emit('openLeaderboard')" v-if="isDailyChallenge">
        <span class="btn-icon">🏆</span>
        <span>查看排行榜</span>
      </button>

      <button class="collection-btn" @click="$emit('openCollection')" v-if="sessionUnlocks.length > 0">
        <span class="btn-icon">📖</span>
        <span>查看图鉴</span>
      </button>

      <button class="home-btn" @click="$emit('home')">
        返回主页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UnlockEvent, ExpeditionReward } from '../types/game';

const props = defineProps<{
  score: number;
  level: number;
  discovered: number;
  highScore: number;
  sessionUnlocks: UnlockEvent[];
  isDailyChallenge?: boolean;
  dailyChallengeTitle?: string;
  dailyBestScore?: number;
  dailyPlayerRank?: number | null;
  dailyAttempts?: number;
  isDailyNewRecord?: boolean;
  expeditionReward?: ExpeditionReward | null;
  totalExpeditionPoints?: number;
}>();

defineEmits<{
  (e: 'restart'): void;
  (e: 'home'): void;
  (e: 'openCollection'): void;
  (e: 'openLeaderboard'): void;
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

const formatNumber = (n: number | undefined | null) => (n ?? 0).toLocaleString();
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

.expedition-reward-section {
  margin-bottom: 18px;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.1), rgba(255, 136, 0, 0.1));
  border: 1px solid rgba(255, 204, 0, 0.35);
  border-radius: 12px;
  padding: 14px;
}

.expedition-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 204, 0, 0.95);
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.expedition-icon {
  font-size: 18px;
}

.expedition-total {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 204, 0, 0.08);
  border-radius: 10px;
  margin-bottom: 12px;
}

.expedition-total-label {
  font-size: 12px;
  color: rgba(255, 200, 150, 0.6);
  letter-spacing: 1px;
}

.expedition-total-value {
  font-size: 28px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 12px rgba(255, 204, 0, 0.4);
}

.expedition-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.breakdown-label {
  color: rgba(200, 200, 220, 0.55);
}

.breakdown-label.daily {
  color: rgba(255, 150, 100, 0.75);
}

.breakdown-value {
  color: rgba(255, 220, 150, 0.85);
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.breakdown-value.daily {
  color: rgba(255, 180, 120, 0.95);
}

.expedition-total-points {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 204, 0, 0.15);
  font-size: 12px;
  color: rgba(200, 200, 220, 0.55);
}

.total-points-value {
  font-size: 15px;
  font-weight: bold;
  color: #ffcc66;
  font-family: 'Courier New', monospace;
}

.unlocks-section {
  margin-bottom: 20px;
  background: rgba(0, 40, 60, 0.4);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 12px;
  padding: 12px 14px;
}

.unlocks-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(0, 255, 200, 0.9);
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.unlocks-icon {
  font-size: 16px;
}

.unlocks-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.unlock-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: rgba(0, 60, 80, 0.5);
  border-radius: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 255, 170, 0.25);
}

.unlock-item.creature {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 80, 100, 0.4);
}

.unlock-item.wreck {
  border-color: rgba(255, 204, 0, 0.35);
  background: rgba(100, 80, 0, 0.35);
}

.unlock-item.danger {
  border-color: rgba(255, 51, 85, 0.35);
  background: rgba(100, 20, 40, 0.4);
}

.unlock-name {
  font-weight: 500;
}

.unlock-new {
  font-size: 9px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #ff6688, #ff3355);
  padding: 1px 6px;
  border-radius: 8px;
  letter-spacing: 1px;
  animation: pulse-new 1.2s ease-in-out infinite;
}

@keyframes pulse-new {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.collection-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 204, 0, 0.95);
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.12), rgba(255, 136, 0, 0.12));
  border: 1px solid rgba(255, 204, 0, 0.45);
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 2px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(255, 204, 0, 0.1);
}

.collection-btn:hover {
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 136, 0, 0.2));
  border-color: rgba(255, 204, 0, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(255, 204, 0, 0.2);
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

.daily-info {
  background: linear-gradient(135deg, rgba(255, 100, 50, 0.15), rgba(255, 50, 100, 0.15));
  border: 1px solid rgba(255, 150, 80, 0.35);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 18px;
}

.daily-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.daily-icon {
  font-size: 20px;
}

.daily-title {
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 180, 100, 0.95);
  letter-spacing: 2px;
}

.daily-stats-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.daily-stat {
  flex: 1;
  text-align: center;
  background: rgba(60, 30, 10, 0.5);
  border-radius: 8px;
  padding: 8px 6px;
}

.daily-stat-label {
  display: block;
  font-size: 10px;
  color: rgba(255, 200, 150, 0.5);
  letter-spacing: 1px;
  margin-bottom: 3px;
}

.daily-stat-value {
  font-size: 16px;
  font-weight: bold;
  color: rgba(255, 200, 150, 0.9);
  font-family: 'Courier New', monospace;
}

.daily-stat-value.best {
  color: #ffcc66;
}

.daily-stat-value.rank {
  color: #ff8866;
}

.daily-new-record {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.25), rgba(255, 136, 0, 0.25));
  border: 1px solid rgba(255, 204, 0, 0.55);
  border-radius: 18px;
  color: #ffcc66;
  font-size: 13px;
  font-weight: bold;
  animation: pulse-daily-record 1.5s ease-in-out infinite;
}

@keyframes pulse-daily-record {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.leaderboard-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 204, 0, 0.95);
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.12), rgba(255, 136, 0, 0.12));
  border: 1px solid rgba(255, 204, 0, 0.45);
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 2px;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.leaderboard-btn:hover {
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 136, 0, 0.2));
  border-color: rgba(255, 204, 0, 0.6);
  transform: translateY(-1px);
}
</style>
