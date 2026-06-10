<template>
  <div class="editor-overlay">
    <div class="editor-container">
      <div class="editor-header">
        <div class="header-left">
          <span class="editor-icon">🗺️</span>
          <h2 class="editor-title">海域编辑器</h2>
        </div>
        <div class="header-right">
          <button class="btn-ghost" @click="handleReset" title="重置为默认">
            <span>🔄</span>
          </button>
          <button class="btn-ghost" @click="$emit('close')" title="关闭">
            <span>✕</span>
          </button>
        </div>
      </div>

      <div class="editor-body">
        <div class="sidebar">
          <div class="sidebar-section">
            <div class="sidebar-header">
              <span>关卡列表</span>
              <button class="btn-add" @click="handleCreateLevel" title="新建关卡">+</button>
            </div>
            <div class="level-list">
              <div
                v-for="level in levels"
                :key="level.id"
                class="level-item"
                :class="{ active: activeLevelId === level.id }"
                @click="selectLevel(level.id)"
              >
                <div class="level-item-info">
                  <div class="level-item-name">{{ level.name }}</div>
                  <div class="level-item-desc">{{ level.description }}</div>
                </div>
                <div class="level-item-actions">
                  <button class="btn-icon" @click.stop="handleDuplicate(level.id)" title="复制">📋</button>
                  <button class="btn-icon btn-danger" @click.stop="handleDelete(level.id)" title="删除">🗑️</button>
                </div>
              </div>
              <div v-if="levels.length === 0" class="empty-state">
                <span>暂无自定义关卡</span>
              </div>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-header">
              <span>导入/导出</span>
            </div>
            <div class="io-actions">
              <button class="btn-secondary" @click="handleExport">📤 导出当前</button>
              <button class="btn-secondary" @click="showImportModal = true">📥 导入关卡</button>
            </div>
          </div>
        </div>

        <div class="main-panel" v-if="activeLevel">
          <div class="tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab"
              :class="{ active: currentTab === tab.id }"
              @click="currentTab = tab.id"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          </div>

          <div class="tab-content">
            <div v-if="currentTab === 'basic'" class="form-grid">
              <div class="form-item">
                <label>关卡名称</label>
                <input
                  type="text"
                  class="input"
                  :value="activeLevel.name"
                  @input="updateField('name', ($event.target as HTMLInputElement).value)"
                  maxlength="20"
                />
              </div>
              <div class="form-item full">
                <label>关卡描述</label>
                <textarea
                  class="input textarea"
                  :value="activeLevel.description"
                  @input="updateField('description', ($event.target as HTMLTextAreaElement).value)"
                  maxlength="100"
                  rows="2"
                />
              </div>
              <div class="form-item">
                <label>地图宽度 ({{ activeLevel.mapWidth }}px)</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.mapWidth"
                  :min="config.MAP.MIN_WIDTH"
                  :max="config.MAP.MAX_WIDTH"
                  step="50"
                  @input="updateField('mapWidth', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label>地图高度 ({{ activeLevel.mapHeight }}px)</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.mapHeight"
                  :min="config.MAP.MIN_HEIGHT"
                  :max="config.MAP.MAX_HEIGHT"
                  step="100"
                  @input="updateField('mapHeight', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label>初始生命 ({{ activeLevel.game.initialLives }})</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.game.initialLives"
                  :min="config.GAME.MIN_LIVES"
                  :max="config.GAME.MAX_LIVES"
                  @input="updateGameField('initialLives', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label>升级目标数 ({{ activeLevel.game.targetsPerLevel }})</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.game.targetsPerLevel"
                  :min="config.GAME.MIN_TARGETS_PER_LEVEL"
                  :max="config.GAME.MAX_TARGETS_PER_LEVEL"
                  @input="updateGameField('targetsPerLevel', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
            </div>

            <div v-else-if="currentTab === 'targets'" class="form-grid">
              <div class="section-title">
                <span>目标密度</span>
              </div>
              <div class="form-item">
                <label class="label-creature">🐟 海洋生物 ({{ activeLevel.targetDensity.creature }})</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.targetDensity.creature"
                  :min="config.TARGETS.MIN_COUNT"
                  :max="config.TARGETS.MAX_COUNT"
                  @input="updateDensity('creature', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label class="label-wreck">⚓ 残骸遗迹 ({{ activeLevel.targetDensity.wreck }})</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.targetDensity.wreck"
                  :min="config.TARGETS.MIN_COUNT"
                  :max="config.TARGETS.MAX_COUNT"
                  @input="updateDensity('wreck', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label class="label-danger">⚠️ 危险目标 ({{ activeLevel.targetDensity.danger }})</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.targetDensity.danger"
                  :min="config.TARGETS.MIN_COUNT"
                  :max="config.TARGETS.MAX_COUNT"
                  @input="updateDensity('danger', Number(($event.target as HTMLInputElement).value))"
                />
              </div>

              <div class="section-title">
                <span>分数设置</span>
              </div>
              <div class="form-item">
                <label class="label-creature">🐟 生物分数</label>
                <input
                  type="number"
                  class="input input-number"
                  :value="activeLevel.targetPoints.creature"
                  :min="config.POINTS.MIN_POINTS"
                  :max="config.POINTS.MAX_POINTS"
                  @input="updatePoints('creature', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label class="label-wreck">⚓ 残骸分数</label>
                <input
                  type="number"
                  class="input input-number"
                  :value="activeLevel.targetPoints.wreck"
                  :min="config.POINTS.MIN_POINTS"
                  :max="config.POINTS.MAX_POINTS"
                  @input="updatePoints('wreck', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label class="label-danger">⚠️ 危险扣分</label>
                <input
                  type="number"
                  class="input input-number"
                  :value="activeLevel.targetPoints.danger"
                  :min="-config.POINTS.MAX_POINTS"
                  :max="0"
                  @input="updatePoints('danger', Number(($event.target as HTMLInputElement).value))"
                />
              </div>

              <div class="section-title">
                <span>声呐设置</span>
              </div>
              <div class="form-item">
                <label>声呐最大半径 ({{ activeLevel.sonar.maxRadius }}px)</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.sonar.maxRadius"
                  :min="config.SONAR.MIN_RADIUS"
                  :max="config.SONAR.MAX_RADIUS"
                  step="10"
                  @input="updateSonarField('maxRadius', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label>声呐速度 ({{ activeLevel.sonar.speed }}px/s)</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.sonar.speed"
                  :min="config.SONAR.MIN_SPEED"
                  :max="config.SONAR.MAX_SPEED"
                  step="10"
                  @input="updateSonarField('speed', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label>最大充能数 ({{ activeLevel.sonar.maxCharges }})</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.sonar.maxCharges"
                  :min="config.SONAR.MIN_CHARGES"
                  :max="config.SONAR.MAX_CHARGES"
                  @input="updateSonarField('maxCharges', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div class="form-item">
                <label>充能时间 ({{ (activeLevel.sonar.rechargeTime / 1000).toFixed(1) }}s)</label>
                <input
                  type="range"
                  class="slider"
                  :value="activeLevel.sonar.rechargeTime"
                  :min="config.SONAR.MIN_RECHARGE"
                  :max="config.SONAR.MAX_RECHARGE"
                  step="100"
                  @input="updateSonarField('rechargeTime', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
            </div>

            <div v-else-if="currentTab === 'danger'" class="danger-panel">
              <div class="panel-header">
                <span>危险区域 ({{ activeLevel.dangerZones.length }}/{{ config.DANGER_ZONE.MAX_ZONES }})</span>
                <button
                  class="btn-add"
                  @click="handleAddDangerZone"
                  :disabled="activeLevel.dangerZones.length >= config.DANGER_ZONE.MAX_ZONES"
                >
                  + 添加
                </button>
              </div>

              <div class="zone-list">
                <div
                  v-for="(zone, idx) in activeLevel.dangerZones"
                  :key="zone.id"
                  class="zone-card"
                >
                  <div class="zone-header">
                    <div class="zone-type-selector">
                      <span class="zone-icon">{{ getZoneTypeInfo(zone.type).icon }}</span>
                      <select
                        class="select"
                        :value="zone.type"
                        @change="updateZoneType(zone.id, ($event.target as HTMLSelectElement).value as any)"
                      >
                        <option v-for="zt in DANGER_ZONE_TYPES" :key="zt.id" :value="zt.id">
                          {{ zt.name }}
                        </option>
                      </select>
                    </div>
                    <button class="btn-icon btn-danger" @click="handleDeleteZone(zone.id)" title="删除">🗑️</button>
                  </div>

                  <div class="zone-body">
                    <div class="form-item">
                      <label>区域名称</label>
                      <input
                        type="text"
                        class="input"
                        :value="zone.name"
                        @input="updateZoneField(zone.id, 'name', ($event.target as HTMLInputElement).value)"
                        maxlength="15"
                      />
                    </div>
                    <div class="form-item">
                      <label>半径 ({{ zone.radius }}px)</label>
                      <input
                        type="range"
                        class="slider"
                        :value="zone.radius"
                        :min="config.DANGER_ZONE.MIN_RADIUS"
                        :max="config.DANGER_ZONE.MAX_RADIUS"
                        @input="updateZoneField(zone.id, 'radius', Number(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                    <div class="form-item">
                      <label>X 位置</label>
                      <input
                        type="number"
                        class="input input-number"
                        :value="Math.round(zone.position.x)"
                        :min="0"
                        :max="activeLevel.mapWidth"
                        @input="updateZonePosition(zone.id, 'x', Number(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                    <div class="form-item">
                      <label>Y 位置</label>
                      <input
                        type="number"
                        class="input input-number"
                        :value="Math.round(zone.position.y)"
                        :min="0"
                        :max="activeLevel.mapHeight"
                        @input="updateZonePosition(zone.id, 'y', Number(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                    <div class="form-item full">
                      <label>危险强度 ({{ zone.intensity.toFixed(1) }})</label>
                      <input
                        type="range"
                        class="slider"
                        :value="zone.intensity"
                        :min="config.DANGER_ZONE.MIN_INTENSITY"
                        :max="config.DANGER_ZONE.MAX_INTENSITY"
                        step="0.1"
                        @input="updateZoneField(zone.id, 'intensity', Number(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                  </div>
                </div>

                <div v-if="activeLevel.dangerZones.length === 0" class="empty-state">
                  <span>暂无危险区域</span>
                  <span class="hint">点击上方"添加"按钮创建危险区域</span>
                </div>
              </div>
            </div>

            <div v-else-if="currentTab === 'rewards'" class="rewards-panel">
              <div class="panel-header">
                <span>奖励规则 ({{ activeLevel.rewardRules.length }}/{{ config.REWARD.MAX_RULES }})</span>
                <button
                  class="btn-add"
                  @click="handleAddRewardRule"
                  :disabled="activeLevel.rewardRules.length >= config.REWARD.MAX_RULES"
                >
                  + 添加
                </button>
              </div>

              <div class="reward-list">
                <div
                  v-for="(rule, idx) in activeLevel.rewardRules"
                  :key="idx"
                  class="reward-card"
                >
                  <div class="reward-header">
                    <input
                      type="text"
                      class="input reward-name-input"
                      :value="rule.name"
                      @input="updateRewardField(idx, 'name', ($event.target as HTMLInputElement).value)"
                      maxlength="15"
                    />
                    <button class="btn-icon btn-danger" @click="handleDeleteReward(idx)" title="删除">🗑️</button>
                  </div>

                  <div class="reward-body">
                    <div class="form-item full">
                      <label>描述</label>
                      <input
                        type="text"
                        class="input"
                        :value="rule.description"
                        @input="updateRewardField(idx, 'description', ($event.target as HTMLInputElement).value)"
                        maxlength="50"
                      />
                    </div>
                    <div class="form-item">
                      <label>触发条件</label>
                      <select
                        class="select"
                        :value="rule.condition.type"
                        @change="updateRewardCondition(idx, 'type', ($event.target as HTMLSelectElement).value as any)"
                      >
                        <option v-for="ct in REWARD_CONDITION_TYPES" :key="ct.id" :value="ct.id">
                          {{ ct.name }}
                        </option>
                      </select>
                    </div>
                    <div class="form-item">
                      <label>条件数值</label>
                      <input
                        type="number"
                        class="input input-number"
                        :value="rule.condition.value"
                        :min="1"
                        :max="999"
                        @input="updateRewardCondition(idx, 'value', Number(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                    <div class="form-item">
                      <label>奖励类型</label>
                      <select
                        class="select"
                        :value="rule.type"
                        @change="updateRewardField(idx, 'type', ($event.target as HTMLSelectElement).value as any)"
                      >
                        <option v-for="rt in REWARD_TYPES" :key="rt.id" :value="rt.id">
                          {{ rt.name }}
                        </option>
                      </select>
                    </div>
                    <div class="form-item">
                      <label>奖励数值</label>
                      <input
                        type="number"
                        class="input input-number"
                        :value="rule.value"
                        :min="0"
                        :max="9999"
                        @input="updateRewardField(idx, 'value', Number(($event.target as HTMLInputElement).value))"
                      />
                    </div>
                  </div>
                </div>

                <div v-if="activeLevel.rewardRules.length === 0" class="empty-state">
                  <span>暂无奖励规则</span>
                  <span class="hint">点击上方"添加"按钮创建奖励规则</span>
                </div>
              </div>
            </div>

            <div v-else-if="currentTab === 'preview'" class="preview-panel">
              <div class="preview-container">
                <canvas ref="previewCanvasRef" class="preview-canvas"></canvas>
                <div class="preview-info">
                  <div class="preview-legend">
                    <div class="legend-item">
                      <span class="legend-dot creature"></span>
                      <span>生物 x{{ activeLevel.targetDensity.creature }}</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-dot wreck"></span>
                      <span>残骸 x{{ activeLevel.targetDensity.wreck }}</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-dot danger"></span>
                      <span>危险 x{{ activeLevel.targetDensity.danger }}</span>
                    </div>
                  </div>
                  <div class="preview-stats">
                    <div class="stat-pair">
                      <span>地图尺寸</span>
                      <span>{{ activeLevel.mapWidth }} x {{ activeLevel.mapHeight }}</span>
                    </div>
                    <div class="stat-pair">
                      <span>声呐半径</span>
                      <span>{{ activeLevel.sonar.maxRadius }}px</span>
                    </div>
                    <div class="stat-pair">
                      <span>初始生命</span>
                      <span>{{ activeLevel.game.initialLives }}</span>
                    </div>
                    <div class="stat-pair">
                      <span>危险区</span>
                      <span>{{ activeLevel.dangerZones.length }}个</span>
                    </div>
                    <div class="stat-pair">
                      <span>奖励规则</span>
                      <span>{{ activeLevel.rewardRules.length }}条</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="editor-footer">
            <div v-if="validationErrors.length > 0" class="validation-errors">
              <span v-for="(err, idx) in validationErrors" :key="idx" class="error-item">⚠️ {{ err }}</span>
            </div>
            <div class="footer-actions">
              <button class="btn-secondary" @click="$emit('close')">取消</button>
              <button
                class="btn-primary"
                :disabled="!isValid || !activeLevelId"
                @click="handleStartLevel"
              >
                🚀 开始此关卡
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-level">
          <div class="empty-icon">🗺️</div>
          <div class="empty-title">选择或创建关卡</div>
          <div class="empty-desc">从左侧列表选择一个关卡开始编辑，或创建新的自定义关卡</div>
          <button class="btn-primary" @click="handleCreateLevel">+ 创建新关卡</button>
        </div>
      </div>
    </div>

    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>导入关卡</h3>
          <button class="btn-ghost" @click="showImportModal = false">✕</button>
        </div>
        <div class="modal-body">
          <textarea
            class="input textarea"
            v-model="importJson"
            placeholder="粘贴关卡 JSON 数据..."
            rows="8"
          />
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showImportModal = false">取消</button>
          <button class="btn-primary" @click="handleImport">导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import type { OceanLevelConfig, DangerZone, RewardRule, EditorTab, TargetType } from '../types/game';
