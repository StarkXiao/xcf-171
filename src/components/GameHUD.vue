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

    <div class="tutorial-panel" v-if="tutorialState && tutorialState.isTutorialMode && !tutorialState.tutorialComplete">
      <div class="tutorial-header">
        <span class="tutorial-icon">📘</span>
        <span class="tutorial-title">新手引导</span>
        <span class="tutorial-step-badge">{{ tutorialState.currentStepIndex + 1 }}/{{ tutorialTotalSteps }}</span>
      </div>
      <div class="tutorial-step-info" v-if="currentStepConfig">
        <div class="tutorial-step-title">{{ currentStepConfig.title }}</div>
        <div class="tutorial-step-desc">{{ currentStepConfig.description }}</div>
        <div class="tutorial-action-hint" v-if="currentStepConfig.actionHint">
          <span class="hint-arrow">➜</span>
          {{ currentStepConfig.actionHint }}
        </div>
      </div>
      <div class="tutorial-progress-bar">
        <div class="tutorial-progress-fill" :style="{ width: tutorialProgressPercent + '%' }"></div>
      </div>
    </div>

    <div class="error-hint-panel" v-if="tutorialState && tutorialState.showErrorHint && tutorialState.errorHintMessage">
      <div class="error-hint-icon">⚠</div>
      <div class="error-hint-content">
        <div class="error-hint-title">操作提示</div>
        <div class="error-hint-message">{{ tutorialState.errorHintMessage }}</div>
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

    <div class="legendary-chain-panel" v-if="legendaryChainState && (legendaryChainState.currentChainLength > 0 || legendaryChainState.trackedTargetId !== null)">
      <div class="legendary-chain-header">
        <span class="legendary-chain-icon">⚜</span>
        <span class="legendary-chain-title">传说链路</span>
        <span class="legendary-chain-count">{{ legendaryChainState.currentChainLength }}/{{ legendaryChainProgress.required }}</span>
      </div>
      <div class="legendary-chain-progress">
        <div class="legendary-chain-progress-bar">
          <div
            class="legendary-chain-progress-fill"
            :style="{ width: legendaryChainProgressPercent + '%' }"
          ></div>
        </div>
        <span class="legendary-chain-milestone">{{ legendaryChainProgress.milestoneName }}</span>
      </div>
      <div class="legendary-timer" v-if="legendaryChainState.trackedTargetId !== null && legendaryChainState.trackedTimerRemaining > 0">
        <div class="legendary-timer-label">限时追踪</div>
        <div class="legendary-timer-bar">
          <div
            class="legendary-timer-fill"
            :class="{ warning: legendaryChainState.trackedTimerRemaining <= 5, critical: legendaryChainState.trackedTimerRemaining <= 3 }"
            :style="{ width: legendaryTimerPercent + '%' }"
          ></div>
        </div>
        <span class="legendary-timer-value" :class="{ warning: legendaryChainState.trackedTimerRemaining <= 5 }">{{ Math.ceil(legendaryChainState.trackedTimerRemaining) }}s</span>
      </div>
    </div>

    <div class="legendary-notifications" v-if="legendaryNotifications.length > 0">
      <div
        v-for="ln in legendaryNotifications"
        :key="ln.id"
        class="legendary-notif-item"
        :class="ln.type"
      >
        <span class="legendary-notif-icon">{{ ln.icon }}</span>
        <div class="legendary-notif-info">
          <div class="legendary-notif-title">{{ ln.title }}</div>
          <div class="legendary-notif-desc">{{ ln.description }}</div>
        </div>
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
import type { GameState, OceanEvent, Mission, DepthZoneId, LegendaryChainState, LegendaryChainEvent, TutorialState, TutorialStepConfig } from '../types/game';
import { TUTORIAL_STEPS } from '../config/gameConfig';
import { getEventColor } from '../config/oceanEvents';
import { DEPTH_ZONES } from '../game/ScoreSystem';

