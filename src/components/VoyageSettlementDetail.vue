<template>
  <div class="settlement-overlay" v-if="visible">
    <div class="settlement-panel">
      <div class="settlement-header">
        <button class="back-btn" @click="$emit('back')">
          <span>←</span> 返回
        </button>
        <h2 class="settlement-title">
          <span class="title-icon">📊</span>
          <span>航次结算详情</span>
        </h2>
        <div class="header-spacer"></div>
      </div>

      <div v-if="record" class="settlement-body">
        <div class="summary-section">
          <div class="summary-score">
            <div class="ss-label">最终得分</div>
            <div class="ss-value">{{ formatNumber(record.finalScore) }}</div>
            <div v-if="record.isNewRecord" class="ss-badge">🏆 新纪录</div>
          </div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="si-value">Lv.{{ record.finalLevel }}</div>
              <div class="si-label">到达等级</div>
            </div>
            <div class="summary-item">
              <div class="si-value">{{ formatDuration(record.duration) }}</div>
              <div class="si-label">航次时长</div>
            </div>
            <div class="summary-item">
              <div class="si-value">{{ record.hitRate.discoveredTargets }}/{{ record.hitRate.totalTargets }}</div>
              <div class="si-label">发现目标</div>
            </div>
            <div class="summary-item">
              <div class="si-value success" v-if="record.isVictory">✓ 成功</div>
              <div class="si-value fail" v-else>✗ 失败</div>
              <div class="si-label">航次结果</div>
            </div>
          </div>
        </div>

        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>

        <div class="tab-content">
          <div v-show="activeTab === 'trajectory'" class="tab-panel">
            <div class="panel-title">
              <span>🗺️</span> 发现路径
            </div>
            <div class="trajectory-wrapper">
              <svg :viewBox="`0 0 ${mapWidth} ${mapHeight}`" class="trajectory-svg">
                <defs>
                  <linearGradient id="trajGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.15" />
                    <stop offset="100%" stop-color="#00ffcc" stop-opacity="0.9" />
                  </linearGradient>
                  <filter id="glowFilter">
                    <feGaussianBlur stdDeviation="1.5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <rect :width="mapWidth" :height="mapHeight" fill="#001528" rx="8" />
                <polyline
                  v-if="trajectoryLine.length > 1"
                  :points="trajectoryLine"
                  fill="none"
                  stroke="url(#trajGrad)"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                <g v-for="(p, i) in trajectoryEvents" :key="i">
                  <circle :cx="p.x" :cy="p.y" :r="p.r" :fill="p.color" filter="url(#glowFilter)" :opacity="0.8" />
                </g>
                <circle :cx="startPoint.x" :cy="startPoint.y" r="6" fill="#00ff88" filter="url(#glowFilter)" />
                <text :x="startPoint.x" :y="startPoint.y + 3" fill="#001a10" font-size="7" text-anchor="middle" font-weight="bold">起</text>
                <circle :cx="endPoint.x" :cy="endPoint.y" r="6" :fill="record.isVictory ? '#00ff88' : '#ff4466'" filter="url(#glowFilter)" />
                <text :x="endPoint.x" :y="endPoint.y + 3" fill="#fff" font-size="7" text-anchor="middle" font-weight="bold">终</text>
              </svg>
            </div>
            <div class="traj-legend">
              <div class="legend-item"><span class="dot start"></span>起点</div>
              <div class="legend-item"><span class="dot end"></span>终点</div>
              <div class="legend-item"><span class="dot sonar"></span>声呐探测</div>
              <div class="legend-item"><span class="dot collect"></span>目标收集</div>
              <div class="legend-item"><span class="dot danger"></span>危险碰撞</div>
            </div>
            <div class="traj-stats">
              <div class="ts-item"><div class="tsv">{{ record.trajectory.length }}</div><div class="tsl">轨迹采样点</div></div>
              <div class="ts-item"><div class="tsv">{{ sonarEventCount }}</div><div class="tsl">声呐探测</div></div>
              <div class="ts-item"><div class="tsv">{{ collectEventCount }}</div><div class="tsl">收集目标</div></div>
              <div class="ts-item"><div class="tsv danger">{{ dangerEventCount }}</div><div class="tsl">危险碰撞</div></div>
            </div>
          </div>

          <div v-show="activeTab === 'targets'" class="tab-panel">
            <div class="panel-title">
              <span>📦</span> 目标构成
            </div>
            <div class="targets-overview">
              <div class="overview-card creature">
                <div class="oc-value">+{{ record.scoreBreakdown.fromCreatures }}</div>
                <div class="oc-label">生物得分</div>
              </div>
              <div class="overview-card wreck">
                <div class="oc-value">+{{ record.scoreBreakdown.fromWrecks }}</div>
                <div class="oc-label">沉船得分</div>
              </div>
              <div class="overview-card danger">
                <div class="oc-value neg">{{ record.scoreBreakdown.fromDanger }}</div>
                <div class="oc-label">危险扣减</div>
              </div>
              <div class="overview-card bonus">
                <div class="oc-value">+{{ record.scoreBreakdown.fromBonus }}</div>
                <div class="oc-label">奖励得分</div>
              </div>
            </div>

            <div class="breakdown-section">
              <div class="bs-title">得分构成明细</div>
              <div class="breakdown-list">
                <div class="bd-header">
                  <span class="bd-cat">类别</span>
                  <span class="bd-name">名称</span>
                  <span class="bd-count">次数</span>
                  <span class="bd-avg">平均</span>
                  <span class="bd-total">合计</span>
                </div>
                <div
                  v-for="item in record.scoreBreakdown.items"
                  :key="item.name + item.category"
                  class="bd-row"
                >
                  <span class="bd-cat">
                    <span class="cat-badge" :class="item.category">{{ getCategoryShort(item.category) }}</span>
                  </span>
                  <span class="bd-name">{{ item.name }}</span>
                  <span class="bd-count">{{ item.count }}</span>
                  <span class="bd-avg">{{ item.avgPoints }}</span>
                  <span class="bd-total" :class="{ neg: item.totalPoints < 0 }">
                    {{ item.totalPoints >= 0 ? '+' : '' }}{{ item.totalPoints }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'mistakes'" class="tab-panel">
            <div class="panel-title">
              <span>⚠️</span> 失误原因
            </div>

            <div v-if="record.anomalies.length === 0" class="no-anomalies">
              <div class="na-icon">✓</div>
              <div class="na-text">本次航次无异常，航行平稳！</div>
            </div>

            <div v-else class="anomalies-timeline">
              <div
                v-for="(ev, idx) in sortedAnomalies"
                :key="ev.id"
                class="anomaly-item"
                :class="ev.severity"
              >
                <div class="ai-index">{{ idx + 1 }}</div>
                <div class="ai-content">
                  <div class="ai-header">
                    <span class="ai-severity" :class="ev.severity">{{ getSeverityLabel(ev.severity) }}</span>
                    <span class="ai-type">{{ getAnomalyLabel(ev.type) }}</span>
                    <span class="ai-time">{{ formatDuration(ev.timestamp - record.startedAt) }}</span>
                  </div>
                  <div class="ai-desc">{{ ev.description }}</div>
                  <div class="ai-pos">📍 坐标 ({{ Math.round(ev.position.x) }}, {{ Math.round(ev.position.y) }})</div>
                </div>
              </div>
            </div>

            <div v-if="anomalyGroups.length > 0" class="anomaly-summary">
              <div class="as-title">失误分类统计</div>
              <div class="as-grid">
                <div
                  v-for="g in anomalyGroups"
                  :key="g.type"
                  class="as-item"
                  :class="g.severity"
                >
                  <div class="as-count">{{ g.count }}</div>
                  <div class="as-label">{{ g.label }}</div>
                </div>
              </div>
            </div>

            <div v-if="record.hitRate.tapsWithMiss > 0" class="mistake-stats">
              <div class="ms-title">操作数据</div>
              <div class="ms-grid">
                <div class="ms-item">
                  <div class="msv">{{ record.hitRate.totalSonarFired }}</div>
                  <div class="msl">声呐使用</div>
                </div>
                <div class="ms-item">
                  <div class="msv">{{ Math.round(record.hitRate.discoveryRate * 100) }}%</div>
                  <div class="msl">发现率</div>
                </div>
                <div class="ms-item">
                  <div class="msv">{{ record.hitRate.tapsWithMiss }}</div>
                  <div class="msl">点击失误</div>
                </div>
                <div class="ms-item">
                  <div class="msv">{{ Math.round(record.hitRate.tapAccuracy * 100) }}%</div>
                  <div class="msl">点击准确率</div>
                </div>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'rewards'" class="tab-panel">
            <div class="panel-title">
              <span>⚡</span> 奖励来源
            </div>

            <div v-if="expeditionReward" class="reward-section">
              <div class="reward-total">
                <div class="rt-label">获得航次积分</div>
                <div class="rt-value">+{{ expeditionReward.points }}</div>
              </div>

              <div class="reward-breakdown">
                <div class="rb-item">
                  <span class="rb-label">基础奖励</span>
                  <span class="rb-value">+{{ expeditionReward.breakdown.base }}</span>
                </div>
                <div class="rb-item">
                  <span class="rb-label">关卡奖励</span>
                  <span class="rb-value">+{{ expeditionReward.breakdown.level }}</span>
                </div>
                <div class="rb-item">
                  <span class="rb-label">发现奖励</span>
                  <span class="rb-value">+{{ expeditionReward.breakdown.discoveries }}</span>
                </div>
                <div class="rb-item">
                  <span class="rb-label">得分奖励</span>
                  <span class="rb-value">+{{ expeditionReward.breakdown.score }}</span>
                </div>
                <div v-if="(expeditionReward.breakdown.dailyBonus ?? 0) > 0" class="rb-item daily">
                  <span class="rb-label">每日挑战加成</span>
                  <span class="rb-value">+{{ expeditionReward.breakdown.dailyBonus }}</span>
                </div>
              </div>

              <div class="reward-total-points">
                <span>累计总积分：</span>
                <span class="tp-value">{{ formatNumber(totalExpeditionPoints ?? 0) }}</span>
              </div>
            </div>

            <div v-else class="no-reward">
              <div class="nr-icon">—</div>
              <div class="nr-text">暂无航次积分奖励记录</div>
            </div>

            <div class="combo-reward-section">
              <div class="cr-title">连击奖励</div>
              <div class="cr-grid">
                <div class="cr-item">
                  <div class="crv combo">{{ record.scoreBreakdown.maxCombo }}</div>
                  <div class="crl">最高连击</div>
                </div>
                <div class="cr-item">
                  <div class="crv sonar">{{ record.scoreBreakdown.maxSonarCombo }}</div>
                  <div class="crl">最高连探</div>
                </div>
                <div class="cr-item">
                  <div class="crv points">+{{ record.scoreBreakdown.comboBonusPoints }}</div>
                  <div class="crl">连击加成分</div>
                </div>
                <div class="cr-item">
                  <div class="crv charges">+{{ record.scoreBreakdown.comboSonarCharges }}</div>
                  <div class="crl">额外充能</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">暂无航次记录</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { VoyageRecord, ExpeditionReward, AnomalyEventType } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

const props = defineProps<{
  visible: boolean;
  record: VoyageRecord | null;
  expeditionReward?: ExpeditionReward | null;
  totalExpeditionPoints?: number;
}>();

defineEmits<{
  (e: 'back'): void;
}>();

const activeTab = ref<'trajectory' | 'targets' | 'mistakes' | 'rewards'>('trajectory');

const tabs = [
  { key: 'trajectory' as const, icon: '🗺️', label: '发现路径' },
  { key: 'targets' as const, icon: '📦', label: '目标构成' },
  { key: 'mistakes' as const, icon: '⚠️', label: '失误原因' },
  { key: 'rewards' as const, icon: '⚡', label: '奖励来源' },
];

const mapWidth = GAME_CONFIG.MAP_WIDTH;
const mapHeight = GAME_CONFIG.MAP_HEIGHT;

const formatNumber = (n: number) => Math.round(n).toLocaleString();

const formatDuration = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}分${sec}秒`;
  return `${sec}秒`;
};

const trajectoryLine = computed(() => {
  if (!props.record?.trajectory.length) return '';
  return props.record.trajectory.map(p => `${p.position.x},${p.position.y}`).join(' ');
});

const startPoint = computed(() => {
  if (!props.record?.trajectory.length) return { x: mapWidth / 2, y: mapHeight / 2 };
  return props.record.trajectory[0].position;
});

const endPoint = computed(() => {
  if (!props.record?.trajectory.length) return { x: mapWidth / 2, y: mapHeight / 2 };
  return props.record.trajectory[props.record.trajectory.length - 1].position;
});

const trajectoryEvents = computed(() => {
  if (!props.record) return [] as Array<{ x: number; y: number; r: number; color: string; type: string }>;
  const events: Array<{ x: number; y: number; r: number; color: string; type: string }> = [];
  for (const p of props.record.trajectory) {
    if (p.event === 'sonar') {
      events.push({ x: p.position.x, y: p.position.y, r: 4, color: '#00aaff', type: 'sonar' });
    } else if (p.event === 'collect') {
      events.push({ x: p.position.x, y: p.position.y, r: 5, color: '#ffcc00', type: 'collect' });
    } else if (p.event === 'damage') {
      events.push({ x: p.position.x, y: p.position.y, r: 6, color: '#ff3355', type: 'danger' });
    }
  }
  return events;
});

const sonarEventCount = computed(() => {
  if (!props.record) return 0;
  return props.record.trajectory.filter(p => p.event === 'sonar').length;
});

const collectEventCount = computed(() => {
  if (!props.record) return 0;
  return props.record.trajectory.filter(p => p.event === 'collect').length;
});

const dangerEventCount = computed(() => {
  if (!props.record) return 0;
  return props.record.trajectory.filter(p => p.event === 'damage').length;
});

const sortedAnomalies = computed(() => {
  if (!props.record) return [];
  return [...props.record.anomalies].sort((a, b) => a.timestamp - b.timestamp);
});

const anomalyGroups = computed(() => {
  if (!props.record) return [];
  const groups: Record<string, { type: string; count: number; label: string; severity: string }> = {};
  const labels: Record<AnomalyEventType, string> = {
    danger_hit: '危险碰撞',
    sonar_empty: '空放声呐',
    target_missed: '目标错过',
    false_report: '误报',
    path_offtrack: '偏航',
    high_risk_enter: '进入高危区',
    blocker_collision: '阻断区碰撞',
    yaw_warning: '偏航警告',
    yaw_failure: '偏航超限',
  };
  for (const a of props.record.anomalies) {
    if (!groups[a.type]) {
      groups[a.type] = { type: a.type, count: 0, label: labels[a.type] || a.type, severity: a.severity };
    }
    groups[a.type].count++;
  }
  return Object.values(groups).sort((a, b) => b.count - a.count);
});

const getCategoryShort = (cat: string) => {
  const map: Record<string, string> = {
    creature: '生物',
    wreck: '沉船',
    danger: '危险',
    bonus: '奖励',
    level_up: '升级',
    combo: '连击',
    rescue: '救援',
    path_bonus: '航线',
  };
  return map[cat] || cat;
};

const getSeverityLabel = (sev: string) => {
  const map: Record<string, string> = {
    low: '轻微',
    medium: '中等',
    high: '严重',
    critical: '致命',
  };
  return map[sev] || sev;
};

const getAnomalyLabel = (type: AnomalyEventType) => {
  const map: Record<AnomalyEventType, string> = {
    danger_hit: '危险区域碰撞',
    sonar_empty: '空放声呐',
    target_missed: '目标错过',
    false_report: '误报',
    path_offtrack: '航线偏航',
    high_risk_enter: '进入高危区',
    blocker_collision: '阻断区碰撞',
    yaw_warning: '偏航警告',
    yaw_failure: '偏航超限',
  };
  return map[type] || type;
};
</script>

<style scoped>
.settlement-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(10, 0, 15, 0.96) 0%, rgba(2, 0, 8, 0.98) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 120;
  backdrop-filter: blur(10px);
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settlement-panel {
  width: 92%;
  max-width: 440px;
  max-height: 88vh;
  background: linear-gradient(160deg, rgba(0, 30, 50, 0.85) 0%, rgba(0, 15, 30, 0.9) 100%);
  border: 1px solid rgba(0, 255, 170, 0.25);
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6), 0 0 60px rgba(0, 200, 150, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slide-up 0.4s ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settlement-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 255, 170, 0.15);
  background: rgba(0, 40, 60, 0.4);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 255, 170, 0.1);
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 8px;
  color: #00ffcc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(0, 255, 170, 0.2);
}

.settlement-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: bold;
  color: #00ffcc;
  letter-spacing: 2px;
  margin: 0;
}

.title-icon {
  font-size: 18px;
}

.header-spacer {
  width: 60px;
}

.settlement-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
}

.settlement-body::-webkit-scrollbar {
  width: 4px;
}

.settlement-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.settlement-body::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 170, 0.3);
  border-radius: 2px;
}

.summary-section {
  margin-bottom: 16px;
}

.summary-score {
  text-align: center;
  margin-bottom: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.08), rgba(255, 136, 0, 0.08));
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 12px;
  position: relative;
}

.ss-label {
  font-size: 11px;
  color: rgba(200, 200, 220, 0.6);
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.ss-value {
  font-size: 42px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #ffcc00 0%, #ff8800 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(255, 204, 0, 0.3);
  line-height: 1.1;
}

.ss-badge {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 136, 0, 0.2));
  border: 1px solid rgba(255, 204, 0, 0.5);
  border-radius: 12px;
  color: #ffcc00;
  font-size: 11px;
  font-weight: bold;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.summary-item {
  text-align: center;
  padding: 10px 6px;
  background: rgba(0, 40, 60, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 8px;
}

.si-value {
  font-size: 15px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
  margin-bottom: 3px;
}

.si-value.success {
  color: #00ff88;
}

.si-value.fail {
  color: #ff5577;
}

.si-label {
  font-size: 9px;
  color: rgba(200, 200, 220, 0.5);
  letter-spacing: 0.5px;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  padding: 3px;
  background: rgba(0, 20, 35, 0.6);
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 170, 0.12);
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(0, 255, 170, 0.08);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(0, 255, 170, 0.2), rgba(0, 170, 255, 0.15));
  box-shadow: 0 2px 10px rgba(0, 255, 170, 0.15);
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  font-size: 10px;
  color: rgba(200, 200, 220, 0.6);
  letter-spacing: 0.5px;
}

.tab-btn.active .tab-label {
  color: #00ffcc;
  font-weight: 500;
}

.tab-content {
  min-height: 280px;
}

.tab-panel {
  animation: tab-fade 0.25s ease;
}

@keyframes tab-fade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.9);
  margin-bottom: 12px;
  letter-spacing: 1.5px;
}

.trajectory-wrapper {
  width: 100%;
  margin-bottom: 12px;
}

.trajectory-svg {
  width: 100%;
  height: auto;
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 170, 0.2);
}

.traj-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: rgba(200, 200, 220, 0.6);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.start { background: #00ff88; }
.dot.end { background: #ff4466; }
.dot.sonar { background: #00aaff; }
.dot.collect { background: #ffcc00; }
.dot.danger { background: #ff3355; }

.traj-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.ts-item {
  text-align: center;
  padding: 8px 4px;
  background: rgba(0, 30, 50, 0.5);
  border-radius: 7px;
}

.tsv {
  font-size: 15px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
  margin-bottom: 2px;
}

.tsv.danger {
  color: #ff5577;
}

.tsl {
  font-size: 9px;
  color: rgba(200, 200, 220, 0.5);
}

.targets-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 14px;
}

.overview-card {
  text-align: center;
  padding: 10px 6px;
  background: rgba(0, 30, 50, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 170, 0.15);
}

.overview-card.creature { border-color: rgba(0, 229, 255, 0.3); }
.overview-card.wreck { border-color: rgba(255, 204, 0, 0.3); }
.overview-card.danger { border-color: rgba(255, 51, 85, 0.3); }
.overview-card.bonus { border-color: rgba(0, 255, 170, 0.3); }

.oc-value {
  font-size: 14px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
  margin-bottom: 3px;
}

.oc-value.neg {
  color: #ff5577;
}

.overview-card.creature .oc-value { color: #00e5ff; }
.overview-card.wreck .oc-value { color: #ffcc00; }
.overview-card.bonus .oc-value { color: #00ff88; }

.oc-label {
  font-size: 9px;
  color: rgba(200, 200, 220, 0.5);
}

.breakdown-section {
  margin-bottom: 10px;
}

.bs-title {
  font-size: 12px;
  font-weight: bold;
  color: rgba(200, 200, 220, 0.8);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.breakdown-list {
  background: rgba(0, 20, 35, 0.5);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 170, 0.12);
}

.bd-header,
.bd-row {
  display: grid;
  grid-template-columns: 50px 1fr 40px 45px 55px;
  gap: 4px;
  padding: 7px 8px;
  align-items: center;
  font-size: 10px;
}

.bd-header {
  background: rgba(0, 40, 60, 0.6);
  color: rgba(200, 200, 220, 0.5);
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 255, 170, 0.1);
}

.bd-row {
  border-bottom: 1px solid rgba(0, 255, 170, 0.06);
  color: rgba(220, 220, 240, 0.8);
}

.bd-row:last-child {
  border-bottom: none;
}

.bd-cat {
  text-align: center;
}

.cat-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: bold;
  background: rgba(0, 255, 170, 0.15);
  color: #00ffcc;
}

.cat-badge.creature { background: rgba(0, 229, 255, 0.15); color: #00e5ff; }
.cat-badge.wreck { background: rgba(255, 204, 0, 0.15); color: #ffcc00; }
.cat-badge.danger { background: rgba(255, 51, 85, 0.15); color: #ff5577; }
.cat-badge.bonus { background: rgba(0, 255, 170, 0.15); color: #00ff88; }
.cat-badge.level_up { background: rgba(150, 100, 255, 0.15); color: #aa77ff; }
.cat-badge.combo { background: rgba(255, 150, 50, 0.15); color: #ff9944; }

.bd-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bd-count,
.bd-avg,
.bd-total {
  text-align: right;
  font-family: 'Courier New', monospace;
}

.bd-total {
  font-weight: bold;
  color: #00ff88;
}

.bd-total.neg {
  color: #ff5577;
}

.no-anomalies {
  text-align: center;
  padding: 30px 20px;
  margin-bottom: 16px;
  background: rgba(0, 60, 40, 0.25);
  border: 1px solid rgba(0, 255, 136, 0.25);
  border-radius: 10px;
}

.na-icon {
  font-size: 36px;
  color: #00ff88;
  margin-bottom: 8px;
  line-height: 1;
}

.na-text {
  font-size: 13px;
  color: #00ffcc;
}

.anomalies-timeline {
  margin-bottom: 14px;
}

.anomaly-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(0, 20, 35, 0.6);
  border-radius: 8px;
  border-left: 3px solid rgba(255, 150, 50, 0.5);
}

.anomaly-item.low { border-left-color: rgba(100, 200, 255, 0.5); }
.anomaly-item.medium { border-left-color: rgba(255, 200, 50, 0.5); }
.anomaly-item.high { border-left-color: rgba(255, 100, 50, 0.5); }
.anomaly-item.critical { border-left-color: rgba(255, 50, 80, 0.7); }

.ai-index {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 200, 50, 0.15);
  border-radius: 50%;
  font-size: 10px;
  font-weight: bold;
  color: #ffcc00;
}

.ai-content {
  flex: 1;
  min-width: 0;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.ai-severity {
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: bold;
}

.ai-severity.low { background: rgba(100, 200, 255, 0.15); color: #66ccff; }
.ai-severity.medium { background: rgba(255, 200, 50, 0.15); color: #ffcc33; }
.ai-severity.high { background: rgba(255, 100, 50, 0.15); color: #ff7744; }
.ai-severity.critical { background: rgba(255, 50, 80, 0.2); color: #ff4466; }

.ai-type {
  font-size: 11px;
  font-weight: 500;
  color: rgba(220, 220, 240, 0.9);
}

.ai-time {
  margin-left: auto;
  font-size: 10px;
  color: rgba(200, 200, 220, 0.5);
  font-family: 'Courier New', monospace;
}

.ai-desc {
  font-size: 11px;
  color: rgba(200, 200, 220, 0.75);
  margin-bottom: 4px;
}

.ai-pos {
  font-size: 9px;
  color: rgba(200, 200, 220, 0.4);
}

.anomaly-summary {
  margin-bottom: 14px;
}

.as-title {
  font-size: 12px;
  font-weight: bold;
  color: rgba(200, 200, 220, 0.8);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.as-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.as-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(0, 20, 35, 0.5);
  border-radius: 7px;
  border-left: 3px solid rgba(255, 200, 50, 0.4);
}

.as-item.low { border-left-color: rgba(100, 200, 255, 0.4); }
.as-item.medium { border-left-color: rgba(255, 200, 50, 0.4); }
.as-item.high { border-left-color: rgba(255, 100, 50, 0.4); }

.as-count {
  font-size: 18px;
  font-weight: bold;
  color: #ffcc66;
  font-family: 'Courier New', monospace;
  min-width: 24px;
}

.as-label {
  font-size: 10px;
  color: rgba(200, 200, 220, 0.7);
}

.mistake-stats {
  margin-bottom: 10px;
}

.ms-title {
  font-size: 12px;
  font-weight: bold;
  color: rgba(200, 200, 220, 0.8);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.ms-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.ms-item {
  text-align: center;
  padding: 8px 4px;
  background: rgba(0, 30, 50, 0.5);
  border-radius: 7px;
}

.msv {
  font-size: 15px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
  margin-bottom: 2px;
}

.msl {
  font-size: 9px;
  color: rgba(200, 200, 220, 0.5);
}

.reward-section {
  margin-bottom: 16px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.08), rgba(255, 136, 0, 0.08));
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 10px;
}

.reward-total {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 204, 0, 0.15);
}

.rt-label {
  font-size: 11px;
  color: rgba(255, 200, 150, 0.6);
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.rt-value {
  font-size: 32px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 20px rgba(255, 204, 0, 0.4);
  line-height: 1.1;
}

.reward-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.rb-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.rb-label {
  color: rgba(200, 200, 220, 0.65);
}

.rb-item.daily .rb-label {
  color: rgba(255, 150, 100, 0.8);
}

.rb-value {
  color: rgba(255, 220, 150, 0.9);
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.rb-item.daily .rb-value {
  color: rgba(255, 180, 120, 0.95);
}

.reward-total-points {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 204, 0, 0.15);
  font-size: 11px;
  color: rgba(200, 200, 220, 0.6);
}

.tp-value {
  font-size: 14px;
  font-weight: bold;
  color: #ffcc66;
  font-family: 'Courier New', monospace;
}

.no-reward {
  text-align: center;
  padding: 24px 20px;
  margin-bottom: 16px;
  background: rgba(0, 30, 50, 0.4);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 10px;
}

.nr-icon {
  font-size: 28px;
  color: rgba(200, 200, 220, 0.3);
  margin-bottom: 6px;
}

.nr-text {
  font-size: 12px;
  color: rgba(200, 200, 220, 0.5);
}

.combo-reward-section {
  margin-bottom: 10px;
}

.cr-title {
  font-size: 12px;
  font-weight: bold;
  color: rgba(200, 200, 220, 0.8);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.cr-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.cr-item {
  text-align: center;
  padding: 10px 4px;
  background: rgba(0, 30, 50, 0.5);
  border-radius: 7px;
  border: 1px solid rgba(255, 204, 0, 0.15);
}

.crv {
  font-size: 16px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin-bottom: 3px;
}

.crv.combo { color: #ffcc00; }
.crv.sonar { color: #00aaff; }
.crv.points { color: #00ffcc; }
.crv.charges { color: #ff8844; }

.crl {
  font-size: 9px;
  color: rgba(200, 200, 220, 0.5);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: rgba(200, 200, 220, 0.5);
}
</style>
