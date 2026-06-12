<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="vs-header">
        <div class="vs-title">航次结算详情</div>
        <div class="vs-subtitle">Voyage Settlement Report</div>
      </div>

      <div class="vs-section">
        <div class="vs-section-title">
          <span class="vs-section-icon">🗺️</span>
          <span>发现路径</span>
        </div>
        <div class="path-map" ref="mapRef">
          <canvas ref="canvasRef" class="path-canvas"></canvas>
          <div class="path-legend">
            <span class="legend-item"><span class="dot sonar"></span>声呐</span>
            <span class="legend-item"><span class="dot collect"></span>采集</span>
            <span class="legend-item"><span class="dot damage"></span>受损</span>
            <span class="legend-item"><span class="dot move"></span>移动</span>
          </div>
        </div>
        <div class="path-stats">
          <div class="ps-item">
            <div class="ps-val">{{ trajectory.length }}</div>
            <div class="ps-lbl">路径节点</div>
          </div>
          <div class="ps-item">
            <div class="ps-val">{{ sonarCount }}</div>
            <div class="ps-lbl">声呐释放</div>
          </div>
          <div class="ps-item">
            <div class="ps-val">{{ collectCount }}</div>
            <div class="ps-lbl">目标采集</div>
          </div>
          <div class="ps-item">
            <div class="ps-val">{{ damageCount }}</div>
            <div class="ps-lbl">危险碰撞</div>
          </div>
        </div>
      </div>

      <div class="vs-section">
        <div class="vs-section-title">
          <span class="vs-section-icon">🎯</span>
          <span>目标构成</span>
        </div>
        <div class="comp-bars">
          <div class="comp-row">
            <div class="comp-label">
              <span class="comp-dot creature"></span>
              <span>海洋生物</span>
            </div>
            <div class="comp-bar-wrap">
              <div class="comp-bar creature" :style="{ width: creaturePct + '%' }"></div>
            </div>
            <div class="comp-val">{{ creatureCount }} <small>({{ creaturePts }}分)</small></div>
          </div>
          <div class="comp-row">
            <div class="comp-label">
              <span class="comp-dot wreck"></span>
              <span>残骸遗迹</span>
            </div>
            <div class="comp-bar-wrap">
              <div class="comp-bar wreck" :style="{ width: wreckPct + '%' }"></div>
            </div>
            <div class="comp-val">{{ wreckCount }} <small>({{ wreckPts }}分)</small></div>
          </div>
          <div class="comp-row">
            <div class="comp-label">
              <span class="comp-dot danger"></span>
              <span>危险目标</span>
            </div>
            <div class="comp-bar-wrap">
              <div class="comp-bar danger" :style="{ width: dangerPct + '%' }"></div>
            </div>
            <div class="comp-val">{{ dangerCount }} <small>({{ dangerPts }}分)</small></div>
          </div>
        </div>
        <div class="comp-summary">
          <span>发现率 <b>{{ discoveryRate }}%</b></span>
          <span>采集率 <b>{{ collectionRate }}%</b></span>
          <span>点击准确率 <b>{{ tapAccuracy }}%</b></span>
        </div>
      </div>

      <div class="vs-section">
        <div class="vs-section-title">
          <span class="vs-section-icon">⚠️</span>
          <span>失误分析</span>
        </div>
        <div class="mistake-list" v-if="anomalies.length > 0">
          <div v-for="(a, i) in displayAnomalies" :key="a.id" class="mistake-item" :class="a.severity">
            <div class="mistake-idx">{{ i + 1 }}</div>
            <div class="mistake-body">
              <div class="mistake-desc">{{ a.description }}</div>
              <div class="mistake-meta">
                <span class="mistake-type">{{ anomalyTypeLabel(a.type) }}</span>
                <span class="mistake-sev" :class="a.severity">{{ sevLabel(a.severity) }}</span>
              </div>
            </div>
          </div>
          <div class="mistake-more" v-if="anomalies.length > 5" @click="showAllAnomalies = !showAllAnomalies">
            {{ showAllAnomalies ? '收起' : `查看全部 ${anomalies.length} 条` }}
          </div>
        </div>
        <div class="mistake-empty" v-else>
          <span>✨</span> 本局表现完美，无失误记录！
        </div>
        <div class="mistake-summary" v-if="anomalies.length > 0">
          <span>异常总数 <b>{{ anomalies.length }}</b></span>
          <span>高危 <b class="critical">{{ criticalCount }}</b></span>
          <span>中等 <b class="medium">{{ mediumCount }}</b></span>
          <span>轻微 <b class="low">{{ lowCount }}</b></span>
        </div>
      </div>

      <div class="vs-section">
        <div class="vs-section-title">
          <span class="vs-section-icon">💎</span>
          <span>奖励来源</span>
        </div>
        <div class="reward-list" v-if="rewardItems.length > 0">
          <div v-for="item in rewardItems" :key="item.name" class="reward-item" :class="item.category">
            <div class="reward-cat">
              <span class="reward-cat-dot" :class="item.category"></span>
              <span>{{ catLabel(item.category) }}</span>
            </div>
            <div class="reward-name">{{ item.name }}</div>
            <div class="reward-count">×{{ item.count }}</div>
            <div class="reward-pts" :class="{ negative: item.totalPoints < 0 }">
              {{ item.totalPoints >= 0 ? '+' : '' }}{{ item.totalPoints }}
            </div>
          </div>
        </div>
        <div class="reward-empty" v-else>
          暂无奖励数据
        </div>
        <div class="reward-total" v-if="rewardItems.length > 0">
          <div class="rt-row"><span>生物得分</span><span class="rt-val creature">{{ fmt(scoreBreakdown.fromCreatures) }}</span></div>
          <div class="rt-row"><span>残骸得分</span><span class="rt-val wreck">{{ fmt(scoreBreakdown.fromWrecks) }}</span></div>
          <div class="rt-row"><span>危险扣分</span><span class="rt-val danger">{{ fmt(scoreBreakdown.fromDanger) }}</span></div>
          <div class="rt-row"><span>连击奖励</span><span class="rt-val combo">{{ fmt(scoreBreakdown.fromCombo) }}</span></div>
          <div class="rt-row"><span>升级奖励</span><span class="rt-val level">{{ fmt(scoreBreakdown.fromLevelUp) }}</span></div>
          <div class="rt-row"><span>其他奖励</span><span class="rt-val bonus">{{ fmt(scoreBreakdown.fromBonus) }}</span></div>
          <div class="rt-row total"><span>合计</span><span class="rt-val total-val">{{ fmt(scoreBreakdown.totalScore) }}</span></div>
        </div>
      </div>

      <div class="vs-replay-section" v-if="trajectory.length > 1">
        <div class="vs-section-title">
          <span class="vs-section-icon">🔄</span>
          <span>路径复盘</span>
        </div>
        <div class="replay-controls">
          <button class="replay-btn" @click="toggleReplay" :class="{ playing: isReplaying }">
            {{ isReplaying ? '⏸ 暂停' : '▶ 播放' }}
          </button>
          <div class="replay-progress">
            <input type="range" class="replay-slider" min="0" :max="trajectory.length - 1" v-model.number="replayIndex" :disabled="isReplaying" />
            <span class="replay-step">{{ replayIndex + 1 }} / {{ trajectory.length }}</span>
          </div>
          <button class="replay-btn speed" @click="cycleSpeed">×{{ replaySpeed }}x</button>
        </div>
      </div>

      <button class="continue-btn" @click="$emit('continue')">
        <span class="btn-text">继续结算</span>
        <span class="btn-arrow">›</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { TrajectoryPoint, ScoreBreakdown, HitRateStats, AnomalyEvent, AnomalyEventType } from '../types/game';

