<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="header">
        <div class="back-btn" @click="$emit('close')">
          <span class="back-arrow">‹</span>
        </div>
        <div class="header-title-wrap">
          <div class="event-title">{{ config?.title ?? '限时打捞季' }}</div>
          <div class="event-subtitle">{{ config?.subtitle }}</div>
        </div>
        <div class="currency-wrap">
          <span class="currency-icon">💰</span>
          <span class="currency-value">{{ state.progress?.eventCurrency ?? 0 }}</span>
        </div>
      </div>

      <div class="countdown-bar" v-if="state.isActive">
        <div class="countdown-label">活动剩余时间</div>
        <div class="countdown-timer">{{ formatTime(state.timeRemaining) }}</div>
      </div>
      <div class="countdown-bar coming-soon" v-else-if="state.isComingSoon">
        <div class="countdown-label">活动即将开始</div>
        <div class="countdown-timer">{{ formatTime(state.timeUntilStart) }}</div>
      </div>
      <div class="countdown-bar ended" v-else>
        <div class="countdown-label">活动已结束</div>
        <div class="countdown-timer">感谢参与</div>
      </div>

      <div class="event-desc">{{ config?.description }}</div>

      <div class="tabs">
        <div
          class="tab"
          :class="{ active: activeTab === 'phases' }"
          @click="activeTab = 'phases'"
        >
          <span class="tab-icon">🎯</span>
          <span>阶段目标</span>
          <span class="tab-badge" v-if="unclaimedCount > 0">{{ unclaimedCount }}</span>
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'wrecks' }"
          @click="activeTab = 'wrecks'"
        >
          <span class="tab-icon">🏴‍☠️</span>
          <span>残骸池</span>
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'exchange' }"
          @click="activeTab = 'exchange'"
        >
          <span class="tab-icon">🎁</span>
          <span>兑换奖励</span>
        </div>
      </div>

      <div class="tab-content" v-if="activeTab === 'phases'">
        <div
          v-for="phase in config?.phaseGoals"
          :key="phase.id"
          class="phase-card"
          :class="{
            completed: system?.isPhaseCompleted(phase),
            claimed: system?.isPhaseClaimed(phase),
          }"
        >
          <div class="phase-header">
            <div class="phase-number">阶段 {{ phase.phase }}</div>
            <div class="phase-status">
              <span v-if="system?.isPhaseClaimed(phase)" class="status claimed">已领取</span>
              <span v-else-if="system?.isPhaseCompleted(phase)" class="status ready">可领取</span>
              <span v-else class="status active">进行中</span>
            </div>
          </div>
          <div class="phase-title">{{ phase.title }}</div>
          <div class="phase-desc">{{ phase.description }}</div>
          <div class="phase-progress-bar">
            <div
              class="phase-progress-fill"
              :style="{ width: Math.min(100, getPhasePercent(phase)) + '%' }"
            ></div>
          </div>
          <div class="phase-progress-text">
            {{ system?.getPhaseProgress(phase) ?? 0 }} / {{ phase.targetValue }}
          </div>
          <div class="phase-reward">
            <span class="reward-icon">🎁</span>
            <span class="reward-text">{{ phase.rewardName }}</span>
            <button
              v-if="system?.canClaimPhase(phase) && state.isActive"
              class="claim-btn"
              @click="handleClaim(phase.id)"
            >
              领取
            </button>
          </div>
        </div>
      </div>

      <div class="tab-content wreck-grid" v-else-if="activeTab === 'wrecks'">
        <div
          v-for="wreck in config?.eventWrecks"
          :key="wreck.id"
          class="wreck-card"
          :class="'rarity-' + wreck.rarity"
        >
          <div class="wreck-icon">{{ wreck.icon }}</div>
          <div class="wreck-name">{{ wreck.name }}</div>
          <div class="wreck-rarity" :style="{ color: getRarityColor(wreck.rarity) }">
            {{ getRarityLabel(wreck.rarity) }}
          </div>
          <div class="wreck-points">
            <span>基础分: {{ wreck.basePoints }}</span>
            <span class="event-bonus">活动+{{ wreck.eventBonus }}</span>
          </div>
          <div class="wreck-desc">{{ wreck.description }}</div>
        </div>
      </div>

      <div class="tab-content" v-else-if="activeTab === 'exchange'">
        <div
          v-for="item in config?.exchangeItems"
          :key="item.id"
          class="exchange-card"
        >
          <div class="exchange-icon">{{ item.icon }}</div>
          <div class="exchange-info">
            <div class="exchange-name">{{ item.name }}</div>
            <div class="exchange-desc">{{ item.description }}</div>
            <div class="exchange-stock">
              剩余: {{ system?.getExchangeStock(item) ?? 0 }} / {{ item.maxStock }}
            </div>
          </div>
          <div class="exchange-action">
            <div class="exchange-cost">
              <span class="cost-icon">💰</span>
              <span>{{ item.cost }}</span>
            </div>
            <button
              class="exchange-btn"
              :disabled="!canPurchase(item) || !state.isActive"
              @click="handleExchange(item.id)"
            >
              {{ getExchangeBtnText(item) }}
            </button>
          </div>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">{{ state.progress?.totalWrecksCollected ?? 0 }}</div>
          <div class="stat-label">已收集残骸</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ state.progress?.rareWrecksCollected ?? 0 }}</div>
          <div class="stat-label">稀有残骸</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ state.progress?.expeditionsCompleted ?? 0 }}</div>
          <div class="stat-label">完成远征</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ state.progress?.totalEventCurrency ?? 0 }}</div>
          <div class="stat-label">累计积分</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type {
  SalvageEventConfig,
  SalvageEventState,
  SalvagePhaseGoal,
  SalvageExchangeItem,
  SalvageEventWreck,
} from '../types/game';
import { SalvageEventSystem } from '../game/SalvageEventSystem';
import { getRarityLabel, getRarityColor } from '../config/salvageEvent';