const props = defineProps<{
  state: GameState;
  showHint: boolean;
  isDailyChallenge?: boolean;
  dailyChallengeTitle?: string;
  activeEvents?: OceanEvent[];
  missions?: Mission[];
  legendaryChainState?: LegendaryChainState;
  tutorialState?: TutorialState | null;
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

interface LegendaryNotification {
  id: number;
  type: 'discovered' | 'collected' | 'chain_completed' | 'chain_broken' | 'tracking' | 'expired';
  icon: string;
  title: string;
  description: string;
}

const activeNotifications = ref<EventNotification[]>([]);
const missionNotifications = ref<MissionNotification[]>([]);
const legendaryNotifications = ref<LegendaryNotification[]>([]);
const missionExpanded = ref(true);
let notificationId = 0;
let missionNotifId = 0;
let legendaryNotifId = 0;

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

const addLegendaryNotification = (event: LegendaryChainEvent) => {
  let icon = '⚜';
  let title = '';
  let description = '';
  let type: LegendaryNotification['type'] = 'discovered';

  switch (event.type) {
    case 'legendary_discovered':
      icon = '✦';
      title = '传说目标发现！';
      description = event.targetName ?? '未知传说目标';
      type = 'discovered';
      break;
    case 'legendary_collected':
      icon = '⭐';
      title = '传说目标收集！';
      description = `${event.targetName ?? ''} — 链路 ${event.chainLength}`;
      type = 'collected';
      break;
    case 'chain_completed':
      icon = '🏆';
      title = event.reward?.achievementName ?? '链路完成！';
      description = event.reward?.achievementDescription ?? '';
      type = 'chain_completed';
      break;
    case 'chain_broken':
      icon = '💔';
      title = '传说链路中断';
      description = event.reason ?? '';
      type = 'chain_broken';
      break;
    case 'tracking_started':
      icon = '⏱';
      title = '限时追踪开始';
      description = event.targetName ?? '';
      type = 'tracking';
      break;
    case 'legendary_expired':
      icon = '⏰';
      title = '传说目标消失';
      description = '限时追踪超时';
      type = 'expired';
      break;
    case 'tracking_warning':
      icon = '⚠';
      title = '追踪即将超时！';
      description = `剩余 ${Math.ceil(event.timerRemaining ?? 0)} 秒`;
      type = 'tracking';
      break;
    case 'chain_started':
      icon = '⚜';
      title = '传说链路开启';
      description = '连续收集传说目标触发链路奖励';
      type = 'discovered';
      break;
    case 'chain_progress':
      return;
  }

  const ln: LegendaryNotification = {
    id: legendaryNotifId++,
    type,
    icon,
    title,
    description,
  };
  legendaryNotifications.value.push(ln);

  const duration = type === 'chain_completed' ? 6000 : 3500;
  setTimeout(() => {
    legendaryNotifications.value = legendaryNotifications.value.filter(n => n.id !== ln.id);
  }, duration);
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

const legendaryChainProgress = computed(() => {
  const state = props.legendaryChainState;
  if (!state) return { current: 0, required: 2, milestoneName: '' };

  const chainLengths = [
    { chainLength: 2, achievementName: '传说初现' },
    { chainLength: 3, achievementName: '深渊回响' },
    { chainLength: 5, achievementName: '传说猎手' },
    { chainLength: 8, achievementName: '神话追寻者' },
  ];

  let next = chainLengths[chainLengths.length - 1];
  for (const cl of chainLengths) {
    if (state.currentChainLength < cl.chainLength) {
      next = cl;
      break;
    }
  }

  return { current: state.currentChainLength, required: next.chainLength, milestoneName: next.achievementName };
});

const legendaryChainProgressPercent = computed(() => {
  const p = legendaryChainProgress.value;
  if (p.required === 0) return 0;
  return Math.min(100, (p.current / p.required) * 100);
});

const legendaryTimerPercent = computed(() => {
  const state = props.legendaryChainState;
  if (!state || state.trackedTimerMax <= 0) return 0;
  return Math.max(0, (state.trackedTimerRemaining / state.trackedTimerMax) * 100);
});

const tutorialSteps = computed<TutorialStepConfig[]>(() => {
  return TUTORIAL_STEPS;
});

const tutorialTotalSteps = computed(() => {
  return tutorialSteps.value.length;
});

const tutorialStepsConfig = computed<Record<string, TutorialStepConfig>>(() => {
  const config: Record<string, TutorialStepConfig> = {};
  for (const step of TUTORIAL_STEPS) {
    config[step.id] = step;
  }
  return config;
});

const currentStepConfig = computed<TutorialStepConfig | null>(() => {
  if (!props.tutorialState) return null;
  const stepId = props.tutorialState.currentStep;
  return tutorialStepsConfig.value[stepId] || null;
});

const tutorialProgressPercent = computed(() => {
  if (!props.tutorialState || tutorialTotalSteps.value === 0) return 0;
  return ((props.tutorialState.currentStepIndex + 1) / tutorialTotalSteps.value) * 100;
});

defineExpose({
  addNotification,
  addMissionNotification,
  addLegendaryNotification,
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

.legendary-chain-panel {
  position: absolute;
  top: 80px;
  left: 12px;
  width: 200px;
  background: linear-gradient(135deg, rgba(80, 40, 0, 0.9), rgba(50, 20, 0, 0.95));
  border: 1px solid rgba(255, 170, 0, 0.6);
  border-radius: 10px;
  padding: 8px 10px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
  animation: legendary-glow 2s ease-in-out infinite;
  top: auto;
  bottom: 160px;
  left: 12px;
}

@keyframes legendary-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(255, 170, 0, 0.2); }
  50% { box-shadow: 0 0 30px rgba(255, 170, 0, 0.5); }
}

.legendary-chain-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.legendary-chain-icon {
  font-size: 14px;
  color: #ffaa00;
  text-shadow: 0 0 8px rgba(255, 170, 0, 0.6);
}

.legendary-chain-title {
  flex: 1;
  font-size: 11px;
  font-weight: bold;
  color: rgba(255, 200, 100, 0.9);
  letter-spacing: 1px;
}

.legendary-chain-count {
  font-size: 10px;
  color: #ffcc44;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.legendary-chain-progress {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legendary-chain-progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(100, 50, 0, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.legendary-chain-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff8800, #ffcc00);
  border-radius: 3px;
  transition: width 0.4s ease;
  box-shadow: 0 0 8px rgba(255, 170, 0, 0.6);
}

.legendary-chain-milestone {
  font-size: 9px;
  color: rgba(255, 200, 100, 0.7);
  white-space: nowrap;
}

.legendary-timer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 170, 0, 0.2);
}

