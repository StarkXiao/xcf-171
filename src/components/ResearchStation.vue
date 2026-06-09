<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="header">
        <button class="back-btn" @click="$emit('close')">
          <span class="back-icon">‹</span>
        </button>
        <div class="title-wrap">
          <div class="title">研究站升级</div>
          <div class="subtitle">Research Station</div>
        </div>
        <div class="points-display">
          <span class="points-icon">⚡</span>
          <span class="points-value">{{ stats.expeditionPoints }}</span>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-chip">
          <span class="chip-label">航次</span>
          <span class="chip-value">{{ stats.expeditionsCompleted }}</span>
        </div>
        <div class="stat-chip">
          <span class="chip-label">累计积分</span>
          <span class="chip-value">{{ stats.totalExpeditionPoints }}</span>
        </div>
        <div class="stat-chip">
          <span class="chip-label">科技</span>
          <span class="chip-value">{{ stats.unlockedCount }}/{{ stats.totalTechCount }}</span>
        </div>
      </div>

      <div class="category-tabs">
        <button
          v-for="(info, cat) in TECH_CATEGORY_INFO"
          :key="cat"
          class="tab-btn"
          :class="{ active: activeCategory === cat }"
          :style="{ '--tab-color': info.color }"
          @click="activeCategory = cat as TechCategory"
        >
          <span class="tab-icon">{{ info.icon }}</span>
          <span class="tab-label">{{ info.name }}</span>
          <span class="tab-progress">
            {{ stats.categoryProgress[cat as TechCategory].unlocked }}/{{ stats.categoryProgress[cat as TechCategory].total }}
          </span>
        </button>
      </div>

      <div class="tech-tree">
        <div
          v-for="tech in currentCategoryTech"
          :key="tech.id"
          class="tech-node"
          :class="{
            unlocked: isUnlocked(tech.id),
            available: canUnlock(tech.id),
            locked: !isUnlocked(tech.id) && !canUnlock(tech.id)
          }"
        >
          <div class="tech-icon">{{ tech.icon }}</div>
          <div class="tech-info">
            <div class="tech-name">{{ tech.name }}</div>
            <div class="tech-desc">{{ tech.description }}</div>
            <div class="tech-tier">T{{ tech.tier }}</div>
          </div>
          <div class="tech-action">
            <button
              v-if="isUnlocked(tech.id)"
              class="tech-btn unlocked-btn"
              disabled
            >
              ✓ 已解锁
            </button>
            <button
              v-else-if="canUnlock(tech.id)"
              class="tech-btn available-btn"
              @click="handleUnlock(tech.id)"
            >
              <span class="cost-icon">⚡</span>
              <span>{{ tech.cost }}</span>
            </button>
            <div v-else class="tech-btn locked-btn">
              <span v-if="getLockReason(tech.id)" class="lock-reason">{{ getLockReason(tech.id) }}</span>
              <span v-else class="cost-icon">⚡</span>
              <span v-if="!getLockReason(tech.id)">{{ tech.cost }}</span>
            </div>
          </div>
          <div v-if="tech.requires.length > 0" class="tech-requires">
            <span class="req-label">前置：</span>
            <span v-for="(reqId, idx) in tech.requires" :key="reqId" class="req-item">
              {{ getTechName(reqId) }}<span v-if="idx < tech.requires.length - 1">，</span>
            </span>
          </div>
        </div>
      </div>

      <button class="reset-btn" @click="handleReset">
        <span class="reset-icon">♻️</span>
        <span>重置研究进度</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ResearchStationStats, TechCategory, TechNode } from '../types/game';
import { TECH_TREE, TECH_CATEGORY_INFO, getTechById, getTechByCategory } from '../config/researchStation';
import { ResearchStationSystem } from '../game/ResearchStationSystem';

const props = defineProps<{
  stats: ResearchStationStats;
  system: ResearchStationSystem;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'unlock', techId: string): void;
  (e: 'reset'): void;
  (e: 'update'): void;
}>();

const activeCategory = ref<TechCategory>('sonar');

const currentCategoryTech = computed((): TechNode[] => {
  return getTechByCategory(activeCategory.value);
});

function isUnlocked(techId: string): boolean {
  return props.system.isTechUnlocked(techId);
}

function canUnlock(techId: string): boolean {
  return props.system.canUnlockTech(techId).canUnlock;
}

function getLockReason(techId: string): string | undefined {
  const result = props.system.canUnlockTech(techId);
  return result.canUnlock ? undefined : result.reason;
}

function getTechName(techId: string): string {
  const tech = getTechById(techId);
  return tech?.name ?? techId;
}

function handleUnlock(techId: string) {
  if (props.system.unlockTech(techId)) {
    emit('unlock', techId);
    emit('update');
  }
}

function handleReset() {
  if (confirm('确定要重置所有研究进度吗？此操作不可撤销。')) {
    props.system.resetAll();
    emit('reset');
    emit('update');
  }
}
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(0, 15, 30, 0.97) 0%, rgba(0, 5, 15, 0.99) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(6px);
}

