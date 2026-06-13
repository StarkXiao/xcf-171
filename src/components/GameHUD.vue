<template>
  <div class="game-hud">
    <div class="hud-top">
      <div class="hud-panel">
        <div class="daily-tag" v-if="isDailyChallenge">
          <span class="daily-tag-icon">🎯</span>
          <span class="daily-tag-text">{{ dailyChallengeTitle || '每日挑战' }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">分数</span>
          <span class="hud-value score">{{ formatNumber(state.score) }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">关卡</span>
          <span class="hud-value level">{{ state.level }}</span>
        </div>
      </div>

      <div class="hud-panel">
        <div class="hud-item lives">
          <span class="hud-label">生命</span>
          <div class="hearts">
            <span v-for="i in Math.max(state.lives, 0)" :key="i" class="heart">❤</span>
            <span v-for="i in Math.max((minLivesForDisplay - state.lives), 0)" :key="'empty' + i" class="heart empty">♡</span>
          </div>
        </div>
      </div>
    </div>

    <div class="depth-panel" :class="{ warning: state.pressureWarning, critical: state.pressureIntegrity <= 15 }">
      <div class="depth-header">
        <span class="depth-icon">⬇</span>
        <span class="depth-zone-name">{{ depthZoneName }}</span>
        <span class="depth-value">{{ Math.round(state.depth) }}m</span>
      </div>
      <div class="pressure-bar">
        <div class="pressure-label">耐压</div>
        <div class="pressure-track">
          <div
            class="pressure-fill"
            :class="pressureBarClass"
            :style="{ width: pressurePercent + '%' }"
          ></div>
        </div>
        <span class="pressure-value" :class="pressureBarClass">{{ Math.round(state.pressureIntegrity) }}%</span>
      </div>
    </div>

    <div class="mission-panel" v-if="missions && missions.length > 0">
      <div class="mission-panel-header" @click="missionExpanded = !missionExpanded">
        <span class="mission-panel-icon">📋</span>
        <span class="mission-panel-title">任务委托</span>
        <span class="mission-panel-count">{{ completedMissionCount }}/{{ missions.length }}</span>
        <span class="mission-panel-toggle">{{ missionExpanded ? '▾' : '▸' }}</span>
      </div>
      <div class="mission-panel-body" v-if="missionExpanded">
        <div class="mission-section" v-if="mainMissions.length > 0">
          <div class="mission-section-label">主线</div>
          <div
            v-for="m in mainMissions"
            :key="m.id"
            class="mission-item"
            :class="{ completed: m.completed, failed: m.failed }"
          >
            <span class="mission-icon">{{ m.icon }}</span>
            <div class="mission-info">
              <span class="mission-title">{{ m.title }}</span>
              <div class="mission-progress-row">
                <div class="mission-progress-bar">
                  <div
                    class="mission-progress-fill"
                    :style="{ width: missionProgressPercent(m) + '%' }"
                  ></div>
                </div>
                <span class="mission-progress-text">{{ m.objective.currentValue }}/{{ m.objective.targetValue }}</span>
              </div>
            </div>
            <span v-if="m.completed" class="mission-check">✅</span>
            <span v-else-if="m.failed" class="mission-check">❌</span>
          </div>
        </div>
        <div class="mission-section" v-if="sideMissions.length > 0">
          <div class="mission-section-label side">支线</div>
          <div
            v-for="m in sideMissions"
            :key="m.id"
            class="mission-item"
            :class="{ completed: m.completed, failed: m.failed }"
          >
            <span class="mission-icon">{{ m.icon }}</span>
            <div class="mission-info">
              <span class="mission-title">{{ m.title }}</span>
              <div class="mission-progress-row">
                <div class="mission-progress-bar">
                  <div
                    class="mission-progress-fill side"
                    :style="{ width: missionProgressPercent(m) + '%' }"
                  ></div>
                </div>
                <span class="mission-progress-text">{{ m.objective.currentValue }}/{{ m.objective.targetValue }}</span>
              </div>
            </div>
            <span v-if="m.completed" class="mission-check">✅</span>
            <span v-else-if="m.failed" class="mission-check">❌</span>
          </div>
        </div>
      </div>
    </div>

    <div class="event-notifications" v-if="activeNotifications.length > 0">
      <div
        v-for="notification in activeNotifications"
        :key="notification.id"
        class="event-notification"
        :class="notification.type"
      >
        <span class="event-icon">{{ notification.icon }}</span>
        <div class="event-info">
          <div class="event-title">{{ notification.title }}</div>
          <div class="event-desc">{{ notification.description }}</div>
        </div>
      </div>
    </div>

    <div class="mission-completion-notification" v-if="missionNotifications.length > 0">
      <div
        v-for="mn in missionNotifications"
        :key="mn.id"
        class="mission-notif-item"
        :class="{ completed: mn.completed }"
      >
        <span class="mission-notif-icon">{{ mn.icon }}</span>
        <div class="mission-notif-info">
          <div class="mission-notif-title">{{ mn.completed ? '任务完成！' : '任务失败' }}</div>
          <div class="mission-notif-desc">{{ mn.title }} {{ mn.completed ? `+${mn.bonus}` : '' }}</div>
        </div>
      </div>
    </div>

    <div class="active-events" v-if="activeEvents && activeEvents.length > 0">
      <div class="active-events-label">海域事件</div>
      <div class="active-events-list">
        <div
          v-for="event in activeEvents"
          :key="event.id"
          class="active-event-item"
          :class="event.type"
        >
          <span class="active-event-icon">{{ event.icon }}</span>
          <div class="active-event-info">
            <span class="active-event-name">{{ event.name }}</span>
            <div class="active-event-timer">
              <div
                class="timer-fill"
                :style="{ width: (event.remainingTime / event.duration * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="combo-display" v-if="state.combo > 0 || state.sonarCombo > 0">
      <div class="combo-item collect-combo" v-if="state.combo >= 2">
        <div class="combo-count">{{ state.combo }} 连击!</div>
        <div class="combo-multiplier">×{{ state.comboMultiplier.toFixed(1) }}</div>
      </div>
      <div class="combo-item sonar-combo" v-if="state.sonarCombo >= 2">
        <div class="combo-count">{{ state.sonarCombo }} 连探!</div>
        <div class="combo-multiplier">×{{ sonarMultiplier.toFixed(1) }}</div>
      </div>
    </div>

    <div class="hud-bottom">
      <div class="sonar-bar">
        <div class="sonar-label">声呐能量</div>
        <div class="sonar-charges">
          <div
            v-for="i in state.maxSonarCharges"
            :key="i"
            class="sonar-charge"
            :class="{ active: i <= state.sonarCharges }"
          >
            <div class="charge-inner"></div>
          </div>
        </div>
      </div>

      <div class="progress">
        <div class="progress-label">
          已发现 {{ state.discoveredTargets }} / {{ state.totalTargets }}
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <div class="hint" v-if="showHint">
      <span>🖱 点击地图释放声呐 · 点击回波收集目标</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { GameState, OceanEvent, Mission, DepthZoneId } from '../types/game';
import { getEventColor } from '../config/oceanEvents';
import { DEPTH_ZONES } from '../game/ScoreSystem';

const props = defineProps<{
  state: GameState;
  showHint: boolean;
  isDailyChallenge?: boolean;
  dailyChallengeTitle?: string;
  activeEvents?: OceanEvent[];
  missions?: Mission[];
}>();

interface EventNotification {
  id: number;
  type: string;
  icon: string;
  title: string;
  description: string;
  timestamp: number;
}

interface MissionNotification {
  id: number;
  title: string;
  icon: string;
  completed: boolean;
  bonus: number;
}

const activeNotifications = ref<EventNotification[]>([]);
const missionNotifications = ref<MissionNotification[]>([]);
const missionExpanded = ref(true);
let notificationId = 0;
let missionNotifId = 0;

const addNotification = (event: OceanEvent, isSpawn: boolean) => {
  const notification: EventNotification = {
    id: notificationId++,
    type: event.type,
    icon: event.icon,
    title: isSpawn ? `${event.name} 出现！` : `${event.name} 消散了`,
    description: isSpawn ? event.description : '海域恢复平静',
    timestamp: Date.now(),
  };
  activeNotifications.value.push(notification);
  
  setTimeout(() => {
    activeNotifications.value = activeNotifications.value.filter(n => n.id !== notification.id);
  }, 3000);
};

const addMissionNotification = (mission: Mission) => {
  const mn: MissionNotification = {
    id: missionNotifId++,
    title: mission.title,
    icon: mission.icon,
    completed: mission.completed,
    bonus: mission.completionBonus,
  };
  missionNotifications.value.push(mn);

  setTimeout(() => {
    missionNotifications.value = missionNotifications.value.filter(n => n.id !== mn.id);
  }, 4000);
};

const previousEventIds = ref<Set<number>>(new Set());

watch(
  () => props.activeEvents || [],
  (newEvents) => {
    const newIds = new Set(newEvents.map(e => e.id));
    
    for (const event of newEvents) {
      if (!previousEventIds.value.has(event.id)) {
        addNotification(event, true);
      }
    }
    
    previousEventIds.value = newIds;
  },
  { deep: true, immediate: true }
);

const previousCompletedIds = ref<Set<string>>(new Set());

watch(
  () => props.missions || [],
  (newMissions) => {
    for (const m of newMissions) {
      if ((m.completed || m.failed) && !previousCompletedIds.value.has(m.id)) {
        addMissionNotification(m);
      }
    }
    previousCompletedIds.value = new Set(newMissions.filter(m => m.completed || m.failed).map(m => m.id));
  },
  { deep: true, immediate: true }
);

const mainMissions = computed(() => (props.missions || []).filter(m => m.category === 'main'));
const sideMissions = computed(() => (props.missions || []).filter(m => m.category === 'side'));
const completedMissionCount = computed(() => (props.missions || []).filter(m => m.completed).length);

const missionProgressPercent = (m: Mission) => {
  if (m.objective.targetValue === 0) return 0;
  return Math.min(100, Math.round((m.objective.currentValue / m.objective.targetValue) * 100));
};

const progressPercent = computed(() => {
  if (props.state.totalTargets === 0) return 0;
  return (props.state.discoveredTargets / props.state.totalTargets) * 100;
});

const sonarMultiplier = computed(() => {
  const combo = props.state.sonarCombo;
  let multiplier = 1.0;
  const multipliers = [
    { combo: 2, multiplier: 1.1 },
    { combo: 4, multiplier: 1.2 },
    { combo: 6, multiplier: 1.3 },
    { combo: 8, multiplier: 1.5 },
  ];
  for (const m of multipliers) {
    if (combo >= m.combo) {
      multiplier = m.multiplier;
    }
  }
  return multiplier;
});

const minLivesForDisplay = computed(() => {
  return Math.max(3, props.state.lives + (3 - props.state.lives > 0 ? 0 : 0));
});

const depthZoneName = computed(() => {
  const zone = DEPTH_ZONES.find(z => z.id === props.state.depthZone);
  return zone?.name ?? '浅层';
});

const pressurePercent = computed(() => {
  if (props.state.maxPressureIntegrity <= 0) return 0;
  return (props.state.pressureIntegrity / props.state.maxPressureIntegrity) * 100;
});

const pressureBarClass = computed(() => {
  const ratio = props.state.pressureIntegrity / props.state.maxPressureIntegrity;
  if (ratio <= 0.15) return 'critical';
  if (ratio <= 0.3) return 'warning';
  if (ratio <= 0.6) return 'caution';
  return 'safe';
});

const formatNumber = (n: number) => {
  return n.toLocaleString();
};

defineExpose({
  addNotification,
  addMissionNotification,
});
</script>

<style scoped>
.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.hud-top {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.hud-panel {
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.85), rgba(0, 20, 40, 0.9));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 20px rgba(0, 255, 170, 0.1);
}

.daily-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(255, 100, 50, 0.3), rgba(255, 50, 100, 0.3));
  border: 1px solid rgba(255, 150, 80, 0.5);
  border-radius: 14px;
  margin-bottom: 8px;
}

