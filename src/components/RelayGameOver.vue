<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="result-header">
        <div class="result-badge" :class="result.victory ? 'victory' : 'defeat'">
          {{ result.victory ? '🎉 任务成功' : '💔 任务失败' }}
        </div>
        <div class="rank-display">
          <span class="rank-label">评级</span>
          <span class="rank-value" :class="'rank-' + result.rank">{{ result.rank }}</span>
        </div>
      </div>

      <div v-if="result.isNewRecord" class="new-record">
        <span class="record-icon">🏆</span>
        <span class="record-text">新纪录！</span>
      </div>

      <div class="score-section">
        <div class="final-score">
          <span class="score-label">最终得分</span>
          <span class="score-value">{{ result.finalScore.toLocaleString() }}</span>
        </div>
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-icon">⭐</span>
            <span class="stat-value">{{ result.totalDiscoveries }}</span>
            <span class="stat-label">发现目标</span>
          </div>
          <div class="stat-box">
            <span class="stat-icon">🗺️</span>
            <span class="stat-value">{{ result.totalLevels }}</span>
            <span class="stat-label">完成关卡</span>
          </div>
          <div class="stat-box">
            <span class="stat-icon">❤️</span>
            <span class="stat-value">{{ result.livesRemaining }}</span>
            <span class="stat-label">剩余生命</span>
          </div>
          <div class="stat-box">
            <span class="stat-icon">🔥</span>
            <span class="stat-value">×{{ result.maxCombo }}</span>
            <span class="stat-label">最高连击</span>
          </div>
          <div class="stat-box">
            <span class="stat-icon">⏱</span>
            <span class="stat-value">{{ formatTime(result.totalPlayTime) }}</span>
            <span class="stat-label">总用时</span>
          </div>
        </div>
      </div>

      <div class="team-results">
        <div class="section-title">👥 团队贡献</div>
        <div class="player-results">
          <div
            v-for="(pr, idx) in sortedPlayerResults"
            :key="pr.playerId"
            class="player-result-card"
          >
            <div class="player-rank">{{ idx + 1 }}</div>
            <div class="player-avatar">{{ getPlayerAvatar(pr.playerId) }}</div>
            <div class="player-info">
              <div class="player-name">
                {{ getPlayerName(pr.playerId) }}
                <span class="player-role" :style="{ color: getRoleColor(pr.role) }">
                  {{ getRoleIcon(pr.role) }} {{ getRoleName(pr.role) }}
                </span>
              </div>
              <div class="player-mini-stats">
                <span>🔊{{ pr.sonarUsed }}</span>
                <span>⭐{{ pr.discoveries }}</span>
                <span>💔{{ pr.damageTaken }}</span>
              </div>
            </div>
            <div class="player-score">
              <div class="player-contribution">{{ pr.contribution }}%</div>
              <div class="player-total">{{ pr.totalScore.toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="phase-summary">
        <div class="section-title">📋 阶段回顾</div>
        <div class="phase-list">
          <div
            v-for="(phaseResult, idx) in result.phaseResults"
            :key="idx"
            class="phase-item"
            :class="{ completed: phaseResult.completed }"
          >
            <div class="phase-icon">{{ getPhaseIcon(phaseResult.phase) }}</div>
            <div class="phase-info">
              <div class="phase-name">
                {{ getPhaseName(phaseResult.phase) }}
                <span class="phase-player">{{ getPlayerName(phaseResult.playerId) }}</span>
              </div>
              <div class="phase-stats">
                <span v-if="phaseResult.scoreGained > 0" class="phase-score">+{{ phaseResult.scoreGained }}</span>
                <span class="phase-discoveries">⭐{{ phaseResult.discoveries }}</span>
                <span class="phase-duration">{{ Math.round(phaseResult.duration) }}s</span>
              </div>
            </div>
            <div class="phase-status">
              <span v-if="phaseResult.completed" class="status-success">✓</span>
              <span v-else class="status-fail">✗</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="restart-btn" @click="$emit('restart')">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">再来一局</span>
        </button>
        <button class="home-btn" @click="$emit('home')">
          <span class="btn-icon">🏠</span>
          <span class="btn-text">返回主页</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RelayResult, RelayRoleType, RelayPhaseType, RelayPlayer } from '../types/game';
import { RELAY_ROLES, RELAY_PHASES, RELAY_AVATARS, RELAY_PLAYER_NAMES } from '../config/relayConfig';

const props = defineProps<{
  result: RelayResult;
  players?: RelayPlayer[];
}>();

defineEmits<{
  (e: 'restart'): void;
  (e: 'home'): void;
}>();

const sortedPlayerResults = computed(() => {
  return [...props.result.playerResults].sort((a, b) => b.contribution - a.contribution);
});

const formatTime = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getPlayerName = (playerId: number): string => {
  if (props.players) {
    const player = props.players.find(p => p.id === playerId);
    if (player) return player.name;
  }
  return RELAY_PLAYER_NAMES[playerId] || `玩家${playerId + 1}`;
};

const getPlayerAvatar = (playerId: number): string => {
  if (props.players) {
    const player = props.players.find(p => p.id === playerId);
    if (player) return player.avatar;
  }
  return RELAY_AVATARS[playerId % RELAY_AVATARS.length];
};

const getRoleName = (role: RelayRoleType): string => {
  return RELAY_ROLES[role]?.name || '';
};

const getRoleIcon = (role: RelayRoleType): string => {
  return RELAY_ROLES[role]?.icon || '';
};

const getRoleColor = (role: RelayRoleType): string => {
  return RELAY_ROLES[role]?.color || '#00ffaa';
};

const getPhaseName = (phase: RelayPhaseType): string => {
  return RELAY_PHASES[phase]?.name || '';
};

const getPhaseIcon = (phase: RelayPhaseType): string => {
  return RELAY_PHASES[phase]?.icon || '';
};
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(10, 20, 40, 0.95) 0%, rgba(5, 10, 25, 0.98) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.overlay-content {
  text-align: center;
  padding: 20px;
  max-width: 380px;
  width: 100%;
  max-height: 100vh;
  overflow-y: auto;
}

.result-header {
  margin-bottom: 16px;
}

.result-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.result-badge.victory {
  background: linear-gradient(135deg, rgba(0, 255, 150, 0.2), rgba(0, 200, 255, 0.2));
  border: 1px solid rgba(0, 255, 170, 0.5);
  color: #00ffaa;
  animation: victory-glow 2s ease-in-out infinite;
}

.result-badge.defeat {
  background: linear-gradient(135deg, rgba(255, 80, 100, 0.2), rgba(200, 50, 80, 0.2));
  border: 1px solid rgba(255, 100, 120, 0.5);
  color: #ff6688;
}

@keyframes victory-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 150, 0.3); }
  50% { box-shadow: 0 0 40px rgba(0, 255, 150, 0.5); }
}

