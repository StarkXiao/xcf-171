<template>
  <div class="rescue-hud">
    <div class="hud-top">
      <div class="hud-panel left">
        <div class="rescue-tag">
          <span class="rescue-tag-icon">🚨</span>
          <span class="rescue-tag-text">救援任务 · Lv.{{ state.currentLevel }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">救援分数</span>
          <span class="hud-value score">{{ formatNumber(state.score) }}</span>
        </div>
      </div>

      <div class="hud-panel right">
        <div class="timer-container" :class="{ warning: isWarning, critical: isCritical }">
          <div class="timer-icon">⏱</div>
          <div class="timer-value">{{ formatTime(state.timeRemaining) }}</div>
        </div>
        <div class="false-reports-container">
          <div class="fr-label">误报</div>
          <div class="fr-hearts">
            <span
              v-for="i in state.maxFalseReports"
              :key="i"
              class="fr-heart"
              :class="{ lost: i <= state.falseReports }"
            >{{ i <= state.falseReports ? '✗' : '●' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="path-status" v-if="isFollowingPath">
      <div class="ps-header" :class="pathStatusClass">
        <span class="ps-icon">{{ pathStatusIcon }}</span>
        <span class="ps-title">{{ pathStatusText }}</span>
        <span class="ps-bonus" v-if="state.path.pathBonus > 0">+{{ state.path.pathBonus }}</span>
      </div>

      <div class="ps-progress">
        <div class="ps-progress-bar">
          <div
            class="ps-progress-fill"
            :style="{ width: state.path.pathCompletionRate * 100 + '%' }"
            :class="pathStatusClass"
          ></div>
        </div>
        <div class="ps-progress-text">
          <span>进度 {{ Math.round(state.path.pathCompletionRate * 100) }}%</span>
          <span class="ps-total-bonus">累计 +{{ state.path.totalPathBonus }}</span>
        </div>
      </div>

      <div class="ps-indicators" v-if="state.path.distanceFromPath > 0 || state.path.isInHighRiskZone || state.path.isInBlockerZone">
        <div class="ps-indicator deviation" v-if="state.path.distanceFromPath > 20">
          <span class="psi-icon">📏</span>
          <span class="psi-label">偏离</span>
          <span class="psi-value" :class="{ danger: isOfftrackDanger }">
            {{ Math.round(state.path.distanceFromPath) }}m
          </span>
        </div>
        <div class="ps-indicator yaw" v-if="state.path.yawWarnings > 0">
          <span class="psi-icon">⚠️</span>
          <span class="psi-label">偏航警告</span>
          <span class="psi-value danger">
            {{ state.path.yawWarnings }}/{{ state.path.maxYawWarnings }}
          </span>
        </div>
        <div class="ps-indicator high-risk" v-if="state.path.isInHighRiskZone">
          <span class="psi-icon">☢️</span>
          <span class="psi-label">高危区</span>
          <span class="psi-value danger">侵入中</span>
        </div>
        <div class="ps-indicator blocker" v-if="state.path.isInBlockerZone">
          <span class="psi-icon">🚧</span>
          <span class="psi-label">阻断区</span>
          <span class="psi-value danger">碰撞！</span>
        </div>
      </div>

      <div class="ps-safety">
        <span class="ps-safety-label">航线等级</span>
        <div class="ps-safety-levels">
          <span
            v-for="lvl in safetyLevels"
            :key="lvl.value"
            class="ps-safety-dot"
            :class="[lvl.value, { active: state.path.currentSafetyLevel === lvl.value }]"
            :title="lvl.label"
          ></span>
        </div>
        <span class="ps-safety-text" :class="state.path.currentSafetyLevel">
          {{ currentSafetyLabel }}
        </span>
      </div>
    </div>

    <div class="offtrack-alert" v-if="showOfftrackAlert">
      <div class="ota-icon">⚠️</div>
      <div class="ota-text">偏航警告！请返回安全航线</div>
      <div class="ota-remaining">剩余机会：{{ state.path.maxYawWarnings - state.path.yawWarnings }}</div>
    </div>

    <div class="high-risk-alert" v-if="showHighRiskAlert">
      <div class="hra-icon">☢️</div>
      <div class="hra-text">进入高危干扰区！信号严重衰减</div>
    </div>

    <div class="blocker-alert" v-if="showBlockerAlert">
      <div class="ba-icon">🚧</div>
      <div class="ba-text">阻断区碰撞！船体受损</div>
    </div>

    <div class="rescue-progress">
      <div class="rp-header">
        <div class="rp-label">
          <span class="rp-icon">🛟</span>
          <span>救援进度</span>
        </div>
        <div class="rp-count">
          <span class="rescued">{{ state.capsulesRescued }}</span>
          <span class="sep">/</span>
          <span class="total">{{ state.totalRealCapsules }}</span>
        </div>
      </div>
      <div class="rp-bar">
        <div
          class="rp-fill"
          :style="{ width: rescuePercent + '%' }"
        ></div>
      </div>
      <div class="rp-sub">
        <span>已发现 <b>{{ state.capsulesFound }}</b> 个可疑信号</span>
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
    </div>

    <div class="hint" v-if="showHint">
      <span v-if="!isFollowingPath">🔊 点击释放声呐 · 📡 点击可疑回波确认</span>
      <span v-else>🎯 点击地图移动潜航器 · 🛤️ 沿安全航线避免处罚</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RescueGameState, PathSafetyLevel } from '../types/game';
import { RESCUE_CONFIG } from '../config/gameConfig';

const props = defineProps<{
  state: RescueGameState;
  showHint: boolean;
}>();

const rescuePercent = computed(() => {
  if (props.state.totalRealCapsules === 0) return 0;
  return (props.state.capsulesRescued / props.state.totalRealCapsules) * 100;
});

const isWarning = computed(() => props.state.timeRemaining <= 30 && props.state.timeRemaining > 10);
const isCritical = computed(() => props.state.timeRemaining <= 10);

const isFollowingPath = computed(() =>
  props.state.path.followStatus === 'following' ||
  props.state.path.followStatus === 'offtrack' ||
  props.state.path.followStatus === 'reached'
);

const isOfftrackDanger = computed(() =>
  props.state.path.distanceFromPath > RESCUE_CONFIG.PATH.MAX_ALLOWED_DEVIATION
);

const showOfftrackAlert = computed(() =>
  (props.state.path.followStatus === 'following' || props.state.path.followStatus === 'offtrack') &&
  props.state.path.distanceFromPath > RESCUE_CONFIG.PATH.MAX_ALLOWED_DEVIATION
);

const showHighRiskAlert = computed(() => props.state.path.isInHighRiskZone);
const showBlockerAlert = computed(() => props.state.path.isInBlockerZone);

const pathStatusClass = computed(() => {
  if (props.state.path.isInBlockerZone) return 'blocked';
  if (props.state.path.isInHighRiskZone) return 'high-risk';
  if (props.state.path.followStatus === 'reached') return 'reached';
  if (props.state.path.distanceFromPath > RESCUE_CONFIG.PATH.MAX_ALLOWED_DEVIATION) return 'offtrack';
  if (props.state.path.distanceFromPath > RESCUE_CONFIG.PATH.WARNING_DEVIATION) return 'caution';
  return 'safe';
});

const pathStatusIcon = computed(() => {
  if (props.state.path.followStatus === 'reached') return '🎯';
  if (props.state.path.isInBlockerZone) return '🚧';
  if (props.state.path.isInHighRiskZone) return '☢️';
  if (props.state.path.distanceFromPath > RESCUE_CONFIG.PATH.MAX_ALLOWED_DEVIATION) return '⚠️';
  if (props.state.path.distanceFromPath > RESCUE_CONFIG.PATH.WARNING_DEVIATION) return '🟡';
  return '✅';
});

const pathStatusText = computed(() => {
  if (props.state.path.followStatus === 'reached') return '已到达目标';
  if (props.state.path.isInBlockerZone) return '阻断区碰撞！';
  if (props.state.path.isInHighRiskZone) return '高危区警告！';
  if (props.state.path.distanceFromPath > RESCUE_CONFIG.PATH.MAX_ALLOWED_DEVIATION) return '严重偏航！';
  if (props.state.path.distanceFromPath > RESCUE_CONFIG.PATH.WARNING_DEVIATION) return '航线偏离警告';
  return '沿安全航线航行';
});

const safetyLevels: { value: PathSafetyLevel; label: string }[] = [
  { value: 'safe', label: '安全' },
  { value: 'caution', label: '注意' },
  { value: 'danger', label: '危险' },
  { value: 'high_risk', label: '高危' },
  { value: 'blocked', label: '阻断' },
];

const currentSafetyLabel = computed(() => {
  const lvl = safetyLevels.find(s => s.value === props.state.path.currentSafetyLevel);
  return lvl?.label || '未知';
});

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const formatNumber = (n: number) => n.toLocaleString();
</script>

<style scoped>
.rescue-hud {
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
  background: linear-gradient(135deg, rgba(40, 0, 60, 0.88), rgba(20, 0, 40, 0.92));
  border: 1px solid rgba(255, 120, 180, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 20px rgba(255, 80, 140, 0.1);
}

.hud-panel.left {
  max-width: 55%;
}

.hud-panel.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.rescue-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  background: linear-gradient(135deg, rgba(255, 80, 120, 0.3), rgba(255, 50, 100, 0.3));
  border: 1px solid rgba(255, 120, 150, 0.5);
  border-radius: 12px;
  margin-bottom: 8px;
}

.rescue-tag-icon { font-size: 12px; }

.rescue-tag-text {
  font-size: 10px;
  font-weight: bold;
  color: rgba(255, 200, 220, 0.95);
  letter-spacing: 1px;
}

.hud-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.hud-label {
  font-size: 10px;
  color: rgba(255, 180, 210, 0.65);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hud-value {
  font-size: 22px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.hud-value.score {
  color: #ff88cc;
  text-shadow: 0 0 10px rgba(255, 136, 204, 0.5);
}

.timer-container {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(80, 20, 50, 0.5);
  border: 1px solid rgba(255, 120, 170, 0.35);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.timer-container.warning {
  border-color: rgba(255, 180, 80, 0.7);
  background: rgba(100, 60, 10, 0.5);
  animation: timer-warn 0.8s ease-in-out infinite;
}

.timer-container.critical {
  border-color: rgba(255, 80, 80, 0.85);
  background: rgba(100, 20, 20, 0.6);
  animation: timer-critical 0.4s ease-in-out infinite;
}

@keyframes timer-warn {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 180, 80, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 180, 80, 0.55); }
}

@keyframes timer-critical {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 80, 80, 0.4); transform: scale(1); }
  50% { box-shadow: 0 0 25px rgba(255, 80, 80, 0.7); transform: scale(1.02); }
}

.timer-icon { font-size: 14px; }

.timer-value {
  font-size: 20px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #ffaacc;
  text-shadow: 0 0 8px rgba(255, 170, 204, 0.5);
}

.timer-container.warning .timer-value { color: #ffcc66; }
.timer-container.critical .timer-value { color: #ff6666; }

.false-reports-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: rgba(60, 0, 30, 0.5);
  border-radius: 8px;
}

.fr-label {
  font-size: 10px;
  color: rgba(255, 150, 180, 0.6);
  letter-spacing: 1px;
}

.fr-hearts {
  display: flex;
  gap: 4px;
}

.fr-heart {
  font-size: 13px;
  color: #00ff88;
  text-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
  transition: all 0.3s ease;
}

.fr-heart.lost {
  color: #ff4466;
  text-shadow: 0 0 6px rgba(255, 68, 102, 0.5);
}

.path-status {
  position: absolute;
  top: 165px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 360px;
  background: linear-gradient(135deg, rgba(10, 40, 60, 0.92), rgba(5, 20, 40, 0.95));
  border: 1px solid rgba(0, 255, 200, 0.35);
  border-radius: 12px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 25px rgba(0, 255, 200, 0.15);
}

.ps-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(0, 50, 80, 0.4);
}

.ps-header.safe {
  border-left: 3px solid #00ff88;
  background: rgba(0, 80, 60, 0.4);
}

.ps-header.caution {
  border-left: 3px solid #ffcc00;
  background: rgba(80, 60, 0, 0.4);
}

.ps-header.offtrack {
  border-left: 3px solid #ff6644;
  background: rgba(80, 30, 10, 0.5);
  animation: ps-pulse 0.8s ease-in-out infinite;
}

.ps-header.high-risk {
  border-left: 3px solid #ff0033;
  background: rgba(80, 0, 20, 0.55);
  animation: ps-pulse-fast 0.4s ease-in-out infinite;
}

.ps-header.blocked {
  border-left: 3px solid #660033;
  background: rgba(60, 0, 30, 0.6);
  animation: ps-pulse-fast 0.3s ease-in-out infinite;
}

.ps-header.reached {
  border-left: 3px solid #00ffff;
  background: rgba(0, 80, 80, 0.5);
}

@keyframes ps-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes ps-pulse-fast {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.01); }
}