.daily-tag-icon {
  font-size: 14px;
}

.daily-tag-text {
  font-size: 11px;
  font-weight: bold;
  color: rgba(255, 200, 150, 0.95);
  letter-spacing: 1px;
}

.hud-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.hud-panel:nth-child(2) .hud-item {
  align-items: flex-end;
}

.hud-label {
  font-size: 11px;
  color: rgba(0, 255, 200, 0.7);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hud-value {
  font-size: 22px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.hud-value.score {
  color: #00ffcc;
  text-shadow: 0 0 10px rgba(0, 255, 200, 0.5);
}

.hud-value.level {
  color: #ffcc00;
  text-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
}

.hearts {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.heart {
  font-size: 18px;
  color: #ff4466;
  text-shadow: 0 0 8px rgba(255, 68, 102, 0.6);
}

.heart.empty {
  color: rgba(255, 68, 102, 0.25);
  text-shadow: none;
}

.hud-bottom {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.depth-panel {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.85), rgba(0, 20, 40, 0.9));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  padding: 8px 14px;
  backdrop-filter: blur(8px);
  min-width: 180px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.depth-panel.warning {
  border-color: rgba(255, 170, 0, 0.6);
  box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
}

.depth-panel.critical {
  border-color: rgba(255, 50, 50, 0.7);
  box-shadow: 0 0 25px rgba(255, 50, 50, 0.4);
  animation: pressure-pulse 1s ease-in-out infinite;
}

@keyframes pressure-pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(255, 50, 50, 0.3); }
  50% { box-shadow: 0 0 30px rgba(255, 50, 50, 0.6); }
}

.depth-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.depth-icon {
  font-size: 14px;
  color: rgba(0, 200, 255, 0.9);
}

.depth-zone-name {
  font-size: 11px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.8);
  letter-spacing: 1px;
}

