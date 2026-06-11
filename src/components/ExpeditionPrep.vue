<template>
  <div class="prep-overlay">
    <div class="prep-container">
      <div class="prep-header">
        <button class="back-btn" @click="$emit('back')">
          <span class="back-arrow">‹</span>
          <span>返回</span>
        </button>
        <h2 class="prep-title">远征筹备</h2>
        <div class="prep-subtitle">配置装备，规划你的深海探索</div>
      </div>

      <div class="prep-sections">
        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">🛳️</span>
            <span class="section-name">潜航器</span>
          </div>
          <div class="equipment-list">
            <div
              v-for="sub in submarines"
              :key="sub.id"
              class="equipment-item"
              :class="{ active: loadout.submarine === sub.id }"
              @click="selectSubmarine(sub.id)"
            >
              <div class="eq-icon">{{ sub.icon }}</div>
              <div class="eq-info">
                <div class="eq-name">{{ sub.name }}</div>
                <div class="eq-desc">{{ sub.description }}</div>
                <div class="eq-stats">
                  <span class="stat" :class="{ good: sub.stats.mapHeightMul > 1, bad: sub.stats.mapHeightMul < 1 }">
                    地图范围 {{ formatPct(sub.stats.mapHeightMul) }}
                  </span>
                  <span v-if="sub.stats.livesBonus !== 0" class="stat good">
                    生命 +{{ sub.stats.livesBonus }}
                  </span>
                </div>
              </div>
              <div class="eq-check" v-if="loadout.submarine === sub.id">✓</div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">📡</span>
            <span class="section-name">声呐芯片</span>
          </div>
          <div class="equipment-list">
            <div
              v-for="chip in sonarChips"
              :key="chip.id"
              class="equipment-item"
              :class="{ active: loadout.sonarChip === chip.id }"
              @click="selectSonarChip(chip.id)"
            >
              <div class="eq-icon">{{ chip.icon }}</div>
              <div class="eq-info">
                <div class="eq-name">{{ chip.name }}</div>
                <div class="eq-desc">{{ chip.description }}</div>
                <div class="eq-stats">
                  <span class="stat" :class="{ good: chip.stats.sonarRadiusMul > 1, bad: chip.stats.sonarRadiusMul < 1 }">
                    探测范围 {{ formatPct(chip.stats.sonarRadiusMul) }}
                  </span>
                  <span class="stat" :class="{ good: chip.stats.sonarSpeedMul > 1, bad: chip.stats.sonarSpeedMul < 1 }">
                    扩散速度 {{ formatPct(chip.stats.sonarSpeedMul) }}
                  </span>
                  <span v-if="chip.stats.maxChargesBonus > 0" class="stat good">
                    充能上限 +{{ chip.stats.maxChargesBonus }}
                  </span>
                </div>
              </div>
              <div class="eq-check" v-if="loadout.sonarChip === chip.id">✓</div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">📦</span>
            <span class="section-name">补给包</span>
          </div>
          <div class="equipment-list">
            <div
              v-for="pack in supplyPacks"
              :key="pack.id"
              class="equipment-item"
              :class="{ active: loadout.supplyPack === pack.id }"
              @click="selectSupplyPack(pack.id)"
            >
              <div class="eq-icon">{{ pack.icon }}</div>
              <div class="eq-info">
                <div class="eq-name">{{ pack.name }}</div>
                <div class="eq-desc">{{ pack.description }}</div>
                <div class="eq-stats">
                  <span class="stat" :class="{ good: pack.stats.scoreMul > 1, bad: pack.stats.scoreMul < 1 }">
                    收益倍率 {{ formatPct(pack.stats.scoreMul) }}
                  </span>
                  <span class="stat" :class="{ good: pack.stats.dangerCountMul < 1, bad: pack.stats.dangerCountMul > 1 }">
                    危险密度 {{ formatPct(pack.stats.dangerCountMul) }}
                  </span>
                  <span v-if="pack.stats.creaturePointsBonus > 0" class="stat good">
                    生物 +{{ pack.stats.creaturePointsBonus }}
                  </span>
                  <span v-if="pack.stats.wreckPointsBonus > 0" class="stat good">
                    残骸 +{{ pack.stats.wreckPointsBonus }}
                  </span>
                </div>
              </div>
              <div class="eq-check" v-if="loadout.supplyPack === pack.id">✓</div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">🔊</span>
            <span class="section-name">探测器</span>
          </div>
          <div class="equipment-list">
            <div
              v-for="det in detectors"
              :key="det.id"
              class="equipment-item"
              :class="{ active: loadout.detector === det.id, locked: !isDetectorUnlocked(det.id) }"
              @click="isDetectorUnlocked(det.id) && selectDetector(det.id)"
            >
              <div class="eq-icon">{{ det.icon }}</div>
              <div class="eq-info">
                <div class="eq-name">
                  {{ det.name }}
                  <span v-if="!isDetectorUnlocked(det.id)" class="lock-badge">🔒 未解锁</span>
                </div>
                <div class="eq-desc">{{ det.description }}</div>
                <div class="eq-stats">
                  <span class="stat" :class="{ good: det.stats.echoRangeMul > 1, bad: det.stats.echoRangeMul < 1 }">
                    回波范围 {{ formatPct(det.stats.echoRangeMul) }}
                  </span>
                  <span class="stat" :class="{ good: det.stats.discoveryEfficiencyMul > 1, bad: det.stats.discoveryEfficiencyMul < 1 }">
                    发现效率 {{ formatPct(det.stats.discoveryEfficiencyMul) }}
                  </span>
                  <span class="stat" :class="{ good: det.stats.dangerLifePenaltyMul < 1, bad: det.stats.dangerLifePenaltyMul > 1 }">
                    生命惩罚 {{ formatPct(det.stats.dangerLifePenaltyMul) }}
                  </span>
                </div>
              </div>
              <div class="eq-check" v-if="loadout.detector === det.id">✓</div>
            </div>
          </div>
        </div>
      </div>

      <div class="effects-summary">
        <div class="summary-title">装备效果总览</div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="s-label">地图深度</span>
            <span class="s-value">{{ effects.mapHeight }}m</span>
          </div>
          <div class="summary-item">
            <span class="s-label">额外生命</span>
            <span class="s-value">+{{ effects.livesBonus }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">声呐范围</span>
            <span class="s-value">{{ Math.round(effects.sonarRadius) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">声呐充能</span>
            <span class="s-value">{{ effects.maxSonarCharges }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">生物数量</span>
            <span class="s-value">{{ formatPct(effects.creatureCountMul) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">残骸数量</span>
            <span class="s-value">{{ formatPct(effects.wreckCountMul) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">危险密度</span>
            <span class="s-value">{{ formatPct(effects.dangerCountMul) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">收益倍率</span>
            <span class="s-value highlight">{{ formatPct(effects.scoreMul) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">回波范围</span>
            <span class="s-value">{{ formatPct(effects.echoRangeMul) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">发现效率</span>
            <span class="s-value">{{ formatPct(effects.discoveryEfficiencyMul) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">回波数量</span>
            <span class="s-value">{{ formatPct(effects.echoCountMul) }}</span>
          </div>
          <div class="summary-item">
            <span class="s-label">生命惩罚</span>
            <span class="s-value" :class="{ bad: effects.dangerLifePenaltyMul > 1, good: effects.dangerLifePenaltyMul < 1 }">{{ formatPct(effects.dangerLifePenaltyMul) }}</span>
          </div>
        </div>
      </div>

      <button class="start-expedition-btn" @click="confirmStart">
        <span class="btn-text">启航远征</span>
        <span class="btn-glow"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import type {
  ExpeditionLoadout,
  SubmarineTier,
  SonarChipTier,
  SupplyPackTier,
  DetectorTier,
} from '../types/game';
import {
  SUBMARINES,
  SONAR_CHIPS,
  SUPPLY_PACKS,
  DETECTORS,
  DEFAULT_LOADOUT,
  computeLoadoutEffects,
} from '../config/expeditionConfig';

const props = defineProps<{
  initialLoadout?: ExpeditionLoadout;
  unlockedDetectors?: DetectorTier[];
}>();

const emit = defineEmits<{
  (e: 'start', loadout: ExpeditionLoadout): void;
  (e: 'back'): void;
}>();

const submarines = SUBMARINES;
const sonarChips = SONAR_CHIPS;
const supplyPacks = SUPPLY_PACKS;
const detectors = DETECTORS;

const loadout = reactive<ExpeditionLoadout>({
  ...(props.initialLoadout ?? DEFAULT_LOADOUT),
});

const effects = computed(() => computeLoadoutEffects(loadout));

const selectSubmarine = (id: SubmarineTier) => {
  loadout.submarine = id;
};

const selectSonarChip = (id: SonarChipTier) => {
  loadout.sonarChip = id;
};

const selectSupplyPack = (id: SupplyPackTier) => {
  loadout.supplyPack = id;
};

const selectDetector = (id: DetectorTier) => {
  loadout.detector = id;
};

const isDetectorUnlocked = (id: DetectorTier): boolean => {
  if (!props.unlockedDetectors || props.unlockedDetectors.length === 0) {
    return id === 'basic';
  }
  return props.unlockedDetectors.includes(id);
};

const formatPct = (mul: number) => {
  return `${Math.round(mul * 100)}%`;
};

const confirmStart = () => {
  emit('start', { ...loadout });
};
</script>

<style scoped>
.prep-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top, rgba(0, 30, 60, 0.97) 0%, rgba(0, 5, 15, 0.99) 100%);
  z-index: 100;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.prep-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px 32px;
}

.prep-header {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  background: rgba(0, 60, 100, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.3);
  color: rgba(0, 255, 200, 0.9);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(0, 100, 150, 0.6);
  border-color: rgba(0, 255, 170, 0.5);
}

.back-arrow {
  font-size: 18px;
  font-weight: bold;
}

.prep-title {
  font-size: 26px;
  font-weight: bold;
  background: linear-gradient(135deg, #00ffcc 0%, #00aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  margin: 0;
}

.prep-subtitle {
  font-size: 12px;
  color: rgba(0, 255, 200, 0.5);
  letter-spacing: 2px;
  margin-top: 6px;
}

.prep-sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}

.section-card {
  background: linear-gradient(135deg, rgba(0, 40, 70, 0.6), rgba(0, 20, 45, 0.7));
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 14px;
  padding: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 255, 170, 0.15);
}

.section-icon {
  font-size: 20px;
}

.section-name {
  font-size: 15px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.95);
  letter-spacing: 2px;
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 30, 55, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.equipment-item:hover {
  background: rgba(0, 50, 90, 0.5);
  border-color: rgba(0, 255, 170, 0.3);
}

.equipment-item.active {
  background: linear-gradient(135deg, rgba(0, 80, 120, 0.7), rgba(0, 50, 100, 0.7));
  border-color: rgba(0, 255, 170, 0.6);
  box-shadow: 0 0 16px rgba(0, 255, 170, 0.15);
}

.equipment-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.equipment-item.locked:hover {
  background: rgba(0, 30, 55, 0.5);
  border-color: rgba(0, 255, 170, 0.12);
  transform: none;
}

.lock-badge {
  font-size: 10px;
  color: #ff9966;
  margin-left: 6px;
  font-weight: normal;
  opacity: 0.8;
}

.eq-icon {
  font-size: 28px;
  flex-shrink: 0;
  width: 40px;
  text-align: center;
}

.eq-info {
  flex: 1;
  min-width: 0;
}

.eq-name {
  font-size: 14px;
  font-weight: bold;
  color: rgba(220, 245, 255, 0.95);
}

.eq-desc {
  font-size: 11px;
  color: rgba(180, 210, 230, 0.65);
  margin-top: 2px;
}

.eq-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.stat {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(0, 60, 100, 0.4);
  border-radius: 4px;
  color: rgba(200, 230, 255, 0.75);
  font-family: 'Courier New', monospace;
}

.stat.good {
  color: #00ffaa;
  background: rgba(0, 255, 170, 0.12);
}

.stat.bad {
  color: #ff7788;
  background: rgba(255, 100, 120, 0.1);
}

.eq-check {
  position: absolute;
  top: 8px;
  right: 10px;
  color: #00ffaa;
  font-weight: bold;
  font-size: 16px;
}

.effects-summary {
  background: linear-gradient(135deg, rgba(0, 50, 90, 0.5), rgba(0, 30, 60, 0.6));
  border: 1px solid rgba(0, 255, 170, 0.25);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 18px;
}

.summary-title {
  font-size: 13px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.9);
  letter-spacing: 2px;
  margin-bottom: 10px;
  text-align: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  background: rgba(0, 30, 55, 0.5);
  border-radius: 8px;
}

.s-label {
  font-size: 10px;
  color: rgba(180, 210, 230, 0.55);
}

.s-value {
  font-size: 13px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.9);
  font-family: 'Courier New', monospace;
}

.s-value.good {
  color: #00ffaa;
}

.s-value.bad {
  color: #ff7788;
}

.s-value.highlight {
  color: #ffcc00;
}

.start-expedition-btn {
  position: relative;
  width: 100%;
  padding: 16px 32px;
  font-size: 17px;
  font-weight: bold;
  color: #001a2e;
  background: linear-gradient(135deg, #00ffcc 0%, #00aaff 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 255, 200, 0.4);
}

.start-expedition-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(0, 255, 200, 0.6);
}

.start-expedition-btn:active {
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
</style>
