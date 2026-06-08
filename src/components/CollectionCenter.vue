<template>
  <div class="overlay">
    <div class="panel">
      <div class="panel-header">
        <button class="back-btn" @click="$emit('close')">
          <span class="back-icon">←</span>
          <span>返回</span>
        </button>
        <div class="header-title">
          <div class="title-main">深海图鉴中心</div>
          <div class="title-sub">DEEP SEA ARCHIVE</div>
        </div>
        <div class="header-spacer"></div>
      </div>

      <div class="stats-bar">
        <div class="stat-card overall">
          <div class="stat-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(0,255,170,0.15)" stroke-width="3"/>
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="url(#gradOverall)" stroke-width="3" stroke-linecap="round"
                :stroke-dasharray="`${overallPercent}, 100`"
                transform="rotate(-90 18 18)"
              />
              <defs>
                <linearGradient id="gradOverall" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#00ffcc"/>
                  <stop offset="100%" stop-color="#00aaff"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="stat-ring-text">
              <span class="ring-value">{{ stats.unlocked }}</span>
              <span class="ring-total">/{{ stats.total }}</span>
            </div>
          </div>
          <div class="stat-info">
            <div class="stat-label">总完成度</div>
            <div class="stat-percent">{{ overallPercent }}%</div>
          </div>
        </div>

        <div class="stat-mini-row">
          <div class="stat-mini creature">
            <span class="mini-dot"></span>
            <span class="mini-label">生物</span>
            <span class="mini-count">{{ stats.creatures.unlocked }}/{{ stats.creatures.total }}</span>
          </div>
          <div class="stat-mini wreck">
            <span class="mini-dot"></span>
            <span class="mini-label">残骸</span>
            <span class="mini-count">{{ stats.wrecks.unlocked }}/{{ stats.wrecks.total }}</span>
          </div>
          <div class="stat-mini danger">
            <span class="mini-dot"></span>
            <span class="mini-label">危险物</span>
            <span class="mini-count">{{ stats.dangers.unlocked }}/{{ stats.dangers.total }}</span>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.type"
          class="tab-btn"
          :class="{ active: activeTab === tab.type }"
          @click="activeTab = tab.type"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
          <span class="tab-badge">{{ getTabCount(tab.type) }}</span>
        </button>
      </div>

      <div class="entries-grid">
        <div
          v-for="entry in currentEntries"
          :key="entry.name"
          class="entry-card"
          :class="{ unlocked: entry.unlocked, [entry.type]: true }"
        >
          <div class="entry-icon-wrap">
            <div v-if="entry.unlocked" class="entry-icon">
              {{ getEntryIcon(entry) }}
            </div>
            <div v-else class="entry-icon locked">
              <span class="lock-icon">?</span>
            </div>
          </div>
          <div class="entry-info">
            <div class="entry-name">
              {{ entry.unlocked ? entry.name : '???' }}
            </div>
            <div class="entry-meta">
              <div v-if="entry.unlocked" class="meta-row">
                <span class="meta-label">发现次数</span>
                <span class="meta-value">{{ entry.discoveryCount }}</span>
              </div>
              <div v-if="entry.unlocked && entry.firstDiscoveredAt" class="meta-row">
                <span class="meta-label">首次坐标</span>
                <span class="meta-value mono">
                  ({{ Math.round(entry.firstDiscoveredAt.x) }}, {{ Math.round(entry.firstDiscoveredAt.y) }})
                </span>
              </div>
              <div v-if="entry.unlocked" class="meta-row">
                <span class="meta-label">首次关卡</span>
                <span class="meta-value">Lv.{{ entry.firstDiscoveredLevel }}</span>
              </div>
              <div v-if="entry.unlocked" class="meta-row best">
                <span class="meta-label">最佳得分</span>
                <span class="meta-value">{{ entry.bestScore > 0 ? '+' : '' }}{{ entry.bestScore }}</span>
              </div>
              <div v-if="!entry.unlocked" class="meta-row locked-hint">
                <span>在游戏中探索以解锁</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button class="reset-btn" @click="handleReset" v-if="stats.unlocked > 0">
          <span>🔄 重置所有图鉴</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TargetType, CollectionEntry, CollectionData } from '../types/game';