const MAP_W = 800;
const MAP_H = 1200;

const props = defineProps<{
  score: number;
  level: number;
  discovered: number;
  totalTargets: number;
  trajectory: TrajectoryPoint[];
  scoreBreakdown: ScoreBreakdown;
  hitRate: HitRateStats;
  anomalies: AnomalyEvent[];
}>();

defineEmits<{
  (e: 'continue'): void;
}>();

const mapRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const showAllAnomalies = ref(false);
const isReplaying = ref(false);
const replayIndex = ref(0);
const replaySpeed = ref(1);
let replayTimer: ReturnType<typeof setInterval> | null = null;

const displayAnomalies = computed(() => {
  if (showAllAnomalies.value) return props.anomalies;
  return props.anomalies.slice(0, 5);
});

const sonarCount = computed(() => props.trajectory.filter(t => t.event === 'sonar').length);
const collectCount = computed(() => props.trajectory.filter(t => t.event === 'collect').length);
const damageCount = computed(() => props.trajectory.filter(t => t.event === 'damage').length);

const creatureCount = computed(() => {
  return props.scoreBreakdown.items.filter(i => i.category === 'creature').reduce((s, i) => s + i.count, 0);
});
const creaturePts = computed(() => props.scoreBreakdown.fromCreatures);
const wreckCount = computed(() => {
  return props.scoreBreakdown.items.filter(i => i.category === 'wreck').reduce((s, i) => s + i.count, 0);
});
const wreckPts = computed(() => props.scoreBreakdown.fromWrecks);
const dangerCount = computed(() => {
  return props.scoreBreakdown.items.filter(i => i.category === 'danger').reduce((s, i) => s + i.count, 0);
});
const dangerPts = computed(() => props.scoreBreakdown.fromDanger);