import { OceanEditorSystem } from '../game/OceanEditorSystem';
import {
  OCEAN_EDITOR_CONFIG,
  DANGER_ZONE_TYPES,
  REWARD_CONDITION_TYPES,
  REWARD_TYPES,
} from '../config/oceanEditorConfig';

const props = defineProps<{
  system: OceanEditorSystem;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'startLevel', level: OceanLevelConfig): void;
}>();

const config = OCEAN_EDITOR_CONFIG;

const tabs: { id: EditorTab; label: string; icon: string }[] = [
  { id: 'basic', label: '基础设置', icon: '⚙️' },
  { id: 'targets', label: '目标配置', icon: '🎯' },
  { id: 'danger', label: '危险区域', icon: '⚠️' },
  { id: 'rewards', label: '奖励规则', icon: '🏆' },
  { id: 'preview', label: '预览', icon: '👁️' },
];

const levels = ref<OceanLevelConfig[]>([]);
const activeLevelId = ref<string | null>(null);
const currentTab = ref<EditorTab>('basic');
const showImportModal = ref(false);
const importJson = ref('');
const previewCanvasRef = ref<HTMLCanvasElement | null>(null);

const refreshLevels = () => {
  levels.value = props.system.getLevels();
};

const activeLevel = computed<OceanLevelConfig | null>(() => {
  if (!activeLevelId.value) return null;
  return props.system.getLevel(activeLevelId.value);
});