const props = defineProps<{
  system: SalvageEventSystem | null;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const activeTab = ref<'phases' | 'wrecks' | 'exchange'>('phases');
const state = ref<SalvageEventState>({
  isActive: false,
  isComingSoon: false,
  isEnded: false,
  timeRemaining: 0,
  timeUntilStart: 0,
  config: null,
  progress: null,
});

let updateInterval: number | null = null;

const config = computed<SalvageEventConfig | null>(() => state.value.config);

const unclaimedCount = computed(() => {
  if (!state.value.config || !props.system) return 0;
  return state.value.config.phaseGoals.filter(p => props.system?.canClaimPhase(p)).length;
});

const refreshState = () => {
  if (props.system) {
    state.value = props.system.getState();
  }
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getPhasePercent = (phase: SalvagePhaseGoal): number => {
  const current = props.system?.getPhaseProgress(phase) ?? 0;
  return (current / phase.targetValue) * 100;
};

const canPurchase = (item: SalvageExchangeItem): boolean => {
  return props.system?.canPurchaseExchange(item).canPurchase ?? false;
};

const getExchangeBtnText = (item: SalvageExchangeItem): string => {
  const check = props.system?.canPurchaseExchange(item);
  if (!state.value.isActive) return '活动结束';
  if (check?.reason && !check.canPurchase) return check.reason;
  return '兑换';
};

const handleClaim = (phaseId: string) => {
  props.system?.claimPhaseReward(phaseId);
  refreshState();
};

const handleExchange = (itemId: string) => {
  props.system?.purchaseExchange(itemId);
  refreshState();
};

onMounted(() => {
  refreshState();
  updateInterval = window.setInterval(refreshState, 1000);
});

onUnmounted(() => {
  if (updateInterval !== null) {
    clearInterval(updateInterval);
  }
});
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(0, 20, 40, 0.97) 0%, rgba(0, 5, 15, 0.99) 100%);
  z-index: 200;
  overflow-y: auto;
}

.overlay-content {
  max-width: 420px;
  margin: 0 auto;
  padding: 20px 16px 30px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 60, 100, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(0, 100, 150, 0.6);
  border-color: rgba(0, 255, 170, 0.5);
}

.back-arrow {
  font-size: 24px;
  color: #00ffcc;
  font-weight: bold;
  line-height: 1;
}

.header-title-wrap {
  flex: 1;
  min-width: 0;
}

.event-title {
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(135deg, #ffcc00 0%, #ff9944 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
}

.event-subtitle {
  font-size: 10px;
  color: rgba(255, 200, 100, 0.5);
  letter-spacing: 3px;
  text-transform: uppercase;
}

.currency-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(255, 150, 50, 0.15), rgba(255, 100, 30, 0.15));
  border: 1px solid rgba(255, 150, 50, 0.3);
  border-radius: 20px;
  flex-shrink: 0;
}