.depth-value {
  font-size: 13px;
  font-weight: bold;
  color: #00ccff;
  font-family: 'Courier New', monospace;
  margin-left: auto;
}

.pressure-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pressure-label {
  font-size: 10px;
  color: rgba(0, 255, 200, 0.6);
  letter-spacing: 1px;
  flex-shrink: 0;
}

.pressure-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 50, 70, 0.6);
  border-radius: 4px;
  overflow: hidden;
}

.pressure-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background 0.3s ease;
}

.pressure-fill.safe {
  background: linear-gradient(90deg, #00ffaa, #00e5ff);
  box-shadow: 0 0 6px rgba(0, 255, 170, 0.4);
}

.pressure-fill.caution {
  background: linear-gradient(90deg, #ffcc00, #ffaa00);
  box-shadow: 0 0 6px rgba(255, 204, 0, 0.4);
}

.pressure-fill.warning {
  background: linear-gradient(90deg, #ff8800, #ff5500);
  box-shadow: 0 0 8px rgba(255, 136, 0, 0.5);
}

.pressure-fill.critical {
  background: linear-gradient(90deg, #ff3333, #ff0000);
  box-shadow: 0 0 10px rgba(255, 50, 50, 0.6);
  animation: pressure-bar-flash 0.5s ease-in-out infinite;
}

@keyframes pressure-bar-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.pressure-value {
  font-size: 11px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
  min-width: 32px;
  text-align: right;
}

.pressure-value.safe { color: #00ffaa; }
.pressure-value.caution { color: #ffcc00; }
.pressure-value.warning { color: #ff8800; }
.pressure-value.critical { color: #ff3333; }

.sonar-bar {
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.85), rgba(0, 20, 40, 0.9));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
}

.sonar-label {
  font-size: 11px;
  color: rgba(0, 255, 200, 0.7);
  letter-spacing: 1px;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.sonar-charges {
  display: flex;
  gap: 6px;
}

.sonar-charge {
  flex: 1;
  height: 14px;
  background: rgba(0, 50, 70, 0.6);
  border-radius: 4px;
  border: 1px solid rgba(0, 255, 170, 0.2);
  overflow: hidden;
  position: relative;
}

.sonar-charge.active .charge-inner {
  position: absolute;
  inset: 2px;
  background: linear-gradient(90deg, #00ffaa, #00e5ff);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(0, 255, 170, 0.5);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.progress {
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.85), rgba(0, 20, 40, 0.9));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  padding: 8px 14px;
  backdrop-filter: blur(8px);
}

.progress-label {
  font-size: 11px;
  color: rgba(0, 255, 200, 0.7);
  margin-bottom: 5px;
}

.progress-bar {
  height: 6px;
  background: rgba(0, 50, 70, 0.6);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffaa, #00e5ff);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(0, 255, 170, 0.4);
}

.hint {
  position: absolute;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 30, 50, 0.85);
  border: 1px solid rgba(0, 255, 170, 0.4);
  color: rgba(0, 255, 200, 0.9);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(6px);
  animation: hint-float 3s ease-in-out infinite;
}

@keyframes hint-float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-4px); }
}

.event-notifications {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 20;
}

.event-notification {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  animation: notification-slide-in 0.4s ease-out;
  min-width: 220px;
}

.event-notification.current {
  background: linear-gradient(135deg, rgba(0, 100, 180, 0.9), rgba(0, 60, 120, 0.95));
  border: 1px solid rgba(0, 170, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 170, 255, 0.3);
}

.event-notification.interference {
  background: linear-gradient(135deg, rgba(120, 50, 160, 0.9), rgba(80, 30, 120, 0.95));
  border: 1px solid rgba(170, 80, 255, 0.6);
  box-shadow: 0 0 20px rgba(170, 80, 255, 0.3);
}

.event-notification.treasure {
  background: linear-gradient(135deg, rgba(200, 160, 0, 0.9), rgba(150, 120, 0, 0.95));
  border: 1px solid rgba(255, 220, 0, 0.7);
  box-shadow: 0 0 25px rgba(255, 220, 0, 0.4);
}

.event-icon {
  font-size: 24px;
}

.event-info {
  flex: 1;
}

.event-title {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
}

.event-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
}

@keyframes notification-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.active-events {
  position: absolute;
  top: 80px;
  right: 12px;
  width: 160px;
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.85), rgba(0, 20, 40, 0.9));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  padding: 8px 10px;
  backdrop-filter: blur(8px);
}

