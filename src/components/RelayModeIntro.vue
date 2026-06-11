<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="title-container">
        <div class="mode-badge">👥 多人模式</div>
        <h1 class="game-title">多人接力探索</h1>
        <div class="subtitle">Multiplayer Relay Expedition</div>
      </div>

      <div class="team-animation">
        <div class="team-icon">🐙</div>
        <div class="team-icon">🦈</div>
        <div class="team-icon">🐠</div>
        <div class="connect-line line-1"></div>
        <div class="connect-line line-2"></div>
      </div>

      <div class="mission-brief">
        <div class="brief-header">
          <span class="brief-icon">📋</span>
          <span>任务简报</span>
        </div>
        <div class="brief-text">
          同设备多人轮流操作，分工协作完成深海探索。共享生命值和声呐资源，共同挑战5个深度关卡！
        </div>
      </div>

      <div class="role-cards">
        <div
          v-for="role in roles"
          :key="role.id"
          class="role-card"
          :class="{ active: selectedRole === role.id }"
          @click="selectRole(role.id)"
        >
          <div class="role-icon" :style="{ color: role.color }">{{ role.icon }}</div>
          <div class="role-name">{{ role.name }}</div>
          <div class="role-ability">{{ role.ability }}</div>
        </div>
      </div>

      <div class="phase-intro">
        <div class="phase-title">🎯 三阶段接力</div>
        <div class="phase-flow">
          <div
            v-for="(phase, idx) in phases"
            :key="phase.id"
            class="phase-item"
          >
            <div class="phase-icon">{{ phase.icon }}</div>
            <div class="phase-info">
              <div class="phase-name">{{ phase.name }}</div>
              <div class="phase-goal">{{ phase.targetGoal }}</div>
            </div>
            <div v-if="idx < phases.length - 1" class="phase-arrow">→</div>
          </div>
        </div>
      </div>

      <div class="player-setup">
        <div class="setup-title">👥 设置玩家 ({{ playerCount }}人)</div>
        <div class="player-count-selector">
          <button
            v-for="n in [2, 3]"
            :key="n"
            class="count-btn"
            :class="{ active: playerCount === n }"
            @click="playerCount = n; updatePlayerNames()"
          >
            {{ n }}人
          </button>
        </div>
        <div class="player-list">
          <div
            v-for="(player, idx) in playerNames"
            :key="idx"
            class="player-item"
          >
            <span class="player-avatar">{{ avatars[idx] }}</span>
            <input
              v-model="playerNames[idx]"
              class="player-name-input"
              :placeholder="`玩家${idx + 1}`"
              maxlength="8"
            />
            <span class="player-role-tag" :style="{ color: RELAY_ROLES[assignedRoles[idx]].color }">
              {{ RELAY_ROLES[assignedRoles[idx]].icon }} {{ RELAY_ROLES[assignedRoles[idx]].name }}
            </span>
          </div>
        </div>
      </div>

      <div class="shared-info">
        <div class="shared-item">
          <span class="shared-icon">❤️</span>
          <span>共享生命 × {{ getTotalLives() }}</span>
        </div>
        <div class="shared-item">
          <span class="shared-icon">🔊</span>
          <span>共享声呐 × {{ getTotalSonar() }}</span>
        </div>
        <div class="shared-item">
          <span class="shared-icon">🏆</span>
          <span>最高分 {{ highScore.toLocaleString() }}</span>
        </div>
      </div>

      <button class="start-btn" @click="startGame">
        <span class="btn-text">🚀 开始接力探索</span>
        <span class="btn-glow"></span>
      </button>

      <button class="back-btn" @click="$emit('back')">
        ← 返回主页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { RELAY_ROLES, RELAY_PHASES, RELAY_AVATARS, RELAY_CONFIG } from '../config/relayConfig';
import type { RelayRoleType } from '../types/game';

defineProps<{
  highScore: number;
}>();

const emit = defineEmits<{
  (e: 'start', playerCount: number, playerNames: string[]): void;
  (e: 'back'): void;
}>();

const roles = Object.values(RELAY_ROLES);
const phases = Object.values(RELAY_PHASES);
const avatars = RELAY_AVATARS;

