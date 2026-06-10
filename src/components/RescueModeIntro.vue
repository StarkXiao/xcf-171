<template>
  <div class="overlay">
    <div class="overlay-content">
      <div class="title-container">
        <div class="mode-badge">🚨 紧急任务</div>
        <h1 class="game-title">深海救援模式</h1>
        <div class="subtitle">Deep Sea Rescue Operation</div>
      </div>

      <div class="capsule-animation">
        <div class="capsule-icon">🛟</div>
        <div class="pulse-ring ring-1"></div>
        <div class="pulse-ring ring-2"></div>
        <div class="pulse-ring ring-3"></div>
      </div>

      <div class="mission-brief">
        <div class="brief-header">
          <span class="brief-icon">📋</span>
          <span>任务简报</span>
        </div>
        <div class="brief-text">
          深海失联舱体发出求救信号！在复杂干扰环境下，你需要在限定时间内定位并救援所有真实舱体。
        </div>
      </div>

      <div class="instructions">
        <div class="instruction-item">
          <span class="icon">🔊</span>
          <span>释放声呐探测可疑信号源</span>
        </div>
        <div class="instruction-item">
          <span class="icon">📡</span>
          <span>点击可疑回波进行确认</span>
        </div>
        <div class="instruction-item warn">
          <span class="icon">⚠️</span>
          <span>小心假目标！误报将受惩罚</span>
        </div>
        <div class="instruction-item danger">
          <span class="icon">⏱</span>
          <span>时间耗尽或误报过多任务失败</span>
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot real"></span>
          <span>真实舱体</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot decoy"></span>
          <span>虚假目标</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot confirmed"></span>
          <span>已确认</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot interference"></span>
          <span>干扰区域</span>
        </div>
      </div>

      <div class="level-selector">
        <div class="level-label">选择难度</div>
        <div class="level-buttons">
          <button
            v-for="(lvl, idx) in levels"
            :key="idx"
            class="level-btn"
            :class="{ active: selectedLevel === idx }"
            @click="selectedLevel = idx"
          >
            <span class="level-num">Lv.{{ idx + 1 }}</span>
            <span class="level-desc">{{ lvl.desc }}</span>
          </button>
        </div>
      </div>

      <div class="best-record" v-if="bestScores[selectedLevel] > 0">
        <span class="record-label">本关最佳</span>
        <span class="record-value">{{ bestScores[selectedLevel].toLocaleString() }}</span>
      </div>

      <button class="start-btn" @click="$emit('start', selectedLevel + 1)">
        <span class="btn-text">🚀 开始救援</span>
        <span class="btn-glow"></span>
      </button>

      <button class="back-btn" @click="$emit('back')">
        ← 返回主页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  bestScores: number[];
}>();

defineEmits<{
  (e: 'start', level: number): void;
  (e: 'back'): void;
}>();

const selectedLevel = ref(0);

const levels = [
  { desc: '新手训练' },
  { desc: '标准任务' },
  { desc: '困难挑战' },
  { desc: '精英救援' },
  { desc: '极限深渊' },
];
</script>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(20, 0, 40, 0.95) 0%, rgba(5, 0, 20, 0.98) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.overlay-content {
  text-align: center;
  padding: 28px 22px;
  max-width: 380px;
  width: 100%;
  max-height: 100vh;
  overflow-y: auto;
}

.title-container {
  margin-bottom: 18px;
}

.mode-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  background: linear-gradient(135deg, rgba(255, 50, 100, 0.3), rgba(255, 100, 50, 0.3));
  border: 1px solid rgba(255, 100, 80, 0.5);
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  color: rgba(255, 180, 150, 0.95);
  letter-spacing: 2px;
  margin-bottom: 10px;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 80, 80, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 80, 80, 0.5); }
}

.game-title {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff6688 0%, #ff88aa 50%, #ffaacc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
  margin: 0;
  text-shadow: 0 0 40px rgba(255, 100, 150, 0.3);
}

.subtitle {
  font-size: 11px;
  color: rgba(255, 150, 180, 0.5);
  letter-spacing: 5px;
  margin-top: 6px;
  text-transform: uppercase;
}