.ps-icon {
  font-size: 16px;
}

.ps-title {
  flex: 1;
  font-size: 12px;
  font-weight: bold;
  color: #aaffdd;
  letter-spacing: 0.5px;
}

.ps-header.caution .ps-title { color: #ffdd88; }
.ps-header.offtrack .ps-title { color: #ffaa88; }
.ps-header.high-risk .ps-title { color: #ff6688; }
.ps-header.blocked .ps-title { color: #ff4466; }
.ps-header.reached .ps-title { color: #00ffff; }

.ps-bonus {
  font-size: 12px;
  font-weight: bold;
  color: #00ffaa;
  font-family: 'Courier New', monospace;
}

.ps-progress {
  margin-bottom: 8px;
}

.ps-progress-bar {
  height: 6px;
  background: rgba(0, 40, 60, 0.6);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.ps-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00ffcc, #00e5ff);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(0, 255, 170, 0.4);
}

.ps-progress-fill.caution { background: linear-gradient(90deg, #ffcc00, #ffaa44); }
.ps-progress-fill.offtrack { background: linear-gradient(90deg, #ff6644, #ff4422); }
.ps-progress-fill.high-risk { background: linear-gradient(90deg, #ff0033, #cc0022); }
.ps-progress-fill.blocked { background: linear-gradient(90deg, #660033, #440022); }
.ps-progress-fill.reached { background: linear-gradient(90deg, #00ffff, #00ccff); }

.ps-progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(150, 220, 255, 0.6);
}

.ps-total-bonus {
  color: #00ffaa;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.ps-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.ps-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 40, 60, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.2);
  font-size: 10px;
}

.ps-indicator.deviation { border-color: rgba(255, 200, 100, 0.4); }
.ps-indicator.yaw { border-color: rgba(255, 100, 100, 0.5); }
.ps-indicator.high-risk { border-color: rgba(255, 0, 50, 0.6); }
.ps-indicator.blocker { border-color: rgba(150, 0, 80, 0.7); }

.psi-icon { font-size: 11px; }

.psi-label {
  color: rgba(200, 230, 255, 0.6);
}

.psi-value {
  font-weight: bold;
  color: #aaddff;
  font-family: 'Courier New', monospace;
}

.psi-value.danger {
  color: #ff6666;
}

.ps-safety {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(0, 200, 255, 0.15);
}

.ps-safety-label {
  font-size: 10px;
  color: rgba(150, 220, 255, 0.5);
  letter-spacing: 0.5px;
}

.ps-safety-levels {
  display: flex;
  gap: 4px;
}

.ps-safety-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(100, 100, 100, 0.3);
  border: 1px solid rgba(150, 150, 150, 0.3);
  transition: all 0.3s ease;
}

.ps-safety-dot.safe.active { background: #00ff88; border-color: #00ff88; box-shadow: 0 0 6px #00ff88; }
.ps-safety-dot.caution.active { background: #ffcc00; border-color: #ffcc00; box-shadow: 0 0 6px #ffcc00; }
.ps-safety-dot.danger.active { background: #ff6644; border-color: #ff6644; box-shadow: 0 0 6px #ff6644; }
.ps-safety-dot.high_risk.active { background: #ff0033; border-color: #ff0033; box-shadow: 0 0 6px #ff0033; }
.ps-safety-dot.blocked.active { background: #660033; border-color: #660033; box-shadow: 0 0 6px #660033; }

.ps-safety-text {
  font-size: 10px;
  font-weight: bold;
  color: #8899aa;
  margin-left: auto;
}

.ps-safety-text.safe { color: #00ff88; }
.ps-safety-text.caution { color: #ffcc00; }
.ps-safety-text.danger { color: #ff6644; }
.ps-safety-text.high_risk { color: #ff0033; }
.ps-safety-text.blocked { color: #ff3366; }

.offtrack-alert,
.high-risk-alert,
.blocker-alert {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 24px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  animation: alert-in 0.3s ease-out;
  z-index: 15;
}

.offtrack-alert {
  background: rgba(100, 40, 10, 0.85);
  border: 2px solid rgba(255, 150, 50, 0.7);
  animation: alert-in 0.3s ease-out, alert-pulse 0.8s ease-in-out infinite;
}

.high-risk-alert {
  background: rgba(100, 0, 20, 0.85);
  border: 2px solid rgba(255, 50, 80, 0.7);
  animation: alert-in 0.3s ease-out, alert-pulse-fast 0.4s ease-in-out infinite;
}

.blocker-alert {
  background: rgba(80, 0, 40, 0.85);
  border: 2px solid rgba(200, 50, 100, 0.7);
  animation: alert-in 0.3s ease-out, alert-pulse-fast 0.3s ease-in-out infinite;
}

@keyframes alert-in {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes alert-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 150, 50, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 150, 50, 0.6); }
}

@keyframes alert-pulse-fast {
  0%, 100% { box-shadow: 0 0 25px rgba(255, 50, 80, 0.4); }
  50% { box-shadow: 0 0 50px rgba(255, 50, 80, 0.8); }
}

.ota-icon, .hra-icon, .ba-icon {
  font-size: 28px;
}

.ota-text, .hra-text, .ba-text {
  font-size: 14px;
  font-weight: bold;
  color: #ffccaa;
  text-shadow: 0 0 10px rgba(255, 150, 100, 0.5);
}

.hra-text { color: #ffaabb; }
.ba-text { color: #ff88aa; }

.ota-remaining {
  font-size: 11px;
  color: #ffaa88;
  font-family: 'Courier New', monospace;
}

.rescue-progress {
  position: absolute;
  top: 300px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 340px;
  background: linear-gradient(135deg, rgba(30, 0, 60, 0.88), rgba(15, 0, 35, 0.92));
  border: 1px solid rgba(0, 255, 170, 0.25);
  border-radius: 12px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
}

.rp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.rp-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(0, 255, 200, 0.8);
  letter-spacing: 1px;
}

.rp-icon { font-size: 13px; }

.rp-count {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.rp-count .rescued {
  font-size: 18px;
  color: #00ffcc;
  text-shadow: 0 0 8px rgba(0, 255, 204, 0.5);
}

.rp-count .sep {
  font-size: 14px;
  color: rgba(150, 200, 220, 0.5);
  margin: 0 2px;
}

.rp-count .total {
  font-size: 14px;
  color: rgba(150, 220, 255, 0.6);
}

.rp-bar {
  height: 8px;
  background: rgba(0, 50, 80, 0.6);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.rp-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00ffcc, #00e5ff);
  border-radius: 4px;
  transition: width 0.4s ease;
  box-shadow: 0 0 10px rgba(0, 255, 170, 0.4);
}

.rp-sub {
  font-size: 10px;
  color: rgba(150, 220, 255, 0.55);
  text-align: center;
}

.rp-sub b {
  color: rgba(200, 240, 255, 0.85);
  font-weight: bold;
}

.hud-bottom {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
}

.sonar-bar {
  background: linear-gradient(135deg, rgba(40, 0, 60, 0.88), rgba(20, 0, 40, 0.92));
  border: 1px solid rgba(0, 204, 255, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
}

.sonar-label {
  font-size: 11px;
  color: rgba(0, 204, 255, 0.7);
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
  background: rgba(0, 40, 70, 0.6);
  border-radius: 4px;
  border: 1px solid rgba(0, 204, 255, 0.2);
  overflow: hidden;
  position: relative;
}

.sonar-charge.active .charge-inner {
  position: absolute;
  inset: 2px;
  background: linear-gradient(90deg, #00ccff, #00e5ff, #00ffff);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(0, 204, 255, 0.5);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.hint {
  position: absolute;
  bottom: 110px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(40, 0, 60, 0.9);
  border: 1px solid rgba(255, 120, 180, 0.4);
  color: rgba(255, 200, 230, 0.9);
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
</style>