.active-events-label {
  font-size: 10px;
  color: rgba(0, 255, 200, 0.7);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.active-events-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.active-event-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
}

.active-event-item.current {
  background: rgba(0, 170, 255, 0.15);
}

.active-event-item.interference {
  background: rgba(170, 80, 255, 0.15);
}

.active-event-item.treasure {
  background: rgba(255, 220, 0, 0.15);
}

.active-event-icon {
  font-size: 16px;
}

.active-event-info {
  flex: 1;
  min-width: 0;
}

.active-event-name {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.active-event-timer {
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  margin-top: 3px;
  overflow: hidden;
}

.active-event-item.current .timer-fill {
  height: 100%;
  background: #00aaff;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.active-event-item.interference .timer-fill {
  height: 100%;
  background: #aa50ff;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.active-event-item.treasure .timer-fill {
  height: 100%;
  background: #ffdd00;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.mission-panel {
  position: absolute;
  top: 80px;
  left: 12px;
  width: 200px;
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.88), rgba(0, 20, 40, 0.92));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.mission-panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 255, 170, 0.15);
}

.mission-panel-icon {
  font-size: 14px;
}

.mission-panel-title {
  flex: 1;
  font-size: 11px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.85);
  letter-spacing: 1px;
}

.mission-panel-count {
  font-size: 10px;
  color: rgba(0, 255, 200, 0.6);
  font-family: 'Courier New', monospace;
}