.overlay-content {
  padding: 16px 18px;
  max-width: 400px;
  width: 100%;
  max-height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  width: 36px;
  height: 36px;
  background: rgba(0, 50, 80, 0.6);
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  color: rgba(0, 255, 200, 0.9);
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(0, 80, 120, 0.6);
  border-color: rgba(0, 255, 170, 0.5);
}

.back-icon {
  line-height: 1;
  margin-top: -2px;
}

.title-wrap {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(135deg, #00ffcc 0%, #00aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 3px;
}

.subtitle {
  font-size: 10px;
  color: rgba(0, 255, 200, 0.4);
  letter-spacing: 4px;
  margin-top: 2px;
  text-transform: uppercase;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.15), rgba(255, 136, 0, 0.15));
  border: 1px solid rgba(255, 204, 0, 0.4);
  border-radius: 20px;
  flex-shrink: 0;
}

.points-icon {
  font-size: 14px;
}

.points-value {
  font-size: 16px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
}

.stats-row {
  display: flex;
  gap: 8px;
}

.stat-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  background: rgba(0, 40, 60, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 10px;
}

.chip-label {
  font-size: 10px;
  color: rgba(200, 220, 255, 0.5);
  letter-spacing: 1px;
}

.chip-value {
  font-size: 15px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
}

.category-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tab-btn {
  flex: 1;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  background: rgba(0, 30, 50, 0.6);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(200, 220, 255, 0.7);
}

.tab-btn:hover {
  background: rgba(0, 50, 80, 0.6);
  border-color: rgba(0, 255, 170, 0.4);
}

.tab-btn.active {
  background: rgba(0, 60, 100, 0.7);
  border-color: var(--tab-color);
  color: #fff;
  box-shadow: 0 0 12px color-mix(in srgb, var(--tab-color) 30%, transparent);
}

.tab-icon {
  font-size: 18px;
}

.tab-label {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
}

.tab-progress {
  font-size: 10px;
  font-family: 'Courier New', monospace;
  opacity: 0.7;
}

.tech-tree {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tech-node {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 30, 50, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 12px;
  transition: all 0.25s;
}

.tech-node.unlocked {
  background: linear-gradient(135deg, rgba(0, 80, 60, 0.4), rgba(0, 50, 80, 0.4));
  border-color: rgba(0, 255, 136, 0.5);
}

.tech-node.available {
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.08), rgba(255, 136, 0, 0.08));
  border-color: rgba(255, 204, 0, 0.4);
  animation: pulse-available 2s ease-in-out infinite;
}

@keyframes pulse-available {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 204, 0, 0); }
  50% { box-shadow: 0 0 16px rgba(255, 204, 0, 0.15); }
}

.tech-node.locked {
  opacity: 0.55;
}

.tech-icon {
  font-size: 28px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 50, 80, 0.6);
  border-radius: 10px;
  flex-shrink: 0;
}

.tech-info {
  flex: 1;
  min-width: 0;
}

.tech-name {
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 1px;
}

.tech-desc {
  font-size: 11px;
  color: rgba(200, 220, 255, 0.65);
  margin-top: 2px;
}

.tech-tier {
  display: inline-block;
  font-size: 10px;
  padding: 1px 8px;
  background: rgba(0, 255, 200, 0.15);
  color: rgba(0, 255, 200, 0.8);
  border-radius: 10px;
  margin-top: 4px;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.tech-action {
  flex-shrink: 0;
}

.tech-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
  justify-content: center;
}

.unlocked-btn {
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.25), rgba(0, 204, 102, 0.25));
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.4);
  cursor: default;
}

.available-btn {
  background: linear-gradient(135deg, #ffcc00, #ff9900);
  color: #2a1800;
  box-shadow: 0 2px 12px rgba(255, 204, 0, 0.3);
}

.available-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(255, 204, 0, 0.5);
}

.available-btn:active {
  transform: translateY(0);
}

.locked-btn {
  background: rgba(60, 60, 80, 0.5);
  color: rgba(200, 200, 220, 0.5);
  border: 1px solid rgba(100, 100, 120, 0.3);
  cursor: not-allowed;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  min-width: 90px;
}

.cost-icon {
  font-size: 12px;
}

.lock-reason {
  font-size: 9px;
  text-align: center;
  line-height: 1.2;
  max-width: 100px;
}

.tech-requires {
  width: 100%;
  font-size: 10px;
  color: rgba(200, 200, 220, 0.4);
  padding-top: 6px;
  border-top: 1px solid rgba(0, 255, 170, 0.1);
}

.req-label {
  opacity: 0.6;
}

.req-item {
  color: rgba(0, 255, 200, 0.5);
}

.reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 10px;
  color: rgba(255, 120, 120, 0.7);
  font-size: 12px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: rgba(255, 100, 100, 0.1);
  border-color: rgba(255, 100, 100, 0.5);
  color: rgba(255, 120, 120, 0.9);
}

.reset-icon {
  font-size: 14px;
}
</style>