const playerCount = ref(2);
const playerNames = ref<string[]>(['玩家1', '玩家2']);
const selectedRole = ref<RelayRoleType>('sonar_operator');

const assignedRoles = computed((): RelayRoleType[] => {
  const roleOrder: RelayRoleType[] = ['sonar_operator', 'navigator', 'collector'];
  return roleOrder.slice(0, playerCount.value);
});

const updatePlayerNames = () => {
  const newNames: string[] = [];
  for (let i = 0; i < playerCount.value; i++) {
    newNames.push(playerNames.value[i] || `玩家${i + 1}`);
  }
  playerNames.value = newNames;
};

const selectRole = (roleId: RelayRoleType) => {
  selectedRole.value = roleId;
};

const getTotalLives = () => {
  let bonus = 0;
  for (let i = 0; i < playerCount.value; i++) {
    const role = RELAY_ROLES[assignedRoles.value[i]];
    if (role.stats.livesBonus) bonus += role.stats.livesBonus;
  }
  return RELAY_CONFIG.GAME.INITIAL_LIVES + bonus;
};

const getTotalSonar = () => {
  let bonus = 0;
  for (let i = 0; i < playerCount.value; i++) {
    const role = RELAY_ROLES[assignedRoles.value[i]];
    if (role.stats.sonarChargesBonus) bonus += role.stats.sonarChargesBonus;
  }
  return RELAY_CONFIG.GAME.INITIAL_SONAR_CHARGES + bonus;
};

const startGame = () => {
  emit('start', playerCount.value, [...playerNames.value]);
};
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(10, 30, 50, 0.95) 0%, rgba(5, 15, 30, 0.98) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.overlay-content {
  text-align: center;
  padding: 24px 20px;
  max-width: 380px;
  width: 100%;
  max-height: 100vh;
  overflow-y: auto;
}

.title-container {
  margin-bottom: 16px;
}

.mode-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  background: linear-gradient(135deg, rgba(0, 200, 255, 0.2), rgba(0, 150, 255, 0.2));
  border: 1px solid rgba(0, 200, 255, 0.5);
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  color: rgba(150, 230, 255, 0.95);
  letter-spacing: 2px;
  margin-bottom: 10px;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(0, 200, 255, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 200, 255, 0.5); }
}

.game-title {
  font-size: 26px;
  font-weight: bold;
  background: linear-gradient(135deg, #00ddff 0%, #00aaff 50%, #0088ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 3px;
  margin: 0;
  text-shadow: 0 0 40px rgba(0, 200, 255, 0.3);
}

.subtitle {
  font-size: 10px;
  color: rgba(100, 200, 255, 0.5);
  letter-spacing: 5px;
  margin-top: 6px;
  text-transform: uppercase;
}

.team-animation {
  position: relative;
  width: 180px;
  height: 80px;
  margin: 18px auto;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.team-icon {
  font-size: 36px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 10px rgba(0, 200, 255, 0.6));
  animation: team-bounce 2s ease-in-out infinite;
}

.team-icon:nth-child(2) { animation-delay: 0.3s; }
.team-icon:nth-child(3) { animation-delay: 0.6s; }

@keyframes team-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.connect-line {
  position: absolute;
  top: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.6), transparent);
  animation: line-pulse 1.5s ease-in-out infinite;
}

.line-1 { left: 15%; width: 30%; }
.line-2 { left: 55%; width: 30%; animation-delay: 0.5s; }