const validationErrors = computed(() => {
  if (!activeLevel.value) return [];
  const result = props.system.validateLevel(activeLevel.value);
  return result.errors;
});

const isValid = computed(() => validationErrors.value.length === 0);

const selectLevel = (id: string) => {
  activeLevelId.value = id;
  props.system.setActiveLevel(id);
};

const handleCreateLevel = () => {
  const newLevel = props.system.createLevel();
  refreshLevels();
  selectLevel(newLevel.id);
};

const handleDuplicate = (id: string) => {
  const duplicated = props.system.duplicateLevel(id);
  if (duplicated) {
    refreshLevels();
    selectLevel(duplicated.id);
  }
};

const handleDelete = (id: string) => {
  if (confirm('确定要删除此关卡吗？')) {
    props.system.deleteLevel(id);
    refreshLevels();
    if (activeLevelId.value === id) {
      activeLevelId.value = null;
    }
  }
};

const handleReset = () => {
  if (confirm('确定要重置所有自定义关卡吗？此操作不可撤销。')) {
    props.system.resetToDefaults();
    refreshLevels();
    activeLevelId.value = null;
  }
};

const updateField = <K extends keyof OceanLevelConfig>(key: K, value: OceanLevelConfig[K]) => {
  if (!activeLevelId.value) return;
  props.system.updateLevel(activeLevelId.value, { [key]: value });
  refreshLevels();
};