.mission-panel-toggle {
  font-size: 10px;
  color: rgba(0, 255, 200, 0.5);
}

.mission-panel-body {
  padding: 6px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mission-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mission-section-label {
  font-size: 9px;
  font-weight: bold;
  color: rgba(255, 200, 100, 0.8);
  letter-spacing: 1px;
  text-transform: uppercase;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(255, 200, 100, 0.15);
}

.mission-section-label.side {
  color: rgba(150, 200, 255, 0.8);
  border-bottom-color: rgba(150, 200, 255, 0.15);
}

.mission-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(0, 50, 70, 0.3);
  transition: all 0.2s ease;
}

.mission-item.completed {
  background: rgba(0, 150, 80, 0.2);
  opacity: 0.75;
}

.mission-item.failed {
  background: rgba(150, 30, 30, 0.2);
  opacity: 0.6;
}

.mission-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.mission-info {
  flex: 1;
  min-width: 0;
}

.mission-title {
  font-size: 10px;
  color: #fff;
  font-weight: 500;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mission-progress-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
}

.mission-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.mission-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffcc00, #ff8800);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.mission-progress-fill.side {
  background: linear-gradient(90deg, #66aaff, #4488ff);
}

.mission-progress-text {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.55);
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

.mission-check {
  font-size: 12px;
  flex-shrink: 0;
}