.legendary-timer-label {
  font-size: 9px;
  color: rgba(255, 200, 100, 0.7);
  white-space: nowrap;
}

.legendary-timer-bar {
  flex: 1;
  height: 5px;
  background: rgba(100, 50, 0, 0.5);
  border-radius: 3px;
  overflow: hidden;
}

.legendary-timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffaa, #00ccff);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 6px rgba(0, 255, 170, 0.4);
}

.legendary-timer-fill.warning {
  background: linear-gradient(90deg, #ffcc00, #ff8800);
  box-shadow: 0 0 8px rgba(255, 136, 0, 0.5);
}

.legendary-timer-fill.critical {
  background: linear-gradient(90deg, #ff3333, #ff0000);
  box-shadow: 0 0 10px rgba(255, 50, 50, 0.6);
  animation: timer-flash 0.5s ease-in-out infinite;
}

@keyframes timer-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.legendary-timer-value {
  font-size: 10px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #00ffaa;
  min-width: 22px;
  text-align: right;
}

.legendary-timer-value.warning {
  color: #ff8800;
}

.legendary-notifications {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 30;
  pointer-events: none;
}

.legendary-notif-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  backdrop-filter: blur(12px);
  animation: legendary-notif-pop 0.5s ease-out;
  min-width: 240px;
}

.legendary-notif-item.discovered {
  background: linear-gradient(135deg, rgba(255, 170, 0, 0.9), rgba(200, 120, 0, 0.95));
  border: 1px solid rgba(255, 220, 0, 0.7);
  box-shadow: 0 0 25px rgba(255, 170, 0, 0.5);
}

.legendary-notif-item.collected {
  background: linear-gradient(135deg, rgba(255, 200, 0, 0.92), rgba(220, 150, 0, 0.95));
  border: 1px solid rgba(255, 255, 100, 0.8);
  box-shadow: 0 0 30px rgba(255, 200, 0, 0.6);
}

.legendary-notif-item.chain_completed {
  background: linear-gradient(135deg, rgba(200, 100, 0, 0.95), rgba(160, 60, 0, 0.97));
  border: 2px solid rgba(255, 200, 50, 0.9);
  box-shadow: 0 0 40px rgba(255, 170, 0, 0.7), inset 0 0 20px rgba(255, 200, 0, 0.2);
}

.legendary-notif-item.chain_broken {
  background: linear-gradient(135deg, rgba(100, 30, 30, 0.9), rgba(60, 15, 15, 0.95));
  border: 1px solid rgba(255, 80, 80, 0.6);
  box-shadow: 0 0 20px rgba(255, 50, 50, 0.3);
}

.legendary-notif-item.tracking {
  background: linear-gradient(135deg, rgba(0, 80, 120, 0.9), rgba(0, 50, 80, 0.95));
  border: 1px solid rgba(0, 200, 255, 0.6);
  box-shadow: 0 0 20px rgba(0, 200, 255, 0.3);
}

.legendary-notif-item.expired {
  background: linear-gradient(135deg, rgba(80, 40, 0, 0.9), rgba(50, 20, 0, 0.95));
  border: 1px solid rgba(200, 100, 0, 0.5);
  box-shadow: 0 0 15px rgba(200, 100, 0, 0.3);
}

.legendary-notif-icon {
  font-size: 24px;
}

.legendary-notif-info {
  flex: 1;
}

.legendary-notif-title {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
  text-shadow: 0 0 8px rgba(255, 170, 0, 0.4);
}

.legendary-notif-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes legendary-notif-pop {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.tutorial-panel {
  position: absolute;
  top: 140px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(0, 50, 80, 0.92), rgba(0, 30, 60, 0.95));
  border: 1px solid rgba(100, 200, 255, 0.5);
  border-radius: 12px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 25px rgba(100, 200, 255, 0.25);
  min-width: 280px;
  max-width: 400px;
  z-index: 22;
  animation: tutorial-panel-in 0.5s ease-out;
}

@keyframes tutorial-panel-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-15px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.tutorial-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(100, 200, 255, 0.25);
}