const updateGameField = <K extends keyof OceanLevelConfig['game']>(key: K, value: OceanLevelConfig['game'][K]) => {
  if (!activeLevel.value) return;
  updateField('game', { ...activeLevel.value.game, [key]: value });
};

const updateDensity = (type: TargetType, value: number) => {
  if (!activeLevel.value) return;
  updateField('targetDensity', { ...activeLevel.value.targetDensity, [type]: value });
};

const updatePoints = (type: TargetType, value: number) => {
  if (!activeLevel.value) return;
  updateField('targetPoints', { ...activeLevel.value.targetPoints, [type]: value });
};

const updateSonarField = <K extends keyof OceanLevelConfig['sonar']>(key: K, value: OceanLevelConfig['sonar'][K]) => {
  if (!activeLevel.value) return;
  updateField('sonar', { ...activeLevel.value.sonar, [key]: value });
};

const handleAddDangerZone = () => {
  if (!activeLevelId.value) return;
  props.system.addDangerZone(activeLevelId.value);
  refreshLevels();
};

const handleDeleteZone = (zoneId: number) => {
  if (!activeLevelId.value) return;
  props.system.deleteDangerZone(activeLevelId.value, zoneId);
  refreshLevels();
};

const updateZoneField = <K extends keyof DangerZone>(zoneId: number, key: K, value: DangerZone[K]) => {
  if (!activeLevelId.value) return;
  props.system.updateDangerZone(activeLevelId.value, zoneId, { [key]: value });
  refreshLevels();
};