const maxCount = computed(() => Math.max(creatureCount.value, wreckCount.value, dangerCount.value, 1));
const creaturePct = computed(() => (creatureCount.value / maxCount.value) * 100);
const wreckPct = computed(() => (wreckCount.value / maxCount.value) * 100);
const dangerPct = computed(() => (dangerCount.value / maxCount.value) * 100);

const discoveryRate = computed(() => Math.round(props.hitRate.discoveryRate * 100));
const collectionRate = computed(() => Math.round(props.hitRate.collectionRate * 100));
const tapAccuracy = computed(() => Math.round(props.hitRate.tapAccuracy * 100));

const criticalCount = computed(() => props.anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length);
const mediumCount = computed(() => props.anomalies.filter(a => a.severity === 'medium').length);
const lowCount = computed(() => props.anomalies.filter(a => a.severity === 'low').length);

const rewardItems = computed(() => {
  return props.scoreBreakdown.items.filter(i => i.count > 0).slice(0, 10);
});

const anomalyTypeLabel = (type: AnomalyEventType): string => {
  const map: Record<AnomalyEventType, string> = {
    danger_hit: '危险碰撞',
    sonar_empty: '空放声呐',
    target_missed: '目标遗漏',
    false_report: '误报',
    path_offtrack: '偏航',
    high_risk_enter: '高危入侵',
    blocker_collision: '阻断碰撞',
    yaw_warning: '偏航警告',
    yaw_failure: '偏航超限',
  };
  return map[type] || type;
};

const sevLabel = (sev: string): string => {
  const map: Record<string, string> = { low: '轻微', medium: '中等', high: '高危', critical: '致命' };
  return map[sev] || sev;
};

const catLabel = (cat: string): string => {
  const map: Record<string, string> = { creature: '生物', wreck: '残骸', danger: '危险', bonus: '奖励', level_up: '升级', combo: '连击', rescue: '救援', path_bonus: '路径' };
  return map[cat] || cat;
};

const fmt = (n: number) => (n >= 0 ? '+' : '') + n.toLocaleString();

const toggleReplay = () => {
  if (isReplaying.value) {
    stopReplay();
  } else {
    startReplay();
  }
};

const cycleSpeed = () => {
  const speeds = [1, 2, 4, 8];
  const idx = speeds.indexOf(replaySpeed.value);
  replaySpeed.value = speeds[(idx + 1) % speeds.length];
  if (isReplaying.value) {
    stopReplay();
    startReplay();
  }
};

