<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="header">
        <button class="back-btn" @click="$emit('back')">
          <span class="back-arrow">‹</span>
          <span>返回</span>
        </button>
        <div class="header-title">
          <span class="header-icon">🏆</span>
          <span>排行榜</span>
        </div>
        <div class="header-spacer"></div>
      </div>

      <div class="challenge-info">
        <div class="challenge-date">{{ formatDate(challenge.date) }}</div>
        <div class="challenge-title">{{ challenge.title }}</div>
      </div>

      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'leaderboard' }"
          @click="activeTab = 'leaderboard'"
        >
          <span>今日排行</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <span>我的历史</span>
        </button>
      </div>

      <div v-if="activeTab === 'leaderboard'" class="leaderboard-section">
        <div class="podium" v-if="leaderboard.length >= 3">
          <div class="podium-item second">
            <div class="podium-rank">🥈</div>
            <div class="podium-name">{{ truncateName(leaderboard[1].playerName) }}</div>
            <div class="podium-score">{{ formatNumber(leaderboard[1].score) }}</div>
            <div class="podium-bar" style="height: 70%;"></div>
          </div>
          <div class="podium-item first">
            <div class="podium-rank">🥇</div>
            <div class="podium-name">{{ truncateName(leaderboard[0].playerName) }}</div>
            <div class="podium-score">{{ formatNumber(leaderboard[0].score) }}</div>
            <div class="podium-bar" style="height: 100%;"></div>
          </div>
          <div class="podium-item third">
            <div class="podium-rank">🥉</div>
            <div class="podium-name">{{ truncateName(leaderboard[2].playerName) }}</div>
            <div class="podium-score">{{ formatNumber(leaderboard[2].score) }}</div>
            <div class="podium-bar" style="height: 55%;"></div>
          </div>
        </div>

        <div class="leaderboard-list">
          <div
            v-for="(entry, idx) in leaderboard.slice(podiumCutoff)"
            :key="entry.rank + '-' + idx"
            class="leaderboard-item"
            :class="{ 'is-player': entry.isCurrentPlayer }"
          >
            <div class="item-rank" :class="'rank-num-' + getRankTier(entry.rank)">
              {{ entry.rank }}
            </div>
            <div class="item-info">
              <div class="item-name" :class="{ 'is-player': entry.isCurrentPlayer }">
                {{ entry.playerName }}
                <span v-if="entry.isCurrentPlayer" class="player-tag">我</span>
              </div>
              <div class="item-meta">
                <span>Lv.{{ entry.level }}</span>
                <span>{{ formatTime(entry.completedAt) }}</span>
              </div>
            </div>
            <div class="item-score">{{ formatNumber(entry.score) }}</div>
          </div>
        </div>

        <div v-if="leaderboard.length === 0" class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-text">暂无排行数据</div>
          <div class="empty-hint">成为第一个挑战的人吧！</div>
        </div>
      </div>

      <div v-else class="history-section">
        <div v-if="history.length > 0" class="history-list">
          <div
            v-for="(record, idx) in history"
            :key="record.completedAt + '-' + idx"
            class="history-item"
          >
            <div class="history-date">{{ formatShortDate(record.date) }}</div>
            <div class="history-info">
              <div class="history-rank" :class="'rank-' + record.rank.toLowerCase()">
                {{ record.rank }}
              </div>
              <div class="history-stats">
                <div class="history-score">{{ formatNumber(record.score) }} 分</div>
                <div class="history-meta">
                  <span>Lv.{{ record.level }}</span>
                  <span>发现 {{ record.discovered }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">暂无历史记录</div>
          <div class="empty-hint">完成每日挑战后记录将显示在这里</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type {
  DailyChallengeConfig,
  DailyChallengeLeaderboardEntry,
  DailyChallengeRecord,
} from '../types/game';

defineProps<{
  challenge: DailyChallengeConfig;
  leaderboard: DailyChallengeLeaderboardEntry[];
  history: DailyChallengeRecord[];
}>();

defineEmits<{
  (e: 'back'): void;
}>();

const activeTab = ref<'leaderboard' | 'history'>('leaderboard');
const podiumCutoff = 3;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatNumber = (n: number) => n.toLocaleString();

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const truncateName = (name: string) => {
  if (name.length <= 6) return name;
  return name.slice(0, 6) + '..';
};

const getRankTier = (rank: number) => {
  if (rank <= 3) return 'top';
  if (rank <= 10) return 'high';
  return 'normal';
};
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top, rgba(30, 10, 0, 0.97) 0%, rgba(10, 5, 0, 0.98) 100%);
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
  margin-bottom: 14px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(100, 60, 0, 0.4);
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 8px;
  color: rgba(255, 204, 0, 0.9);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(150, 90, 0, 0.5);
  border-color: rgba(255, 204, 0, 0.5);
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
  color: rgba(255, 204, 0, 0.95);
  letter-spacing: 2px;
}

.header-icon {
  font-size: 22px;
}