const updateZoneType = (zoneId: number, type: DangerZone['type']) => {
  updateZoneField(zoneId, 'type', type);
};

const updateZonePosition = (zoneId: number, axis: 'x' | 'y', value: number) => {
  if (!activeLevel.value) return;
  const zone = activeLevel.value.dangerZones.find((z) => z.id === zoneId);
  if (!zone) return;
  updateZoneField(zoneId, 'position', { ...zone.position, [axis]: value });
};

const getZoneTypeInfo = (type: string) => {
  return DANGER_ZONE_TYPES.find((z) => z.id === type) ?? DANGER_ZONE_TYPES[0];
};

const handleAddRewardRule = () => {
  if (!activeLevelId.value) return;
  props.system.addRewardRule(activeLevelId.value);
  refreshLevels();
};

const handleDeleteReward = (idx: number) => {
  if (!activeLevelId.value) return;
  props.system.deleteRewardRule(activeLevelId.value, idx);
  refreshLevels();
};

const updateRewardField = <K extends keyof RewardRule>(idx: number, key: K, value: RewardRule[K]) => {
  if (!activeLevelId.value) return;
  props.system.updateRewardRule(activeLevelId.value, idx, { [key]: value });
  refreshLevels();
};

const updateRewardCondition = <K extends keyof RewardRule['condition']>(
  idx: number,
  key: K,
  value: RewardRule['condition'][K]
) => {
  if (!activeLevel.value) return;
  const rule = activeLevel.value.rewardRules[idx];
  if (!rule) return;
  updateRewardField(idx, 'condition', { ...rule.condition, [key]: value });
};