const startReplay = () => {
  if (props.trajectory.length <= 1) return;
  isReplaying.value = true;
  if (replayIndex.value >= props.trajectory.length - 1) {
    replayIndex.value = 0;
  }
  const interval = Math.max(16, Math.round(150 / replaySpeed.value));
  replayTimer = setInterval(() => {
    if (replayIndex.value < props.trajectory.length - 1) {
      replayIndex.value++;
    } else {
      stopReplay();
    }
  }, interval);
};

const stopReplay = () => {
  isReplaying.value = false;
  if (replayTimer) {
    clearInterval(replayTimer);
    replayTimer = null;
  }
};

const drawMap = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#000a14';
  ctx.fillRect(0, 0, w, h);

  const scaleX = (x: number) => (x / MAP_W) * w;
  const scaleY = (y: number) => (y / MAP_H) * h;

  ctx.strokeStyle = 'rgba(0, 51, 68, 0.4)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 8; i++) {
    const x = (i / 8) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let i = 0; i <= 12; i++) {
    const y = (i / 12) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const traj = props.trajectory;
  const endIdx = isReplaying.value ? replayIndex.value : traj.length - 1;

  if (traj.length > 1) {
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(scaleX(traj[0].position.x), scaleY(traj[0].position.y));
    for (let i = 1; i <= endIdx && i < traj.length; i++) {
      ctx.lineTo(scaleX(traj[i].position.x), scaleY(traj[i].position.y));
    }
    ctx.stroke();
  }

  for (let i = 0; i <= endIdx && i < traj.length; i++) {
    const p = traj[i];
    const x = scaleX(p.position.x);
    const y = scaleY(p.position.y);

    if (p.event === 'sonar') {
      ctx.fillStyle = 'rgba(0, 255, 170, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.event === 'collect') {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.event === 'damage') {
      ctx.fillStyle = 'rgba(255, 51, 85, 0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 51, 85, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (endIdx >= 0 && endIdx < traj.length) {
    const cur = traj[endIdx];
    const cx = scaleX(cur.position.x);
    const cy = scaleY(cur.position.y);
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
};

watch(replayIndex, () => {
  nextTick(drawMap);
});

onMounted(() => {
  nextTick(drawMap);
});

onUnmounted(() => {
  stopReplay();
});
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(0, 20, 40, 0.96) 0%, rgba(0, 5, 15, 0.99) 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(6px);
  animation: vs-fade-in 0.4s ease;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

@keyframes vs-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.overlay-content {
  text-align: center;
  padding: 24px 20px 40px;
  max-width: 380px;
  width: 100%;
  animation: vs-slide-up 0.5s ease;
}

@keyframes vs-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.vs-header {
  margin-bottom: 20px;
}

.vs-title {
  font-size: 26px;
  font-weight: bold;
  background: linear-gradient(135deg, #00ffcc 0%, #00aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
}

.vs-subtitle {
  font-size: 10px;
  color: rgba(0, 255, 200, 0.4);
  letter-spacing: 4px;
  margin-top: 4px;
  text-transform: uppercase;
}

.vs-section {
  margin-bottom: 16px;
  background: rgba(0, 30, 50, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 12px;
  padding: 14px;
  text-align: left;
}

.vs-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.9);
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.vs-section-icon {
  font-size: 16px;
}

.path-map {
  position: relative;
  width: 100%;
  aspect-ratio: 800 / 1200;
  max-height: 240px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.path-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.path-legend {
  position: absolute;
  bottom: 6px;
  left: 6px;
  display: flex;
  gap: 8px;
  background: rgba(0, 10, 20, 0.8);
  border-radius: 6px;
  padding: 4px 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  color: rgba(200, 240, 255, 0.7);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.sonar { background: rgba(0, 255, 170, 0.6); }
.dot.collect { background: rgba(0, 229, 255, 0.8); }
.dot.damage { background: rgba(255, 51, 85, 0.9); }
.dot.move { background: rgba(0, 255, 136, 0.3); }

.path-stats {
  display: flex;
  gap: 8px;
}

.ps-item {
  flex: 1;
  text-align: center;
  padding: 6px 4px;
  background: rgba(0, 20, 35, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(0, 255, 170, 0.1);
}

.ps-val {
  font-size: 16px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.ps-lbl {
  font-size: 9px;
  color: rgba(200, 220, 255, 0.5);
  letter-spacing: 1px;
  margin-top: 2px;
}

.comp-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.comp-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comp-label {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 80px;
  flex-shrink: 0;
  font-size: 11px;
  color: rgba(200, 240, 255, 0.75);
}

.comp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comp-dot.creature { background: #00e5ff; box-shadow: 0 0 4px rgba(0, 229, 255, 0.5); }
.comp-dot.wreck { background: #ffcc00; box-shadow: 0 0 4px rgba(255, 204, 0, 0.5); }
.comp-dot.danger { background: #ff3355; box-shadow: 0 0 4px rgba(255, 51, 85, 0.5); }

.comp-bar-wrap {
  flex: 1;
  height: 8px;
  background: rgba(0, 30, 50, 0.6);
  border-radius: 4px;
  overflow: hidden;
}

.comp-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.comp-bar.creature { background: linear-gradient(90deg, #00e5ff, #00aaff); }
.comp-bar.wreck { background: linear-gradient(90deg, #ffcc00, #ff9900); }
.comp-bar.danger { background: linear-gradient(90deg, #ff3355, #cc0033); }

.comp-val {
  font-size: 11px;
  color: rgba(200, 220, 255, 0.7);
  width: 70px;
  text-align: right;
  flex-shrink: 0;
  font-family: 'Courier New', monospace;
}

.comp-val small {
  color: rgba(200, 220, 255, 0.45);
  font-size: 9px;
}

.comp-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 255, 170, 0.1);
  font-size: 11px;
  color: rgba(200, 220, 255, 0.55);
}

.comp-summary b {
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.mistake-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.mistake-item {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(0, 20, 35, 0.4);
  border-left: 3px solid transparent;
}

.mistake-item.low { border-left-color: rgba(0, 255, 170, 0.4); }
.mistake-item.medium { border-left-color: rgba(255, 204, 0, 0.6); }
.mistake-item.high { border-left-color: rgba(255, 100, 50, 0.8); }
.mistake-item.critical { border-left-color: rgba(255, 51, 85, 0.9); }

.mistake-idx {
  font-size: 12px;
  font-weight: bold;
  color: rgba(200, 220, 255, 0.3);
  font-family: 'Courier New', monospace;
  width: 20px;
  flex-shrink: 0;
  text-align: center;
  padding-top: 1px;
}

.mistake-body {
  flex: 1;
  min-width: 0;
}

.mistake-desc {
  font-size: 12px;
  color: rgba(200, 240, 255, 0.8);
  margin-bottom: 3px;
}

.mistake-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mistake-type {
  font-size: 10px;
  color: rgba(200, 220, 255, 0.45);
  letter-spacing: 1px;
}

.mistake-sev {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: bold;
  letter-spacing: 1px;
}

.mistake-sev.low { background: rgba(0, 255, 170, 0.15); color: rgba(0, 255, 170, 0.7); }
.mistake-sev.medium { background: rgba(255, 204, 0, 0.15); color: rgba(255, 204, 0, 0.8); }
.mistake-sev.high { background: rgba(255, 100, 50, 0.2); color: rgba(255, 130, 80, 0.9); }
.mistake-sev.critical { background: rgba(255, 51, 85, 0.2); color: rgba(255, 100, 120, 0.95); }

.mistake-more {
  text-align: center;
  font-size: 11px;
  color: rgba(0, 255, 200, 0.6);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}

.mistake-more:hover {
  color: rgba(0, 255, 200, 0.9);
  background: rgba(0, 255, 170, 0.08);
}

.mistake-empty {
  text-align: center;
  padding: 16px;
  font-size: 13px;
  color: rgba(0, 255, 200, 0.7);
}

.mistake-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 255, 170, 0.1);
  font-size: 11px;
  color: rgba(200, 220, 255, 0.5);
}

.mistake-summary b { font-family: 'Courier New', monospace; }
.mistake-summary b.critical { color: #ff6677; }
.mistake-summary b.medium { color: #ffcc66; }
.mistake-summary b.low { color: rgba(0, 255, 200, 0.7); }

.reward-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
  max-height: 180px;
  overflow-y: auto;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(0, 20, 35, 0.3);
  font-size: 11px;
}

.reward-cat {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 50px;
  flex-shrink: 0;
  color: rgba(200, 220, 255, 0.6);
  font-size: 10px;
}

.reward-cat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.reward-cat-dot.creature { background: #00e5ff; }
.reward-cat-dot.wreck { background: #ffcc00; }
.reward-cat-dot.danger { background: #ff3355; }
.reward-cat-dot.bonus { background: #00ffcc; }
.reward-cat-dot.level_up { background: #88ff88; }
.reward-cat-dot.combo { background: #ff88ff; }
.reward-cat-dot.rescue { background: #88ccff; }
.reward-cat-dot.path_bonus { background: #88ffaa; }

.reward-name {
  flex: 1;
  color: rgba(200, 240, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reward-count {
  color: rgba(200, 220, 255, 0.45);
  font-family: 'Courier New', monospace;
  font-size: 10px;
}

.reward-pts {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #00ffcc;
  font-size: 11px;
  width: 60px;
  text-align: right;
  flex-shrink: 0;
}

.reward-pts.negative {
  color: #ff4466;
}

.reward-empty {
  text-align: center;
  padding: 12px;
  font-size: 12px;
  color: rgba(200, 220, 255, 0.4);
}

.reward-total {
  border-top: 1px solid rgba(0, 255, 170, 0.15);
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: rgba(200, 220, 255, 0.5);
}

.rt-row.total {
  padding-top: 6px;
  margin-top: 4px;
  border-top: 1px solid rgba(0, 255, 170, 0.2);
  font-weight: bold;
  color: rgba(200, 240, 255, 0.8);
  font-size: 12px;
}

.rt-val {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 11px;
}

.rt-val.creature { color: rgba(0, 229, 255, 0.8); }
.rt-val.wreck { color: rgba(255, 204, 0, 0.8); }
.rt-val.danger { color: rgba(255, 51, 85, 0.8); }
.rt-val.combo { color: rgba(255, 136, 255, 0.8); }
.rt-val.level { color: rgba(136, 255, 136, 0.8); }
.rt-val.bonus { color: rgba(0, 255, 200, 0.7); }
.rt-val.total-val { color: #00ffcc; font-size: 14px; text-shadow: 0 0 8px rgba(0, 255, 200, 0.4); }

.vs-replay-section {
  margin-bottom: 16px;
  background: rgba(0, 30, 50, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 12px;
  padding: 14px;
}

.replay-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.replay-btn {
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba(0, 100, 150, 0.6), rgba(0, 50, 100, 0.7));
  border: 1px solid rgba(0, 255, 170, 0.35);
  border-radius: 8px;
  color: rgba(0, 255, 200, 0.9);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.replay-btn:hover {
  background: linear-gradient(135deg, rgba(0, 120, 170, 0.6), rgba(0, 70, 120, 0.7));
  border-color: rgba(0, 255, 170, 0.6);
}

.replay-btn.playing {
  background: linear-gradient(135deg, rgba(255, 100, 50, 0.2), rgba(200, 60, 20, 0.2));
  border-color: rgba(255, 150, 100, 0.4);
  color: rgba(255, 180, 140, 0.9);
}

.replay-btn.speed {
  padding: 8px 10px;
  min-width: 48px;
  font-family: 'Courier New', monospace;
}

.replay-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.replay-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 50, 70, 0.6);
  border-radius: 2px;
  outline: none;
}

.replay-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #00ffcc;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(0, 255, 200, 0.5);
}

.replay-step {
  font-size: 9px;
  color: rgba(200, 220, 255, 0.45);
  font-family: 'Courier New', monospace;
}

.continue-btn {
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
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 255, 200, 0.4);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(0, 255, 200, 0.6);
}

.continue-btn:active {
  transform: translateY(0);
}

.btn-arrow {
  font-size: 20px;
}
</style>