.capsule-animation {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 20px auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capsule-icon {
  font-size: 48px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 15px rgba(255, 150, 150, 0.8));
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 100, 120, 0.5);
  border-radius: 50%;
  animation: pulse-expand 2.5s ease-out infinite;
}

.ring-1 { animation-delay: 0s; }
.ring-2 { animation-delay: 0.8s; }
.ring-3 { animation-delay: 1.6s; }

@keyframes pulse-expand {
  0% {
    width: 30px;
    height: 30px;
    opacity: 1;
  }
  100% {
    width: 140px;
    height: 140px;
    opacity: 0;
  }
}

.mission-brief {
  background: linear-gradient(135deg, rgba(255, 80, 100, 0.1), rgba(150, 50, 100, 0.1));
  border: 1px solid rgba(255, 120, 150, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  text-align: left;
}

.brief-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: bold;
  color: rgba(255, 180, 200, 0.95);
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.brief-icon { font-size: 16px; }

.brief-text {
  font-size: 12px;
  color: rgba(220, 200, 220, 0.75);
  line-height: 1.5;
}

.instructions {
  text-align: left;
  background: rgba(40, 0, 60, 0.4);
  border: 1px solid rgba(255, 120, 180, 0.18);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  font-size: 12px;
  color: rgba(220, 200, 255, 0.8);
}

.instruction-item.warn {
  color: rgba(255, 200, 120, 0.85);
}

.instruction-item.danger {
  color: rgba(255, 150, 150, 0.9);
}

.instruction-item .icon {
  font-size: 16px;
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(220, 200, 255, 0.65);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.real {
  background: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

.legend-dot.decoy {
  background: #ff8844;
  box-shadow: 0 0 8px rgba(255, 136, 68, 0.6);
}

.legend-dot.confirmed {
  background: #00ffcc;
  box-shadow: 0 0 8px rgba(0, 255, 204, 0.6);
}

.legend-dot.interference {
  background: #6644aa;
  box-shadow: 0 0 8px rgba(102, 68, 170, 0.6);
}

.level-selector {
  margin-bottom: 14px;
}

.level-label {
  font-size: 12px;
  color: rgba(255, 180, 200, 0.7);
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.level-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.level-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 10px;
  background: rgba(60, 20, 80, 0.5);
  border: 1px solid rgba(255, 120, 180, 0.25);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  min-width: 58px;
}

.level-btn:hover {
  background: rgba(90, 30, 120, 0.6);
  border-color: rgba(255, 150, 200, 0.45);
  transform: translateY(-1px);
}

.level-btn.active {
  background: linear-gradient(135deg, rgba(255, 80, 120, 0.35), rgba(200, 50, 150, 0.35));
  border-color: rgba(255, 120, 180, 0.7);
  box-shadow: 0 0 15px rgba(255, 100, 160, 0.25);
}

.level-num {
  font-size: 12px;
  font-weight: bold;
  color: rgba(255, 200, 220, 0.95);
}

.level-desc {
  font-size: 9px;
  color: rgba(220, 180, 220, 0.65);
  letter-spacing: 0.5px;
}

.best-record {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 6px 14px;
  background: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 14px;
}

.record-label {
  font-size: 11px;
  color: rgba(255, 200, 120, 0.7);
}

.record-value {
  font-size: 14px;
  font-weight: bold;
  color: #ffcc66;
  font-family: 'Courier New', monospace;
}

.start-btn {
  position: relative;
  width: 100%;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: bold;
  color: #2a0a1a;
  background: linear-gradient(135deg, #ff6699 0%, #ff4477 50%, #ff3366 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 24px rgba(255, 80, 120, 0.5);
  margin-bottom: 10px;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 32px rgba(255, 80, 140, 0.7);
}

.start-btn:active {
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

.back-btn {
  width: 100%;
  padding: 12px 24px;
  font-size: 13px;
  color: rgba(220, 200, 255, 0.75);
  background: transparent;
  border: 1px solid rgba(255, 120, 180, 0.25);
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.25s ease;
}

.back-btn:hover {
  background: rgba(255, 120, 180, 0.08);
  border-color: rgba(255, 150, 200, 0.45);
  color: rgba(240, 220, 255, 0.9);
}
</style>