@keyframes line-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.mission-brief {
  background: linear-gradient(135deg, rgba(0, 100, 150, 0.1), rgba(0, 80, 180, 0.1));
  border: 1px solid rgba(0, 200, 255, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  text-align: left;
}

.brief-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: bold;
  color: rgba(150, 220, 255, 0.95);
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.brief-icon { font-size: 16px; }

.brief-text {
  font-size: 12px;
  color: rgba(200, 230, 255, 0.75);
  line-height: 1.5;
}

.role-cards {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.role-card {
  flex: 1;
  min-width: 90px;
  padding: 10px 6px;
  background: rgba(0, 40, 70, 0.4);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.role-card:hover {
  background: rgba(0, 60, 100, 0.5);
  border-color: rgba(0, 200, 255, 0.4);
  transform: translateY(-2px);
}

.role-card.active {
  background: linear-gradient(135deg, rgba(0, 150, 200, 0.25), rgba(0, 100, 200, 0.25));
  border-color: rgba(0, 200, 255, 0.6);
  box-shadow: 0 0 15px rgba(0, 200, 255, 0.2);
}

.role-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.role-name {
  font-size: 11px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.9);
  margin-bottom: 2px;
}

.role-ability {
  font-size: 9px;
  color: rgba(150, 200, 255, 0.65);
  line-height: 1.3;
}

.phase-intro {
  background: rgba(0, 30, 60, 0.4);
  border: 1px solid rgba(0, 200, 255, 0.18);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 14px;
}

.phase-title {
  font-size: 13px;
  font-weight: bold;
  color: rgba(150, 220, 255, 0.9);
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.phase-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.phase-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.phase-icon {
  font-size: 22px;
}

.phase-info {
  text-align: center;
}

.phase-name {
  font-size: 11px;
  font-weight: bold;
  color: rgba(200, 230, 255, 0.9);
}

.phase-goal {
  font-size: 9px;
  color: rgba(150, 200, 255, 0.6);
  line-height: 1.2;
}

.phase-arrow {
  font-size: 16px;
  color: rgba(0, 200, 255, 0.5);
  flex-shrink: 0;
  animation: arrow-blink 1s ease-in-out infinite;
}

@keyframes arrow-blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.player-setup {
  background: rgba(0, 40, 70, 0.4);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 14px;
}

.setup-title {
  font-size: 13px;
  font-weight: bold;
  color: rgba(150, 220, 255, 0.9);
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.player-count-selector {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 12px;
}

.count-btn {
  padding: 8px 24px;
  background: rgba(0, 30, 60, 0.6);
  border: 1px solid rgba(0, 200, 255, 0.25);
  border-radius: 8px;
  color: rgba(150, 200, 255, 0.8);
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.25s ease;
}

.count-btn:hover {
  background: rgba(0, 60, 100, 0.6);
  border-color: rgba(0, 200, 255, 0.5);
}

.count-btn.active {
  background: linear-gradient(135deg, rgba(0, 150, 200, 0.35), rgba(0, 100, 200, 0.35));
  border-color: rgba(0, 200, 255, 0.7);
  color: rgba(200, 230, 255, 0.95);
  box-shadow: 0 0 12px rgba(0, 200, 255, 0.25);
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(0, 20, 40, 0.5);
  border-radius: 8px;
}

.player-avatar {
  font-size: 20px;
  flex-shrink: 0;
}

.player-name-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(0, 200, 255, 0.3);
  color: rgba(200, 230, 255, 0.9);
  font-size: 13px;
  padding: 4px 0;
  outline: none;
  text-align: center;
  transition: border-color 0.2s;
}

.player-name-input:focus {
  border-color: rgba(0, 200, 255, 0.8);
}

.player-role-tag {
  font-size: 10px;
  font-weight: bold;
  flex-shrink: 0;
  opacity: 0.85;
}

.shared-info {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.shared-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(0, 40, 70, 0.4);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 8px;
  font-size: 11px;
  color: rgba(180, 220, 255, 0.8);
}

.shared-icon {
  font-size: 14px;
}

.start-btn {
  position: relative;
  width: 100%;
  padding: 16px 32px;
  font-size: 17px;
  font-weight: bold;
  color: #001a2e;
  background: linear-gradient(135deg, #00ddff 0%, #00aaff 50%, #0088ff 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 24px rgba(0, 180, 255, 0.5);
  margin-bottom: 10px;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 32px rgba(0, 180, 255, 0.7);
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

.back-btn {
  width: 100%;
  padding: 12px 24px;
  font-size: 13px;
  color: rgba(180, 220, 255, 0.75);
  background: transparent;
  border: 1px solid rgba(0, 200, 255, 0.25);
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.25s ease;
}

.back-btn:hover {
  background: rgba(0, 150, 200, 0.08);
  border-color: rgba(0, 200, 255, 0.45);
  color: rgba(220, 240, 255, 0.9);
}
</style>