.currency-icon {
  font-size: 16px;
}

.currency-value {
  font-size: 14px;
  font-weight: bold;
  color: #ffcc66;
  font-family: 'Courier New', monospace;
}

.countdown-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 100, 50, 0.15), rgba(255, 50, 30, 0.1));
  border: 1px solid rgba(255, 150, 50, 0.4);
  border-radius: 12px;
  margin-bottom: 12px;
}

.countdown-bar.coming-soon {
  background: linear-gradient(135deg, rgba(100, 150, 255, 0.15), rgba(50, 100, 255, 0.1));
  border-color: rgba(100, 150, 255, 0.4);
}

.countdown-bar.ended {
  background: linear-gradient(135deg, rgba(100, 100, 100, 0.15), rgba(50, 50, 50, 0.1));
  border-color: rgba(100, 100, 100, 0.4);
}

.countdown-label {
  font-size: 12px;
  color: rgba(255, 220, 180, 0.8);
  letter-spacing: 1px;
}

.countdown-bar.coming-soon .countdown-label {
  color: rgba(180, 200, 255, 0.8);
}

.countdown-bar.ended .countdown-label {
  color: rgba(180, 180, 180, 0.8);
}

.countdown-timer {
  font-size: 16px;
  font-weight: bold;
  color: #ffcc66;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.countdown-bar.coming-soon .countdown-timer {
  color: #99bbff;
}

.countdown-bar.ended .countdown-timer {
  color: #aaaaaa;
}

.event-desc {
  font-size: 12px;
  color: rgba(200, 220, 255, 0.65);
  line-height: 1.6;
  padding: 12px 14px;
  background: rgba(0, 40, 60, 0.4);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 10px;
  margin-bottom: 14px;
}

.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 6px;
  background: rgba(0, 40, 60, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
  color: rgba(200, 220, 255, 0.7);
  transition: all 0.2s;
  position: relative;
}

.tab:hover {
  background: rgba(0, 60, 90, 0.5);
  border-color: rgba(0, 255, 170, 0.35);
}

.tab.active {
  background: linear-gradient(135deg, rgba(0, 120, 180, 0.5), rgba(0, 80, 140, 0.5));
  border-color: rgba(0, 255, 170, 0.6);
  color: #00ffcc;
  font-weight: bold;
}

.tab-icon {
  font-size: 14px;
}

.tab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #ff4455;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 6px rgba(255, 68, 85, 0.6);
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.tab-content.wreck-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.phase-card {
  padding: 14px;
  background: linear-gradient(135deg, rgba(0, 50, 80, 0.5), rgba(0, 30, 60, 0.6));
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 12px;
  transition: all 0.25s;
}

.phase-card.completed {
  border-color: rgba(255, 200, 80, 0.4);
  background: linear-gradient(135deg, rgba(60, 50, 20, 0.5), rgba(40, 30, 10, 0.6));
}

.phase-card.claimed {
  border-color: rgba(100, 200, 100, 0.3);
  background: linear-gradient(135deg, rgba(20, 50, 30, 0.4), rgba(10, 30, 20, 0.5));
  opacity: 0.75;
}

.phase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.phase-number {
  font-size: 11px;
  color: rgba(0, 255, 200, 0.6);
  letter-spacing: 2px;
  font-weight: bold;
}

.phase-status .status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: bold;
  letter-spacing: 1px;
}

.phase-status .status.active {
  background: rgba(0, 150, 200, 0.2);
  color: #66ccff;
  border: 1px solid rgba(100, 200, 255, 0.3);
}

.phase-status .status.ready {
  background: rgba(255, 180, 50, 0.2);
  color: #ffcc66;
  border: 1px solid rgba(255, 200, 100, 0.4);
  animation: ready-pulse 1.5s ease-in-out infinite;
}

@keyframes ready-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 200, 100, 0); }
  50% { box-shadow: 0 0 8px rgba(255, 200, 100, 0.4); }
}

.phase-status .status.claimed {
  background: rgba(100, 200, 100, 0.2);
  color: #88dd88;
  border: 1px solid rgba(100, 200, 100, 0.3);
}