const handleExport = () => {
  if (!activeLevelId.value) return;
  const json = props.system.exportLevel(activeLevelId.value);
  if (json) {
    navigator.clipboard?.writeText(json);
    alert('关卡 JSON 已复制到剪贴板');
  }
};

const handleImport = () => {
  if (!importJson.value.trim()) {
    alert('请粘贴关卡 JSON 数据');
    return;
  }
  const result = props.system.importLevel(importJson.value);
  if (result) {
    refreshLevels();
    selectLevel(result.id);
    showImportModal.value = false;
    importJson.value = '';
    alert('导入成功！');
  } else {
    alert('导入失败，请检查 JSON 数据格式');
  }
};

const handleStartLevel = () => {
  if (!activeLevel.value || !isValid.value) return;
  emit('startLevel', activeLevel.value);
};

const renderPreview = () => {
  if (!previewCanvasRef.value || !activeLevel.value) return;
  const canvas = previewCanvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const maxW = 320;
  const maxH = 480;
  const scale = Math.min(maxW / activeLevel.value.mapWidth, maxH / activeLevel.value.mapHeight);
  const w = activeLevel.value.mapWidth * scale;
  const h = activeLevel.value.mapHeight * scale;

  canvas.width = w;
  canvas.height = h;

  ctx.fillStyle = '#000814';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(0, 102, 136, 0.3)';
  ctx.lineWidth = 1;
  const gridStep = 50 * scale;
  for (let x = 0; x < w; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  for (const zone of activeLevel.value.dangerZones) {
    const zx = zone.position.x * scale;
    const zy = zone.position.y * scale;
    const zr = zone.radius * scale;
    ctx.beginPath();
    ctx.arc(zx, zy, zr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 51, 85, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 51, 85, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255, 180, 180, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(getZoneTypeInfo(zone.type).icon, zx, zy + 5);
  }

  const total = activeLevel.value.targetDensity.creature + activeLevel.value.targetDensity.wreck + activeLevel.value.targetDensity.danger;
  const sample = Math.min(total, 20);
  const colors: Record<string, string> = {
    creature: '#00e5ff',
    wreck: '#ffcc00',
    danger: '#ff3355',
  };

  for (let i = 0; i < sample; i++) {
    let type: TargetType;
    if (i < activeLevel.value.targetDensity.creature) type = 'creature';
    else if (i < activeLevel.value.targetDensity.creature + activeLevel.value.targetDensity.wreck) type = 'wreck';
    else type = 'danger';

    const px = (50 + Math.random() * (activeLevel.value.mapWidth - 100)) * scale;
    const py = (50 + Math.random() * (activeLevel.value.mapHeight - 100)) * scale;
    const r = (15 + Math.random() * 15) * scale;

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = colors[type] + '40';
    ctx.fill();
    ctx.strokeStyle = colors[type];
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(w / 2, 40 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#00ff88';
  ctx.fill();
  ctx.strokeStyle = '#00ff8888';
  ctx.lineWidth = 1;
  ctx.stroke();
};

onMounted(() => {
  refreshLevels();
  if (levels.value.length > 0) {
    selectLevel(levels.value[0].id);
  }
});

watch([activeLevel, currentTab], () => {
  if (currentTab.value === 'preview') {
    nextTick(() => renderPreview());
  }
});
</script>

<style scoped>
.editor-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(0, 20, 40, 0.97) 0%, rgba(0, 5, 15, 0.99) 100%);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.editor-container {
  width: 100%;
  max-width: 900px;
  max-height: 92vh;
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.95), rgba(0, 15, 35, 0.98));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 255, 170, 0.1);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 255, 170, 0.2);
  background: rgba(0, 60, 90, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-icon {
  font-size: 24px;
}

.editor-title {
  font-size: 18px;
  font-weight: bold;
  color: #00ffcc;
  letter-spacing: 2px;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 6px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid rgba(0, 255, 170, 0.3);
  color: rgba(0, 255, 200, 0.8);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: rgba(0, 255, 170, 0.1);
  border-color: rgba(0, 255, 170, 0.5);
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  border-right: 1px solid rgba(0, 255, 170, 0.15);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-section {
  padding: 12px;
  border-bottom: 1px solid rgba(0, 255, 170, 0.1);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.8);
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.btn-add {
  background: rgba(0, 255, 170, 0.15);
  border: 1px solid rgba(0, 255, 170, 0.4);
  color: #00ffcc;
  font-size: 14px;
  font-weight: bold;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.btn-add:hover:not(:disabled) {
  background: rgba(0, 255, 170, 0.25);
}

.btn-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.level-item {
  background: rgba(0, 50, 80, 0.4);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.level-item:hover {
  background: rgba(0, 80, 120, 0.5);
  border-color: rgba(0, 255, 170, 0.3);
}

.level-item.active {
  background: rgba(0, 120, 160, 0.4);
  border-color: rgba(0, 255, 170, 0.6);
  box-shadow: 0 0 12px rgba(0, 255, 170, 0.15);
}

.level-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.level-item-name {
  font-size: 13px;
  font-weight: bold;
  color: rgba(150, 240, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.level-item-desc {
  font-size: 10px;
  color: rgba(150, 200, 220, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.level-item-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.level-item:hover .level-item-actions {
  opacity: 1;
}

.btn-icon {
  background: transparent;
  border: 1px solid rgba(150, 200, 255, 0.2);
  width: 24px;
  height: 24px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(150, 200, 255, 0.1);
}

.btn-icon.btn-danger:hover {
  background: rgba(255, 80, 100, 0.2);
  border-color: rgba(255, 80, 100, 0.5);
}

.empty-state {
  padding: 16px 8px;
  text-align: center;
  color: rgba(150, 200, 220, 0.5);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-state .hint {
  font-size: 10px;
  color: rgba(150, 200, 220, 0.35);
}

.io-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-secondary {
  background: rgba(0, 60, 100, 0.6);
  border: 1px solid rgba(0, 255, 170, 0.3);
  color: rgba(0, 255, 200, 0.9);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(0, 100, 150, 0.7);
  border-color: rgba(0, 255, 170, 0.5);
}

.btn-primary {
  background: linear-gradient(135deg, #00ffcc, #00aaff);
  border: none;
  color: #001a2e;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(0, 255, 200, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(0, 255, 200, 0.45);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid rgba(0, 255, 170, 0.15);
  background: rgba(0, 30, 50, 0.4);
  padding: 0 8px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: rgba(150, 200, 220, 0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab:hover {
  color: rgba(150, 240, 255, 0.9);
}

.tab.active {
  color: #00ffcc;
  border-bottom-color: #00ffcc;
}

.tab-icon {
  font-size: 14px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item.full {
  grid-column: 1 / -1;
}

.form-item label {
  font-size: 11px;
  color: rgba(150, 200, 220, 0.7);
  letter-spacing: 0.5px;
}

.label-creature { color: rgba(0, 229, 255, 0.9) !important; }
.label-wreck { color: rgba(255, 204, 0, 0.9) !important; }
.label-danger { color: rgba(255, 80, 100, 0.9) !important; }

.input {
  background: rgba(0, 30, 50, 0.6);
  border: 1px solid rgba(0, 255, 170, 0.2);
  color: rgba(200, 240, 255, 0.95);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s;
}

.input:focus {
  border-color: rgba(0, 255, 170, 0.6);
  box-shadow: 0 0 8px rgba(0, 255, 170, 0.15);
}

.input.textarea {
  resize: vertical;
  min-height: 50px;
}

.input-number {
  width: 100%;
}

.select {
  background: rgba(0, 30, 50, 0.6);
  border: 1px solid rgba(0, 255, 170, 0.2);
  color: rgba(200, 240, 255, 0.95);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  cursor: pointer;
}

.select:focus {
  border-color: rgba(0, 255, 170, 0.6);
}

.slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 255, 170, 0.15);
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00ffcc;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 255, 200, 0.5);
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00ffcc;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 8px rgba(0, 255, 200, 0.5);
}

.section-title {
  grid-column: 1 / -1;
  font-size: 13px;
  font-weight: bold;
  color: rgba(0, 255, 200, 0.85);
  letter-spacing: 1px;
  padding-top: 6px;
  border-top: 1px solid rgba(0, 255, 170, 0.15);
  margin-top: 4px;
}

.danger-panel,
.rewards-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: rgba(150, 200, 220, 0.8);
}

.zone-list,
.reward-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zone-card,
.reward-card {
  background: rgba(0, 50, 80, 0.3);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 10px;
  overflow: hidden;
}

.zone-header,
.reward-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 60, 90, 0.4);
  border-bottom: 1px solid rgba(0, 255, 170, 0.1);
}

.zone-type-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zone-icon {
  font-size: 18px;
}

.zone-body,
.reward-body {
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.reward-name-input {
  background: transparent;
  border: none;
  color: rgba(150, 240, 255, 0.95);
  font-size: 13px;
  font-weight: bold;
  padding: 4px 0;
  outline: none;
  width: 160px;
}

.reward-name-input:focus {
  border-bottom: 1px solid rgba(0, 255, 170, 0.4);
}

.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-container {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: start;
}

.preview-canvas {
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 8px;
  background: #000814;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preview-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 50, 80, 0.3);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(200, 220, 255, 0.8);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.creature { background: #00e5ff; }
.legend-dot.wreck { background: #ffcc00; }
.legend-dot.danger { background: #ff3355; }

.preview-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(0, 50, 80, 0.3);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 8px;
}

.stat-pair {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-pair span:first-child {
  color: rgba(150, 200, 220, 0.6);
}

.stat-pair span:last-child {
  color: rgba(0, 255, 200, 0.95);
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.editor-footer {
  border-top: 1px solid rgba(0, 255, 170, 0.15);
  padding: 12px 20px;
  background: rgba(0, 20, 40, 0.5);
}

.validation-errors {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.error-item {
  font-size: 11px;
  color: rgba(255, 120, 120, 0.9);
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty-level {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-title {
  font-size: 18px;
  font-weight: bold;
  color: rgba(150, 240, 255, 0.9);
}

.empty-desc {
  font-size: 12px;
  color: rgba(150, 200, 220, 0.5);
  text-align: center;
  max-width: 280px;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: 90%;
  max-width: 480px;
  background: linear-gradient(135deg, rgba(0, 40, 60, 0.98), rgba(0, 15, 35, 0.99));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 255, 170, 0.15);
}

.modal-header h3 {
  font-size: 14px;
  font-weight: bold;
  color: #00ffcc;
  letter-spacing: 1px;
  margin: 0;
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 255, 170, 0.15);
}
</style>