.tutorial-icon {
  font-size: 18px;
}

.tutorial-title {
  flex: 1;
  font-size: 13px;
  font-weight: bold;
  color: rgba(100, 220, 255, 0.95);
  letter-spacing: 1px;
}

.tutorial-step-badge {
  font-size: 10px;
  font-weight: bold;
  color: rgba(100, 200, 255, 0.8);
  background: rgba(100, 200, 255, 0.12);
  padding: 2px 8px;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
}

.tutorial-step-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tutorial-step-title {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 8px rgba(100, 200, 255, 0.3);
}

.tutorial-step-desc {
  font-size: 12px;
  color: rgba(220, 240, 255, 0.85);
  line-height: 1.5;
}

.tutorial-action-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 6px 10px;
  background: rgba(0, 180, 255, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(0, 180, 255, 0.3);
}

.hint-arrow {
  color: #00ccff;
  font-weight: bold;
  animation: hint-arrow-bounce 1.5s ease-in-out infinite;
}

@keyframes hint-arrow-bounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

.tutorial-action-hint {
  font-size: 12px;
  color: rgba(180, 240, 255, 0.95);
  font-weight: 500;
}

.tutorial-progress-bar {
  margin-top: 10px;
  height: 4px;
  background: rgba(100, 200, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.tutorial-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00aaff, #66ddff);
  border-radius: 2px;
  transition: width 0.5s ease;
  box-shadow: 0 0 6px rgba(0, 170, 255, 0.5);
}

.error-hint-panel {
  position: absolute;
  top: 310px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(120, 60, 0, 0.92), rgba(80, 40, 0, 0.95));
  border: 1px solid rgba(255, 180, 80, 0.6);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 20px rgba(255, 150, 50, 0.3);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 260px;
  max-width: 380px;
  z-index: 23;
  animation: error-hint-in 0.35s ease-out;
}

@keyframes error-hint-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

.error-hint-icon {
  font-size: 20px;
  color: #ffaa44;
  flex-shrink: 0;
  text-shadow: 0 0 8px rgba(255, 170, 50, 0.6);
}

.error-hint-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.error-hint-title {
  font-size: 11px;
  font-weight: bold;
  color: rgba(255, 200, 120, 0.95);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.error-hint-message {
  font-size: 12px;
  color: rgba(255, 240, 220, 0.95);
  line-height: 1.4;
}
</style>