.phase-title {
  font-size: 15px;
  font-weight: bold;
  color: rgba(220, 240, 255, 0.95);
  margin-bottom: 2px;
}

.phase-desc {
  font-size: 12px;
  color: rgba(180, 200, 230, 0.6);
  margin-bottom: 10px;
}

.phase-progress-bar {
  height: 6px;
  background: rgba(0, 50, 70, 0.8);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.phase-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffaa, #00e5ff);
  border-radius: 3px;
  transition: width 0.4s ease;
  box-shadow: 0 0 6px rgba(0, 255, 170, 0.4);
}

.phase-card.completed .phase-progress-fill {
  background: linear-gradient(90deg, #ffcc00, #ff9944);
  box-shadow: 0 0 6px rgba(255, 200, 80, 0.4);
}

.phase-card.claimed .phase-progress-fill {
  background: linear-gradient(90deg, #66dd66, #44bb44);
}

.phase-progress-text {
  font-size: 11px;
  color: rgba(150, 180, 220, 0.7);
  font-family: 'Courier New', monospace;
  text-align: right;
  margin-bottom: 10px;
}

.phase-reward {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.reward-icon {
  font-size: 16px;
}

.reward-text {
  flex: 1;
  font-size: 12px;
  color: rgba(255, 220, 150, 0.9);
}

.claim-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #ff9944, #ff6633);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(255, 100, 50, 0.4);
}

.claim-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 100, 50, 0.5);
}

.wreck-card {
  padding: 12px 10px;
  background: linear-gradient(135deg, rgba(30, 40, 60, 0.6), rgba(15, 20, 35, 0.7));
  border: 1px solid rgba(150, 160, 180, 0.25);
  border-radius: 10px;
  text-align: center;
  transition: all 0.2s;
}

.wreck-card.rarity-rare {
  border-color: rgba(60, 130, 246, 0.4);
  background: linear-gradient(135deg, rgba(30, 50, 90, 0.5), rgba(15, 30, 60, 0.6));
}

.wreck-card.rarity-epic {
  border-color: rgba(168, 85, 247, 0.45);
  background: linear-gradient(135deg, rgba(60, 30, 90, 0.5), rgba(35, 15, 60, 0.6));
}

.wreck-card.rarity-legendary {
  border-color: rgba(245, 158, 11, 0.5);
  background: linear-gradient(135deg, rgba(80, 50, 20, 0.5), rgba(50, 30, 10, 0.6));
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.15);
}

.wreck-icon {
  font-size: 32px;
  margin-bottom: 6px;
}

.wreck-name {
  font-size: 13px;
  font-weight: bold;
  color: rgba(230, 240, 255, 0.95);
  margin-bottom: 2px;
}

.wreck-rarity {
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.wreck-points {
  font-size: 10px;
  color: rgba(180, 200, 230, 0.6);
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}

.event-bonus {
  color: rgba(255, 180, 80, 0.9);
  font-weight: bold;
}

.wreck-desc {
  font-size: 10px;
  color: rgba(150, 170, 200, 0.5);
  line-height: 1.4;
}

.exchange-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(40, 30, 60, 0.5), rgba(20, 15, 40, 0.6));
  border: 1px solid rgba(200, 150, 255, 0.2);
  border-radius: 12px;
}

.exchange-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.exchange-info {
  flex: 1;
  min-width: 0;
}

.exchange-name {
  font-size: 13px;
  font-weight: bold;
  color: rgba(230, 210, 255, 0.95);
  margin-bottom: 2px;
}

.exchange-desc {
  font-size: 11px;
  color: rgba(180, 160, 220, 0.6);
  margin-bottom: 2px;
}

.exchange-stock {
  font-size: 10px;
  color: rgba(150, 130, 200, 0.6);
  font-family: 'Courier New', monospace;
}

.exchange-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.exchange-cost {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: bold;
  color: #ffcc66;
}

.cost-icon {
  font-size: 14px;
}

.exchange-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #9966ff, #7744dd);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(150, 100, 255, 0.35);
  white-space: nowrap;
}

.exchange-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(150, 100, 255, 0.5);
}

.exchange-btn:disabled {
  background: linear-gradient(135deg, #555, #444);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;
  background: rgba(0, 30, 50, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.stat-label {
  font-size: 10px;
  color: rgba(150, 180, 210, 0.6);
  margin-top: 2px;
  letter-spacing: 0.5px;
}
</style>