const props = defineProps<{
  collectionData: CollectionData;
  stats: {
    total: number;
    unlocked: number;
    totalDiscoveries: number;
    creatures: { total: number; unlocked: number };
    wrecks: { total: number; unlocked: number };
    dangers: { total: number; unlocked: number };
  };
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'reset'): void;
}>();

type TabType = TargetType;

const tabs: Array<{ type: TabType; label: string; icon: string }> = [
  { type: 'creature', label: '海洋生物', icon: '🐟' },
  { type: 'wreck', label: '残骸遗迹', icon: '⚓' },
  { type: 'danger', label: '危险物体', icon: '⚠️' },
];

const activeTab = ref<TabType>('creature');

const overallPercent = computed(() => {
  if (props.stats.total === 0) return 0;
  return Math.round((props.stats.unlocked / props.stats.total) * 100);
});

const currentEntries = computed<CollectionEntry[]>(() => {
  const map: Record<TabType, Record<string, CollectionEntry>> = {
    creature: props.collectionData.creatures,
    wreck: props.collectionData.wrecks,
    danger: props.collectionData.dangers,
  };
  return Object.values(map[activeTab.value]).sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
});

const getTabCount = (type: TabType) => {
  const map = {
    creature: props.stats.creatures,
    wreck: props.stats.wrecks,
    danger: props.stats.dangers,
  };
  return `${map[type].unlocked}/${map[type].total}`;
};

const getEntryIcon = (entry: CollectionEntry): string => {
  if (entry.type === 'creature') {
    const icons: Record<string, string> = {
      '深海灯笼鱼': '🐠',
      '巨型章鱼': '🐙',
      '透明水母': '🎐',
      '深海剑鱼': '🗡️',
      '发光乌贼': '🦑',
      '珊瑚虫群': '🪸',
      '海天使': '👼',
      '吞噬鳗': '🐍',
    };
    return icons[entry.name] || '🐟';
  }
  if (entry.type === 'wreck') {
    const icons: Record<string, string> = {
      '古代沉船': '⛵',
      '飞机残骸': '✈️',
      '海底遗迹': '🏛️',
      '废弃潜艇': '🚢',
      '货物集装箱': '📦',
    };
    return icons[entry.name] || '⚓';
  }
  if (entry.type === 'danger') {
    const icons: Record<string, string> = {
      '危险水雷': '💣',
      '深海漩涡': '🌀',
      '毒刺水母群': '☠️',
      '海底火山口': '🌋',
      '高压电流区': '⚡',
    };
    return icons[entry.name] || '⚠️';
  }
  return '❓';
};

const handleReset = () => {
  if (confirm('确定要重置所有图鉴记录吗？此操作不可撤销。')) {
    emit('reset');
  }
};
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(0, 15, 35, 0.97) 0%, rgba(0, 5, 15, 0.99) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(8px);
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.panel {
  width: 100%;
  height: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  padding: 16px;
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

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(0, 40, 60, 0.6);
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 8px;
  color: rgba(0, 255, 200, 0.9);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(0, 255, 170, 0.15);
  border-color: rgba(0, 255, 170, 0.5);
}

.back-icon {
  font-size: 16px;
  font-weight: bold;
}

.header-title {
  text-align: center;
}