.header-spacer {
  width: 60px;
}

.challenge-info {
  text-align: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(100, 60, 0, 0.4), rgba(80, 40, 0, 0.5));
  border: 1px solid rgba(255, 204, 0, 0.25);
  border-radius: 12px;
  margin-bottom: 14px;
}

.challenge-date {
  font-size: 11px;
  color: rgba(255, 200, 100, 0.6);
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.challenge-title {
  font-size: 20px;
  font-weight: bold;
  color: rgba(255, 204, 0, 0.95);
  letter-spacing: 3px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.tab-btn {
  flex: 1;
  padding: 10px 14px;
  background: rgba(60, 40, 0, 0.4);
  border: 1px solid rgba(255, 204, 0, 0.2);
  border-radius: 10px;
  color: rgba(255, 200, 100, 0.6);
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.25s;
}

.tab-btn:hover {
  background: rgba(100, 60, 0, 0.4);
  border-color: rgba(255, 204, 0, 0.35);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.25), rgba(255, 136, 0, 0.25));
  border-color: rgba(255, 204, 0, 0.55);
  color: rgba(255, 204, 0, 0.95);
  box-shadow: 0 0 15px rgba(255, 204, 0, 0.15);
}

.podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
  height: 170px;
  margin-bottom: 16px;
  padding: 0 10px;
}

.podium-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.podium-rank {
  font-size: 28px;
  margin-bottom: 6px;
}

.podium-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: bold;
  margin-bottom: 4px;
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.podium-score {
  font-size: 14px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
  margin-bottom: 6px;
}

.podium-bar {
  width: 100%;
  min-height: 40px;
  background: linear-gradient(180deg, rgba(255, 204, 0, 0.5), rgba(150, 100, 0, 0.7));
  border-radius: 8px 8px 0 0;
  border: 1px solid rgba(255, 204, 0, 0.4);
  border-bottom: none;
}

.podium-item.first .podium-bar {
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.7), rgba(200, 150, 0, 0.8));
  border-color: rgba(255, 215, 0, 0.6);
}

.podium-item.second .podium-bar {
  background: linear-gradient(180deg, rgba(192, 192, 192, 0.5), rgba(120, 120, 120, 0.7));
  border-color: rgba(192, 192, 192, 0.4);
}

.podium-item.third .podium-bar {
  background: linear-gradient(180deg, rgba(205, 127, 50, 0.5), rgba(130, 80, 30, 0.7));
  border-color: rgba(205, 127, 50, 0.4);
}

.podium-item.first {
  transform: translateY(-10px);
}

.podium-item.first .podium-rank {
  font-size: 34px;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(60, 40, 0, 0.35);
  border: 1px solid rgba(255, 204, 0, 0.15);
  border-radius: 10px;
  transition: all 0.2s;
}

.leaderboard-item.is-player {
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 136, 0, 0.15));
  border-color: rgba(255, 204, 0, 0.45);
}

.item-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.item-rank.rank-num-top {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #2a1800;
}

.item-rank.rank-num-high {
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
}

.item-rank.rank-num-normal {
  background: rgba(100, 80, 40, 0.6);
  color: rgba(255, 255, 255, 0.7);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-name.is-player {
  color: rgba(255, 204, 0, 0.95);
  font-weight: bold;
}

.player-tag {
  font-size: 9px;
  padding: 1px 5px;
  background: linear-gradient(135deg, #ffcc00, #ff8800);
  color: #2a1800;
  border-radius: 6px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.item-meta {
  font-size: 10px;
  color: rgba(200, 180, 120, 0.55);
  display: flex;
  gap: 10px;
}

.item-score {
  font-size: 16px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 15px;
  color: rgba(255, 200, 100, 0.7);
  margin-bottom: 6px;
}

.empty-hint {
  font-size: 12px;
  color: rgba(200, 180, 120, 0.45);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(60, 40, 0, 0.35);
  border: 1px solid rgba(255, 204, 0, 0.15);
  border-radius: 10px;
}

.history-date {
  font-size: 12px;
  color: rgba(200, 180, 120, 0.55);
  font-family: 'Courier New', monospace;
  width: 40px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.history-rank {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 16px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.history-rank.rank-s {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #2a1800;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
}

.history-rank.rank-a {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #1a1a1a;
}

.history-rank.rank-b {
  background: linear-gradient(135deg, #cd7f32, #a06028);
  color: #fff;
}

.history-rank.rank-c {
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
}

.history-rank.rank-d {
  background: linear-gradient(135deg, #666, #444);
  color: #ccc;
}

.history-stats {
  flex: 1;
  min-width: 0;
}

.history-score {
  font-size: 15px;
  font-weight: bold;
  color: rgba(255, 204, 0, 0.95);
  font-family: 'Courier New', monospace;
  margin-bottom: 2px;
}

.history-meta {
  font-size: 11px;
  color: rgba(200, 180, 120, 0.55);
  display: flex;
  gap: 10px;
}
</style>