.mission-completion-notification {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 25;
  pointer-events: none;
}

.mission-notif-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-radius: 12px;
  backdrop-filter: blur(12px);
  animation: mission-notif-pop 0.5s ease-out;
  min-width: 200px;
  text-align: center;
}

.mission-notif-item.completed {
  background: linear-gradient(135deg, rgba(0, 180, 80, 0.92), rgba(0, 120, 60, 0.95));
  border: 1px solid rgba(0, 255, 130, 0.7);
  box-shadow: 0 0 30px rgba(0, 255, 130, 0.4);
}

.mission-notif-item:not(.completed) {
  background: linear-gradient(135deg, rgba(150, 40, 40, 0.9), rgba(100, 20, 20, 0.95));
  border: 1px solid rgba(255, 80, 80, 0.6);
  box-shadow: 0 0 20px rgba(255, 80, 80, 0.3);
}

.mission-notif-icon {
  font-size: 22px;
}

.mission-notif-info {
  text-align: left;
}

.mission-notif-title {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
}

.mission-notif-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

@keyframes mission-notif-pop {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.combo-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  z-index: 15;
}

.combo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  animation: combo-pop-in 0.4s ease-out;
}

.combo-item.collect-combo {
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.25), rgba(255, 136, 0, 0.25));
  border: 2px solid rgba(255, 204, 0, 0.6);
  box-shadow: 0 0 25px rgba(255, 204, 0, 0.4), inset 0 0 15px rgba(255, 204, 0, 0.15);
}

.combo-item.sonar-combo {
  background: linear-gradient(135deg, rgba(0, 170, 255, 0.25), rgba(0, 100, 200, 0.25));
  border: 2px solid rgba(0, 170, 255, 0.6);
  box-shadow: 0 0 25px rgba(0, 170, 255, 0.4), inset 0 0 15px rgba(0, 170, 255, 0.15);
}

.combo-count {
  font-size: 28px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 15px currentColor, 0 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 2px;
  animation: combo-pulse 0.6s ease-in-out infinite;
}

.collect-combo .combo-count {
  color: #ffcc00;
}

.sonar-combo .combo-count {
  color: #00aaff;
}

.combo-multiplier {
  font-size: 16px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin-top: 2px;
  text-shadow: 0 0 8px currentColor;
}

.collect-combo .combo-multiplier {
  color: rgba(255, 204, 0, 0.9);
}

.sonar-combo .combo-multiplier {
  color: rgba(0, 170, 255, 0.9);
}

@keyframes combo-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-5deg);
  }
  60% {
    transform: scale(1.1) rotate(2deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes combo-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}
</style>
