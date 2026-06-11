<template>
  <div v-if="!gameStarted && !gameState.isGameOver" class="overlay">
    <div class="intro-content">
      <div class="title-section">
        <div class="mode-badge">🔬 高级研究</div>
        <h1 class="game-title">声纹识别实验室</h1>
        <div class="subtitle">VOICEPRINT ANALYSIS LAB</div>
      </div>

      <div class="lab-animation">
        <div class="waveform-container">
          <div class="wave-bar" v-for="i in 20" :key="i" :style="{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.05}s` }"></div>
        </div>
        <div class="lab-icon">🎯</div>
      </div>

      <div class="briefing">
        <div class="briefing-header">
          <span class="briefing-icon">📊</span>
          <span>任务说明</span>
        </div>
        <div class="briefing-text">
          深海环境复杂，回波信号真假难辨。通过多次声呐采样收集声纹特征，判别目标真伪。<strong>样本越少，风险越高，但收益也越大！</strong>
        </div>
      </div>

      <div class="instructions">
        <div class="instruction-item">
          <span class="icon">🔊</span>
          <span>点击空白处释放声呐发现目标</span>
        </div>
        <div class="instruction-item">
          <span class="icon">🎯</span>
          <span>点击已发现目标进入分析模式</span>
        </div>
        <div class="instruction-item highlight">
          <span class="icon">📡</span>
          <span>精确采样（消耗2声呐）获取声纹特征</span>
        </div>
        <div class="instruction-item warn">
          <span class="icon">⚖️</span>
          <span>判断真伪：正确得分，错误扣血扣分</span>
        </div>
      </div>

      <div class="risk-table">
        <div class="risk-title">风险收益矩阵</div>
        <div class="risk-rows">
          <div class="risk-row extreme" v-if="RISK_PROFILES[0]">
            <span class="risk-label">{{ RISK_PROFILES[0].label }}</span>
            <span class="risk-samples">{{ RISK_PROFILES[0].sampleCount }}样本</span>
            <span class="risk-rate">{{ Math.round(RISK_PROFILES[0].successRate * 100) }}%</span>
            <span class="risk-reward">×{{ RISK_PROFILES[0].rewardMultiplier }}</span>
            <span class="risk-penalty">×{{ RISK_PROFILES[0].penaltyMultiplier }}</span>
          </div>
          <div class="risk-row high" v-if="RISK_PROFILES[1]">
            <span class="risk-label">{{ RISK_PROFILES[1].label }}</span>
            <span class="risk-samples">{{ RISK_PROFILES[1].sampleCount }}样本</span>
            <span class="risk-rate">{{ Math.round(RISK_PROFILES[1].successRate * 100) }}%</span>
            <span class="risk-reward">×{{ RISK_PROFILES[1].rewardMultiplier }}</span>
            <span class="risk-penalty">×{{ RISK_PROFILES[1].penaltyMultiplier }}</span>
          </div>
          <div class="risk-row medium" v-if="RISK_PROFILES[2]">
            <span class="risk-label">{{ RISK_PROFILES[2].label }}</span>
            <span class="risk-samples">{{ RISK_PROFILES[2].sampleCount }}样本</span>
            <span class="risk-rate">{{ Math.round(RISK_PROFILES[2].successRate * 100) }}%</span>
            <span class="risk-reward">×{{ RISK_PROFILES[2].rewardMultiplier }}</span>
            <span class="risk-penalty">×{{ RISK_PROFILES[2].penaltyMultiplier }}</span>
          </div>
          <div class="risk-row low" v-if="RISK_PROFILES[4]">
            <span class="risk-label">{{ RISK_PROFILES[4].label }}</span>
            <span class="risk-samples">{{ RISK_PROFILES[4].sampleCount }}样本</span>
            <span class="risk-rate">{{ Math.round(RISK_PROFILES[4].successRate * 100) }}%</span>
            <span class="risk-reward">×{{ RISK_PROFILES[4].rewardMultiplier }}</span>
            <span class="risk-penalty">×{{ RISK_PROFILES[4].penaltyMultiplier }}</span>
          </div>
        </div>
      </div>

      <div class="high-score" v-if="highScore > 0">
        <span class="score-label">🏆 最高分数</span>
        <span class="score-value">{{ highScore.toLocaleString() }}</span>
      </div>

      <button class="start-btn" @click="handleStart">
        <span class="btn-text">🔬 开始实验</span>
        <span class="btn-glow"></span>
      </button>

      <button class="back-btn" @click="handleHome">
        ← 返回主页
      </button>
    </div>
  </div>

  <div v-if="gameState.isPlaying && selectedTarget" class="analysis-panel">
    <div class="panel-header">
      <div class="target-info">
        <span class="target-icon">{{ selectedTarget.icon }}</span>
        <div class="target-meta">
          <div class="target-name">{{ selectedTarget.name }}</div>
          <div class="target-category" :style="{ color: CATEGORY_INFO[selectedTarget.category].color }">
            {{ CATEGORY_INFO[selectedTarget.category].icon }} {{ CATEGORY_INFO[selectedTarget.category].label }}
          </div>
        </div>
      </div>
      <button class="close-btn" @click="handleClosePanel">×</button>
    </div>

    <div class="risk-badge" :style="{ backgroundColor: RISK_LEVEL_INFO[selectedTarget.riskLevel].bgColor, color: RISK_LEVEL_INFO[selectedTarget.riskLevel].color }">
      {{ RISK_LEVEL_INFO[selectedTarget.riskLevel].label }} · {{ selectedTarget.basePoints }} 基础分
    </div>

    <div class="samples-section">
      <div class="section-header">
        <span class="section-title">📊 声纹样本</span>
        <span class="sample-count">{{ samples.length }}/{{ VOICEPRINT_CONFIG.GAME.SAMPLES_PER_TARGET }}</span>
      </div>
      
      <div class="samples-grid">
        <div 
          v-for="sample in samples" 
          :key="sample.id" 
          class="sample-card"
        >
          <div class="sample-id">#{{ sample.id }}</div>
          <div class="sample-features">
            <div 
              v-for="feature in sample.features" 
              :key="feature.id"
              class="feature-dot"
              :style="{ 
                backgroundColor: feature.isGenuine ? '#00ff88' : '#ff6688',
                opacity: 0.5 + feature.amplitude * 0.5,
                transform: `scale(${0.6 + feature.amplitude * 0.6})`
              }"
              :title="`频率: ${Math.round(feature.frequency)}Hz, 振幅: ${Math.round(feature.amplitude * 100)}%, 品质: ${SAMPLE_QUALITY_INFO[feature.quality].label}`"
            ></div>
          </div>
          <div class="sample-time">{{ formatTime(sample.collectedAt) }}</div>
        </div>
        
        <div 
          v-for="i in emptySlots" 
          :key="'empty-' + i" 
          class="sample-card empty"
        >
          <span class="empty-hint">待采集</span>
        </div>
      </div>

      <button 
        class="sample-btn" 
        :disabled="samples.length >= VOICEPRINT_CONFIG.GAME.SAMPLES_PER_TARGET || gameState.sonarCharges < VOICEPRINT_CONFIG.SONAR.PRECISE_SAMPLE_COST"
        @click="handleCollectSample"
      >
        <span class="btn-icon">📡</span>
        <span>精确采样</span>
        <span class="cost">(-{{ VOICEPRINT_CONFIG.SONAR.PRECISE_SAMPLE_COST }} 🔊)</span>
      </button>
    </div>

    <div class="analysis-section" v-if="samples.length > 0">
      <div class="section-header">
        <span class="section-title">📈 风险评估</span>
        <span class="risk-profile" :class="currentRiskClass">{{ currentRiskProfile.label }}</span>
      </div>
      
      <div class="risk-metrics">
        <div class="metric">
          <span class="metric-label">成功率</span>
          <span class="metric-value success">{{ Math.round(currentRiskProfile.successRate * 100) }}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">奖励倍数</span>
          <span class="metric-value reward">×{{ currentRiskProfile.rewardMultiplier }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">惩罚倍数</span>
          <span class="metric-value penalty">×{{ currentRiskProfile.penaltyMultiplier }}</span>
        </div>
      </div>

      <div class="predicted-score">
        <div class="score-row">
          <span>预计正确得分</span>
          <span class="positive">+{{ predictedReward.toLocaleString() }}</span>
        </div>
        <div class="score-row">
          <span>预计错误扣分</span>
          <span class="negative">-{{ predictedPenalty.toLocaleString() }}</span>
        </div>
        <div class="score-row high-risk" v-if="samples.length <= 2">
          <span>高风险额外奖励</span>
          <span class="positive">+{{ Math.round(predictedReward * 0.5).toLocaleString() }}</span>
        </div>
      </div>

      <div class="verdict-buttons">
        <button 
          class="verdict-btn genuine"
          @click="handleVerdict('genuine')"
        >
          <span class="btn-icon">✓</span>
          <span>判定为真</span>
        </button>
        <button 
          class="verdict-btn fake"
          @click="handleVerdict('fake')"
        >
          <span class="btn-icon">✗</span>
          <span>判定为假</span>
        </button>
      </div>
    </div>

    <div class="hint" v-else>
      <span class="hint-icon">💡</span>
      <span>至少采集1个样本后才能进行判定</span>
    </div>
  </div>

  <div v-if="gameState.isGameOver && !showCollection && result" class="overlay">
    <div class="result-content">
      <div class="result-header">
        <div class="rank-badge" :class="result.rank">
          <span class="rank-letter">{{ result.rank }}</span>
        </div>
        <div class="result-title">
          <span v-if="result.isNewRecord" class="new-record">🎊 新纪录！</span>
          <span v-else>实验结束</span>
        </div>
      </div>

      <div class="final-score">
        <span class="score-label">最终得分</span>
        <span class="score-value">{{ result.finalScore.toLocaleString() }}</span>
      </div>

      <div class="result-stats">
        <div class="stat-row">
          <span class="stat-label">到达等级</span>
          <span class="stat-value">Lv.{{ result.level }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">正确判定</span>
          <span class="stat-value correct">{{ result.correctVerdicts }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">错误判定</span>
          <span class="stat-value wrong">{{ result.wrongVerdicts }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">准确率</span>
          <span class="stat-value">{{ Math.round(result.accuracy * 100) }}%</span>
        </div>
        <div class="stat-row highlight">
          <span class="stat-label">高风险奖励</span>
          <span class="stat-value bonus">+{{ result.highRiskBonus.toLocaleString() }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">最高连击</span>
          <span class="stat-value combo">×{{ result.maxConsecutiveCorrect }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">声呐使用</span>
          <span class="stat-value">{{ result.totalSonarUsed }} 次</span>
        </div>
      </div>

      <div class="session-unlocks" v-if="result.sessionUnlocks && result.sessionUnlocks.length > 0">
        <div class="unlocks-title">📚 本次新发现</div>
        <div class="unlocks-list">
          <div 
            v-for="unlock in result.sessionUnlocks" 
            :key="unlock.name"
            class="unlock-item"
            :class="{ 'new': unlock.isNew }"
          >
            <span class="unlock-type">{{ unlock.type === 'creature' ? '🐟' : unlock.type === 'wreck' ? '⚓' : '⚠️' }}</span>
            <span class="unlock-name">{{ unlock.name }}</span>
            <span v-if="unlock.isNew" class="new-badge">NEW</span>
          </div>
        </div>
      </div>

      <div class="result-actions">
        <button class="action-btn primary" @click="handleRestart">
          <span>🔄 再来一次</span>
        </button>
        <button class="action-btn secondary" @click="handleHome">
          <span>🏠 返回主页</span>
        </button>
        <button class="action-btn tertiary" @click="handleOpenCollection">
          <span>📖 查看图鉴</span>
        </button>
      </div>
    </div>
  </div>

  <div v-if="showHint" class="game-hint">
    <div class="hint-text">
      💡 点击空白处释放声呐发现目标，点击已发现目标进行声纹分析
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { 
  VoiceprintLabState, 
  VoiceprintLabEvent, 
  VoiceprintResult,
  VoiceprintTarget,
  VoiceprintSample,
  VoiceprintVerdict,
} from '../types/game';
import { VoiceprintLabSystem } from '../game/VoiceprintLabSystem';
import { 
  VOICEPRINT_CONFIG, 
  RISK_PROFILES, 
  getRiskProfile, 
  calculateVerdictPoints,
  CATEGORY_INFO,
  RISK_LEVEL_INFO,
  SAMPLE_QUALITY_INFO,
} from '../config/voiceprintLab';

const props = defineProps<{
  system: VoiceprintLabSystem;
  highScore: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'verdict', verdict: VoiceprintVerdict): void;
}>();

const gameState = ref<VoiceprintLabState>(props.system.getState());
const result = ref<VoiceprintResult | null>(null);
const showCollection = ref(false);

const gameStarted = ref(false);
const showHint = ref(true);
const selectedTargetId = ref<number | null>(null);

const selectedTarget = computed<VoiceprintTarget | undefined>(() => {
  if (selectedTargetId.value === null) return undefined;
  return gameState.value.targets.find(t => t.id === selectedTargetId.value);
});

const samples = computed<VoiceprintSample[]>(() => {
  if (selectedTargetId.value === null) return [];
  return gameState.value.collectedSamples.filter(s => s.targetId === selectedTargetId.value);
});

const emptySlots = computed(() => {
  return Math.max(0, VOICEPRINT_CONFIG.GAME.SAMPLES_PER_TARGET - samples.value.length);
});

const currentRiskProfile = computed(() => {
  const count = Math.max(1, samples.value.length);
  return getRiskProfile(count);
});

const currentRiskClass = computed(() => {
  const count = samples.value.length;
  if (count <= 1) return 'extreme';
  if (count <= 2) return 'high';
  if (count <= 3) return 'medium';
  return 'low';
});

const predictedReward = computed(() => {
  if (!selectedTarget.value) return 0;
  const { pointsGained } = calculateVerdictPoints(
    selectedTarget.value.basePoints,
    samples.value.length,
    true,
    gameState.value.consecutiveCorrect
  );
  return pointsGained;
});

const predictedPenalty = computed(() => {
  if (!selectedTarget.value) return 0;
  const { pointsLost } = calculateVerdictPoints(
    selectedTarget.value.basePoints,
    samples.value.length,
    false
  );
  return pointsLost;
});

const handleStateChange = (state: VoiceprintLabState) => {
  gameState.value = { ...state };
};

const handleGameOver = (gameResult: VoiceprintResult) => {
  result.value = gameResult;
};

props.system.setCallbacks(
  handleStateChange,
  () => {},
  handleGameOver,
  () => {}
);

props.system.setHighScore(props.highScore);

const handleStart = () => {
  gameStarted.value = true;
  props.system.startGame();
  setTimeout(() => {
    showHint.value = false;
  }, 6000);
};

const handleCollectSample = () => {
  if (selectedTargetId.value !== null) {
    props.system.collectSample(selectedTargetId.value);
    gameState.value = props.system.getState();
  }
};

const handleVerdict = (verdict: 'genuine' | 'fake') => {
  if (selectedTargetId.value !== null) {
    const verdictResult = props.system.makeVerdict(selectedTargetId.value, verdict);
    if (verdictResult) {
      emit('verdict', verdictResult);
    }
    selectedTargetId.value = null;
    gameState.value = props.system.getState();
  }
};

const handleClosePanel = () => {
  selectedTargetId.value = null;
};

const handleRestart = () => {
  showHint.value = true;
  selectedTargetId.value = null;
  result.value = null;
  props.system.startGame();
  setTimeout(() => {
    showHint.value = false;
  }, 4000);
};

const handleHome = () => {
  emit('close');
};

const handleOpenCollection = () => {
  showCollection.value = true;
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

const selectTarget = (targetId: number) => {
  selectedTargetId.value = targetId;
};

watch(() => gameState.value.currentTargetId, (newId) => {
  if (newId !== null && selectedTargetId.value === null) {
    selectedTargetId.value = newId;
  }
});

defineExpose({
  selectTarget,
});
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
  backdrop-filter: blur(8px);
}

.intro-content,
.result-content {
  width: 100%;
  max-width: 420px;
  max-height: 100vh;
  overflow-y: auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title-section {
  text-align: center;
}

.mode-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(255, 102, 255, 0.2), rgba(0, 170, 255, 0.2));
  border: 1px solid rgba(255, 102, 255, 0.4);
  border-radius: 20px;
  color: #ff66ff;
  font-size: 11px;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.game-title {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff66ff 0%, #00aaff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  margin: 0;
}

.subtitle {
  font-size: 10px;
  color: rgba(255, 102, 255, 0.4);
  letter-spacing: 6px;
  margin-top: 4px;
  text-transform: uppercase;
}

.lab-animation {
  position: relative;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

.waveform-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 100%;
  height: 80px;
  opacity: 0.6;
}

.wave-bar {
  width: 4px;
  background: linear-gradient(180deg, #ff66ff, #00aaff);
  border-radius: 2px;
  animation: wave-pulse 1.5s ease-in-out infinite;
}

@keyframes wave-pulse {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

.lab-icon {
  position: absolute;
  font-size: 48px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.briefing,
.instructions,
.risk-table {
  background: rgba(0, 30, 50, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 12px;
  padding: 14px;
}

.briefing-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00ffcc;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px;
}

.briefing-text {
  font-size: 12px;
  color: rgba(200, 220, 255, 0.75);
  line-height: 1.6;
}

.briefing-text strong {
  color: #ffcc00;
  font-weight: bold;
}

.instructions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: rgba(200, 220, 255, 0.7);
}

.instruction-item .icon {
  font-size: 16px;
  flex-shrink: 0;
}

.instruction-item.highlight {
  color: #00ffcc;
}

.instruction-item.warn {
  color: #ffcc00;
}

.instruction-item.danger {
  color: #ff6666;
}

.risk-title {
  font-size: 12px;
  font-weight: bold;
  color: #00ffcc;
  margin-bottom: 10px;
  text-align: center;
  letter-spacing: 2px;
}

.risk-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.risk-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto auto;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11px;
  align-items: center;
}

.risk-row.extreme {
  background: rgba(255, 51, 85, 0.15);
  border: 1px solid rgba(255, 51, 85, 0.3);
  color: #ff3355;
}

.risk-row.high {
  background: rgba(255, 136, 68, 0.12);
  border: 1px solid rgba(255, 136, 68, 0.25);
  color: #ff8844;
}

.risk-row.medium {
  background: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.2);
  color: #ffcc00;
}

.risk-row.low {
  background: rgba(102, 255, 153, 0.08);
  border: 1px solid rgba(102, 255, 153, 0.2);
  color: #66ff99;
}

.risk-label {
  font-weight: bold;
}

.risk-rate,
.risk-reward,
.risk-penalty {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.high-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(255, 204, 0, 0.12), rgba(255, 136, 0, 0.12));
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 10px;
}

.score-label {
  font-size: 12px;
  color: rgba(255, 204, 0, 0.8);
}

.score-value {
  font-size: 20px;
  font-weight: bold;
  color: #ffcc00;
  font-family: 'Courier New', monospace;
}

.start-btn {
  position: relative;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ff66ff 0%, #00aaff 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 3px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255, 102, 255, 0.4);
}

.start-btn:active {
  transform: translateY(0);
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: btn-shine 2s ease-in-out infinite;
}

@keyframes btn-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.back-btn {
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 8px;
  color: rgba(0, 255, 200, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(0, 255, 170, 0.1);
  border-color: rgba(0, 255, 170, 0.5);
  color: rgba(0, 255, 200, 0.9);
}

.analysis-panel {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 420px;
  max-height: 65%;
  background: linear-gradient(180deg, rgba(0, 20, 40, 0.95), rgba(0, 10, 25, 0.98));
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-bottom: none;
  border-radius: 20px 20px 0 0;
  padding: 16px;
  z-index: 50;
  overflow-y: auto;
  animation: slide-up 0.3s ease;
  backdrop-filter: blur(10px);
}

@keyframes slide-up {
  from { transform: translate(-50%, 100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.target-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.target-icon {
  font-size: 36px;
}

.target-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.target-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.target-category {
  font-size: 11px;
  letter-spacing: 1px;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 100, 100, 0.15);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 50%;
  color: #ff6666;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.25);
}

.risk-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 13px;
  font-weight: bold;
  color: #00ffcc;
  letter-spacing: 1px;
}

.sample-count {
  font-size: 12px;
  color: rgba(200, 220, 255, 0.6);
  font-family: 'Courier New', monospace;
}

.samples-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}

.sample-card {
  aspect-ratio: 1;
  background: rgba(0, 40, 70, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.sample-card.empty {
  border-style: dashed;
  opacity: 0.4;
}

.sample-id {
  font-size: 9px;
  color: rgba(0, 255, 200, 0.6);
  font-family: 'Courier New', monospace;
}

.sample-features {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: center;
}

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: all 0.2s;
}

.sample-time {
  font-size: 8px;
  color: rgba(200, 220, 255, 0.4);
  font-family: 'Courier New', monospace;
}

.empty-hint {
  font-size: 9px;
  color: rgba(200, 220, 255, 0.3);
}

.sample-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, rgba(0, 170, 255, 0.2), rgba(0, 255, 204, 0.2));
  border: 1px solid rgba(0, 170, 255, 0.4);
  border-radius: 10px;
  color: #00aaff;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  margin-bottom: 14px;
}

.sample-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 170, 255, 0.3), rgba(0, 255, 204, 0.3));
  transform: translateY(-1px);
}

.sample-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cost {
  font-size: 10px;
  opacity: 0.7;
}

.risk-profile {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1px;
}

.risk-profile.extreme {
  background: rgba(255, 51, 85, 0.2);
  color: #ff3355;
}

.risk-profile.high {
  background: rgba(255, 136, 68, 0.2);
  color: #ff8844;
}

.risk-profile.medium {
  background: rgba(255, 204, 0, 0.2);
  color: #ffcc00;
}

.risk-profile.low {
  background: rgba(102, 255, 153, 0.2);
  color: #66ff99;
}

.risk-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.metric {
  background: rgba(0, 30, 50, 0.5);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.metric-label {
  font-size: 10px;
  color: rgba(200, 220, 255, 0.5);
  display: block;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.metric-value.success { color: #66ff99; }
.metric-value.reward { color: #ffcc00; }
.metric-value.penalty { color: #ff6666; }

.predicted-score {
  background: rgba(0, 30, 50, 0.4);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.score-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  padding: 3px 0;
  color: rgba(200, 220, 255, 0.7);
}

.score-row.high-risk {
  color: #ff8844;
  border-top: 1px dashed rgba(255, 136, 68, 0.3);
  margin-top: 4px;
  padding-top: 6px;
}

.positive {
  color: #66ff99;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.negative {
  color: #ff6666;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.verdict-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.verdict-btn {
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  letter-spacing: 1px;
}

.verdict-btn.genuine {
  background: linear-gradient(135deg, #00cc66, #00ff88);
  color: #003311;
}

.verdict-btn.genuine:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.4);
}

.verdict-btn.fake {
  background: linear-gradient(135deg, #ff4466, #ff6688);
  color: #330011;
}

.verdict-btn.fake:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 68, 102, 0.4);
}

.hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 10px;
  color: rgba(255, 204, 0, 0.8);
  font-size: 11px;
}

.result-header {
  text-align: center;
  margin-bottom: 16px;
}

.rank-badge {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  animation: rank-pop 0.5s ease;
}

@keyframes rank-pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.rank-badge.S {
  background: linear-gradient(135deg, #ffdd00, #ff8800);
  box-shadow: 0 0 30px rgba(255, 221, 0, 0.5);
}

.rank-badge.A {
  background: linear-gradient(135deg, #00ff88, #00cc66);
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
}

.rank-badge.B {
  background: linear-gradient(135deg, #00aaff, #0088cc);
  box-shadow: 0 0 16px rgba(0, 170, 255, 0.3);
}

.rank-badge.C {
  background: linear-gradient(135deg, #aa88ff, #8866dd);
  box-shadow: 0 0 12px rgba(170, 136, 255, 0.3);
}

.rank-badge.D {
  background: linear-gradient(135deg, #888888, #666666);
  box-shadow: 0 0 8px rgba(136, 136, 136, 0.3);
}

.rank-letter {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.result-title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.new-record {
  color: #ffdd00;
  animation: glow 1.5s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { text-shadow: 0 0 10px rgba(255, 221, 0, 0.5); }
  50% { text-shadow: 0 0 20px rgba(255, 221, 0, 0.8); }
}

.final-score {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba(0, 255, 204, 0.1), rgba(0, 170, 255, 0.1));
  border: 1px solid rgba(0, 255, 204, 0.3);
  border-radius: 14px;
  margin-bottom: 16px;
}

.final-score .score-label {
  font-size: 12px;
  color: rgba(0, 255, 200, 0.6);
  display: block;
  margin-bottom: 4px;
}

.final-score .score-value {
  font-size: 36px;
  font-weight: bold;
  color: #00ffcc;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 20px rgba(0, 255, 200, 0.4);
}

.result-stats {
  background: rgba(0, 30, 50, 0.5);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 14px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  border-bottom: 1px solid rgba(0, 255, 170, 0.08);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row.highlight {
  background: rgba(255, 136, 68, 0.1);
  margin: 4px -8px;
  padding: 8px;
  border-radius: 8px;
}

.stat-label {
  color: rgba(200, 220, 255, 0.6);
}

.stat-value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-family: 'Courier New', monospace;
}

.stat-value.correct { color: #66ff99; }
.stat-value.wrong { color: #ff6666; }
.stat-value.bonus { color: #ff8844; }
.stat-value.combo { color: #ffcc00; }

.session-unlocks {
  background: rgba(0, 40, 60, 0.4);
  border: 1px solid rgba(0, 255, 170, 0.2);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 14px;
}

.unlocks-title {
  font-size: 12px;
  font-weight: bold;
  color: #00ffcc;
  margin-bottom: 8px;
}

.unlocks-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.unlock-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(0, 30, 50, 0.5);
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.unlock-item.new {
  background: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.3);
}

.unlock-type {
  font-size: 16px;
}

.new-badge {
  margin-left: auto;
  padding: 2px 6px;
  background: #ffcc00;
  color: #000;
  border-radius: 4px;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #00cc66, #00ff88);
  color: #003311;
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 255, 136, 0.4);
}

.action-btn.secondary {
  background: rgba(0, 40, 60, 0.6);
  border: 1px solid rgba(0, 255, 170, 0.3);
  color: #00ffcc;
}

.action-btn.secondary:hover {
  background: rgba(0, 60, 90, 0.6);
}

.action-btn.tertiary {
  background: rgba(60, 40, 80, 0.6);
  border: 1px solid rgba(255, 102, 255, 0.3);
  color: #ff66ff;
}

.action-btn.tertiary:hover {
  background: rgba(80, 50, 100, 0.6);
}

.game-hint {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 30, 50, 0.9);
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 10px;
  padding: 10px 16px;
  z-index: 30;
  animation: hint-fade 0.5s ease;
}

@keyframes hint-fade {
  from { opacity: 0; transform: translate(-50%, -10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.hint-text {
  font-size: 11px;
  color: rgba(200, 220, 255, 0.8);
  text-align: center;
  max-width: 280px;
}

.intro-content::-webkit-scrollbar,
.result-content::-webkit-scrollbar,
.analysis-panel::-webkit-scrollbar {
  width: 4px;
}

.intro-content::-webkit-scrollbar-track,
.result-content::-webkit-scrollbar-track,
.analysis-panel::-webkit-scrollbar-track {
  background: rgba(0, 50, 70, 0.3);
  border-radius: 2px;
}

.intro-content::-webkit-scrollbar-thumb,
.result-content::-webkit-scrollbar-thumb,
.analysis-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 170, 0.3);
  border-radius: 2px;
}
</style>