.title-main {
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(135deg, #00ffcc 0%, #00aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
}

.title-sub {
  font-size: 9px;
  color: rgba(0, 255, 200, 0.4);
  letter-spacing: 4px;
  margin-top: 2px;
  text-transform: uppercase;
}

.header-spacer {
  width: 72px;
}

.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card.overall {
  flex: 1;
  background: linear-gradient(135deg, rgba(0, 50, 80, 0.7), rgba(0, 25, 45, 0.8));
  border: 1px solid rgba(0, 255, 170, 0.25);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-ring {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.stat-ring svg {
  width: 100%;
  height: 100%;
}

.stat-ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.ring-value {
  font-size: 18px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.ring-total {
  font-size: 11px;
  color: rgba(0, 255, 200, 0.5);
  font-family: 'Courier New', monospace;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: rgba(200, 220, 255, 0.5);
  letter-spacing: 1px;
}

.stat-percent {
  font-size: 22px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(0, 255, 200, 0.4);
}

.stat-mini-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 0 0 auto;
}

.stat-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(0, 40, 60, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 8px;
  min-width: 120px;
}

.mini-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stat-mini.creature .mini-dot {
  background: #00e5ff;
  box-shadow: 0 0 6px rgba(0, 229, 255, 0.6);
}

.stat-mini.wreck .mini-dot {
  background: #ffcc00;
  box-shadow: 0 0 6px rgba(255, 204, 0, 0.6);
}

.stat-mini.danger .mini-dot {
  background: #ff3355;
  box-shadow: 0 0 6px rgba(255, 51, 85, 0.6);
}

.mini-label {
  font-size: 11px;
  color: rgba(200, 220, 255, 0.7);
}

.mini-count {
  margin-left: auto;
  font-size: 11px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: rgba(255, 255, 255, 0.85);
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  background: rgba(0, 40, 60, 0.4);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 10px;
  color: rgba(200, 220, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  background: rgba(0, 255, 170, 0.08);
  color: rgba(200, 240, 255, 0.85);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(0, 255, 200, 0.15), rgba(0, 170, 255, 0.15));
  border-color: rgba(0, 255, 170, 0.5);
  color: #00ffcc;
  box-shadow: 0 0 15px rgba(0, 255, 200, 0.15);
}

.tab-icon {
  font-size: 14px;
}

.tab-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  padding: 1px 6px;
  background: rgba(0, 40, 60, 0.95);
  border: 1px solid rgba(0, 255, 170, 0.4);
  border-radius: 10px;
  font-size: 9px;
  font-family: 'Courier New', monospace;
  color: rgba(0, 255, 200, 0.9);
}

.tab-btn.active .tab-badge {
  background: rgba(0, 255, 170, 0.2);
}

.entries-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding-right: 4px;
}

.entries-grid::-webkit-scrollbar {
  width: 4px;
}

.entries-grid::-webkit-scrollbar-track {
  background: rgba(0, 50, 70, 0.3);
  border-radius: 2px;
}

.entries-grid::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 170, 0.3);
  border-radius: 2px;
}

.entry-card {
  background: linear-gradient(135deg, rgba(0, 35, 55, 0.6), rgba(0, 20, 35, 0.8));
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
  opacity: 0.55;
}

.entry-card.unlocked {
  opacity: 1;
}

.entry-card.creature.unlocked {
  border-color: rgba(0, 229, 255, 0.35);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.08);
}

.entry-card.wreck.unlocked {
  border-color: rgba(255, 204, 0, 0.35);
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.08);
}

.entry-card.danger.unlocked {
  border-color: rgba(255, 51, 85, 0.35);
  box-shadow: 0 0 12px rgba(255, 51, 85, 0.08);
}

.entry-icon-wrap {
  display: flex;
  justify-content: center;
}

.entry-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 170, 0.12) 0%, transparent 70%);
}

.entry-card.creature.unlocked .entry-icon {
  background: radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, transparent 70%);
}

.entry-card.wreck.unlocked .entry-icon {
  background: radial-gradient(circle, rgba(255, 204, 0, 0.2) 0%, transparent 70%);
}

.entry-card.danger.unlocked .entry-icon {
  background: radial-gradient(circle, rgba(255, 51, 85, 0.2) 0%, transparent 70%);
}

.entry-icon.locked {
  background: rgba(0, 30, 50, 0.6);
  border: 1px dashed rgba(0, 255, 170, 0.2);
}

.lock-icon {
  font-size: 24px;
  color: rgba(200, 220, 255, 0.3);
  font-weight: bold;
}

.entry-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}

.entry-name {
  font-size: 13px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

.entry-card:not(.unlocked) .entry-name {
  color: rgba(200, 220, 255, 0.35);
}

.entry-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  padding: 2px 0;
}

.meta-label {
  color: rgba(200, 220, 255, 0.45);
}

.meta-value {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.meta-value.mono {
  font-family: 'Courier New', monospace;
  font-size: 10px;
}

.meta-row.best .meta-value {
  color: #ffcc00;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.locked-hint {
  justify-content: center;
  font-size: 10px;
  color: rgba(200, 220, 255, 0.3);
  font-style: italic;
  padding-top: 4px;
}

.panel-footer {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.reset-btn {
  padding: 8px 20px;
  background: transparent;
  border: 1px solid rgba(255, 68, 102, 0.3);
  border-radius: 8px;
  color: rgba(255, 100, 120, 0.7);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: rgba(255, 68, 102, 0.1);
  border-color: rgba(255, 68, 102, 0.5);
  color: rgba(255, 100, 120, 0.9);
}
</style>