.rank-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.rank-label {
  font-size: 12px;
  color: rgba(200, 220, 255, 0.6);
  letter-spacing: 2px;
}

.rank-value {
  font-size: 36px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 20px currentColor;
}

.rank-S { color: #ffcc00; }
.rank-A { color: #ff8844; }
.rank-B { color: #00ddff; }
.rank-C { color: #88cc88; }
.rank-D { color: #888888; }

.new-record {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 136, 68, 0.2));
  border: 1px solid rgba(255, 204, 0, 0.6);
  border-radius: 20px;
  margin-bottom: 14px;
  animation: record-pulse 1.5s ease-in-out infinite;
}

@keyframes record-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.record-icon {
  font-size: 18px;
}

.record-text {
  font-size: 13px;
  font-weight: bold;
  color: #ffcc00;
  letter-spacing: 1px;
}

.score-section {
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
}

.final-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.score-label {
  font-size: 12px;
  color: rgba(255, 200, 100, 0.7);
  letter-spacing: 2px;
}

.score-value {
  font-size: 32px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 15px rgba(255, 204, 0, 0.5);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background: rgba(0, 30, 60, 0.4);
  border-radius: 8px;
}

.stat-icon {
  font-size: 16px;
}

.stat-value {
  font-size: 14px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.95);
  font-family: 'Courier New', monospace;
}

.stat-label {
  font-size: 9px;
  color: rgba(150, 200, 255, 0.6);
}

.team-results {
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
}

.section-title {
  font-size: 13px;
  font-weight: bold;
  color: rgba(150, 220, 255, 0.95);
  letter-spacing: 1px;
  margin-bottom: 10px;
  text-align: left;
}

.player-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-result-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(0, 30, 60, 0.4);
  border: 1px solid rgba(0, 200, 255, 0.15);
  border-radius: 10px;
}

.player-rank {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00aaff, #0066ff);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  border-radius: 50%;
  flex-shrink: 0;
}

.player-result-card:nth-child(1) .player-rank {
  background: linear-gradient(135deg, #ffcc00, #ff8800);
}

.player-result-card:nth-child(2) .player-rank {
  background: linear-gradient(135deg, #c0c0c0, #888888);
}

.player-result-card:nth-child(3) .player-rank {
  background: linear-gradient(135deg, #cc8844, #884422);
}

.player-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.player-name {
  font-size: 12px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.95);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.player-role {
  font-size: 9px;
  font-weight: bold;
  opacity: 0.9;
}

.player-mini-stats {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: rgba(150, 200, 255, 0.6);
  margin-top: 2px;
}

.player-score {
  text-align: right;
  flex-shrink: 0;
}

.player-contribution {
  font-size: 14px;
  font-weight: bold;
  color: #00ffcc;
}

.player-total {
  font-size: 11px;
  color: rgba(255, 200, 100, 0.9);
  font-family: 'Courier New', monospace;
}

.phase-summary {
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
}

.phase-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.phase-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(0, 30, 60, 0.3);
  border: 1px solid rgba(255, 100, 100, 0.15);
  border-radius: 8px;
}

.phase-item.completed {
  border-color: rgba(0, 255, 150, 0.25);
  background: rgba(0, 40, 60, 0.35);
}

.phase-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.phase-info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.phase-name {
  font-size: 11px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 6px;
}

.phase-player {
  font-size: 9px;
  color: rgba(150, 200, 255, 0.6);
  font-weight: normal;
}

.phase-stats {
  display: flex;
  gap: 8px;
  font-size: 9px;
  color: rgba(150, 200, 255, 0.6);
  margin-top: 2px;
}

.phase-score {
  color: #00ff88;
  font-weight: bold;
}

.phase-discoveries {
  color: #ffcc00;
}

.phase-duration {
  color: rgba(150, 200, 255, 0.7);
}

.phase-status {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: bold;
}

.status-success {
  color: #00ff88;
}

.status-fail {
  color: #ff6666;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.restart-btn,
.home-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.3s ease;
}

.restart-btn {
  background: linear-gradient(135deg, #00ddff 0%, #0088ff 100%);
  color: #001a2e;
  box-shadow: 0 4px 20px rgba(0, 180, 255, 0.4);
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(0, 180, 255, 0.6);
}

.home-btn {
  background: rgba(0, 40, 70, 0.6);
  color: rgba(200, 230, 255, 0.9);
  border: 1px solid rgba(0, 200, 255, 0.3) !important;
}

.home-btn:hover {
  background: rgba(0, 60, 100, 0.6);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 16px;
}
</style>
