<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="header">
        <button class="back-btn" @click="$emit('back')">
          <span class="back-arrow">‹</span>
          <span>返回</span>
        </button>
        <div class="header-title">
          <span class="header-icon">🎯</span>
          <span>每日挑战</span>
        </div>
        <div class="header-spacer"></div>
      </div>

      <div class="streak-banner" v-if="streakDays > 0">
        <span class="streak-icon">🔥</span>
        <span class="streak-text">已连续挑战 {{ streakDays }} 天</span>
      </div>

      <div class="challenge-card" :class="{ completed: isCompleted }">
        <div class="challenge-date">{{ formatDate(challenge.date) }}</div>
        <div class="challenge-title">{{ challenge.title }}</div>
        <div class="challenge-desc">{{ challenge.description }}</div>

        <div class="rules-section">
          <div class="rules-title">
            <span class="rules-icon">📜</span>
            <span>今日限定规则</span>
          </div>
          <div class="rules-list">
            <div
              v-for="rule in challenge.rules"
              :key="rule.type"
              class="rule-item"
            >
              <span class="rule-icon">{{ rule.icon }}</span>
              <div class="rule-info">
                <div class="rule-name">{{ rule.name }}</div>
                <div class="rule-desc">{{ rule.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="target-info">
          <span class="target-label">目标关卡</span>
          <span class="target-value">Lv.{{ challenge.targetLevel }}</span>
        </div>
      </div>

      <div class="stats-row" v-if="bestRecord">
        <div class="stat-box">
          <div class="stat-label">今日最佳</div>
          <div class="stat-value best">{{ formatNumber(bestRecord.score) }}</div>
          <div class="stat-rank" :class="'rank-' + bestRecord.rank.toLowerCase()">
            {{ bestRecord.rank }}
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-label">尝试次数</div>
          <div class="stat-value">{{ attemptsToday }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">我的排名</div>
          <div class="stat-value rank" v-if="playerRank">#{{ playerRank }}</div>
          <div class="stat-value na" v-else>--</div>
        </div>
      </div>

      <div class="player-name-section">
        <span class="name-label">昵称</span>
        <input
          class="name-input"
          :value="playerName"
          @input="onNameInput"
          @blur="onNameBlur"
          @keyup.enter="onNameBlur"
          maxlength="10"
          placeholder="输入你的昵称"
        />
      </div>

      <button class="start-btn" @click="$emit('start')">
        <span class="btn-icon">⚔️</span>
        <span class="btn-text">{{ isCompleted ? '再次挑战' : '开始挑战' }}</span>
      </button>

      <button class="leaderboard-btn" @click="$emit('openLeaderboard')">
        <span class="btn-icon">🏆</span>
        <span>查看排行榜</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { DailyChallengeConfig, DailyChallengeRecord } from '../types/game';
import { DailyChallengeSystem } from '../game/DailyChallengeSystem';

const props = defineProps<{
  challenge: DailyChallengeConfig;
  bestRecord: DailyChallengeRecord | null;
  attemptsToday: number;
  playerRank: number | null;
  streakDays: number;
  system: DailyChallengeSystem;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'start'): void;
  (e: 'openLeaderboard'): void;
}>();

const playerName = ref(props.system.getPlayerName());
const isCompleted = computed(() => props.bestRecord !== null);

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${month}月${day}日 ${weekdays[date.getDay()]}`;
};

const formatNumber = (n: number) => n.toLocaleString();

const onNameInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  playerName.value = target.value;
};

const onNameBlur = () => {
  props.system.setPlayerName(playerName.value);
  playerName.value = props.system.getPlayerName();
};
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top, rgba(20, 0, 40, 0.97) 0%, rgba(5, 0, 15, 0.98) 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 100;
  overflow-y: auto;
  padding: 20px 0;
}

.overlay-content {
  width: 100%;
  max-width: 380px;
  padding: 16px 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 40, 80, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 8px;
  color: rgba(0, 255, 200, 0.9);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(0, 60, 100, 0.6);
  border-color: rgba(0, 255, 170, 0.5);
}

.back-arrow {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.95);
  letter-spacing: 2px;
}

.header-icon {
  font-size: 22px;
}

.header-spacer {
  width: 60px;
}

.streak-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(255, 100, 50, 0.2), rgba(255, 50, 100, 0.2));
  border: 1px solid rgba(255, 100, 50, 0.4);
  border-radius: 12px;
  margin-bottom: 14px;
  animation: pulse-streak 2s ease-in-out infinite;
}

@keyframes pulse-streak {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 100, 50, 0); }
  50% { box-shadow: 0 0 20px rgba(255, 100, 50, 0.3); }
}

.streak-icon {
  font-size: 20px;
}

.streak-text {
  color: rgba(255, 180, 100, 0.95);
  font-weight: bold;
  font-size: 14px;
  letter-spacing: 1px;
}

.challenge-card {
  background: linear-gradient(135deg, rgba(0, 50, 80, 0.6), rgba(0, 25, 50, 0.7));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s;
}

.challenge-card.completed {
  border-color: rgba(255, 204, 0, 0.4);
  box-shadow: 0 0 20px rgba(255, 204, 0, 0.1);
}

.challenge-date {
  font-size: 12px;
  color: rgba(0, 255, 200, 0.6);
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.challenge-title {
  font-size: 26px;
  font-weight: bold;
  background: linear-gradient(135deg, #00ffcc 0%, #00aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  margin-bottom: 8px;
}

.challenge-card.completed .challenge-title {
  background: linear-gradient(135deg, #ffcc00 0%, #ff8800 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.challenge-desc {
  font-size: 13px;
  color: rgba(200, 220, 255, 0.7);
  margin-bottom: 16px;
  line-height: 1.5;
}

.rules-section {
  background: rgba(0, 20, 40, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 14px;
}

.rules-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.85);
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.rules-icon {
  font-size: 16px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(0, 40, 70, 0.4);
  border-radius: 8px;
}

.rule-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

.rule-info {
  flex: 1;
  min-width: 0;
}

.rule-name {
  font-size: 13px;
  font-weight: bold;
  color: rgba(255, 200, 100, 0.95);
  margin-bottom: 2px;
}

.rule-desc {
  font-size: 11px;
  color: rgba(200, 220, 255, 0.6);
  line-height: 1.4;
}

.target-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(0, 80, 120, 0.3);
  border-radius: 8px;
}

.target-label {
  font-size: 12px;
  color: rgba(200, 220, 255, 0.6);
  letter-spacing: 1px;
}

.target-value {
  font-size: 18px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.stats-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.stat-box {
  flex: 1;
  background: rgba(0, 40, 60, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
}

.stat-label {
  font-size: 10px;
  color: rgba(200, 220, 255, 0.5);
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.stat-value.best {
  color: #ffcc00;
}

.stat-value.rank {
  color: #ff8866;
}

.stat-value.na {
  color: rgba(200, 200, 220, 0.4);
  font-size: 16px;
}

.stat-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin-top: 4px;
}

.stat-rank.rank-s {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #2a1800;
}

.stat-rank.rank-a {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #1a1a1a;
}

.stat-rank.rank-b {
  background: linear-gradient(135deg, #cd7f32, #a06028);
  color: #fff;
}

.stat-rank.rank-c {
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
}

.stat-rank.rank-d {
  background: linear-gradient(135deg, #666, #444);
  color: #ccc;
}

.player-name-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 10px 14px;
  background: rgba(0, 40, 60, 0.4);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 10px;
}

.name-label {
  font-size: 12px;
  color: rgba(200, 220, 255, 0.6);
  letter-spacing: 1px;
  flex-shrink: 0;
}

.name-input {
  flex: 1;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 255, 170, 0.25);
  border-radius: 6px;
  padding: 6px 10px;
  color: rgba(0, 255, 200, 0.95);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.name-input:focus {
  border-color: rgba(0, 255, 170, 0.5);
  background: rgba(0, 30, 50, 0.7);
}

.name-input::placeholder {
  color: rgba(200, 200, 220, 0.3);
}

.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 32px;
  font-size: 17px;
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

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(0, 255, 200, 0.6);
}

.btn-icon {
  font-size: 20px;
}

.leaderboard-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 24px;
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 204, 0, 0.95);
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.12), rgba(255, 136, 0, 0.12));
  border: 1px solid rgba(255, 204, 0, 0.45);
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.3s ease;
}

.leaderboard-btn:hover {
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 136, 0, 0.2));
  border-color: rgba(255, 204, 0, 0.6);
  transform: translateY(-1px);
}
</style>
