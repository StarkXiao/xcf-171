<template>
  <div class="floating-scores">
    <transition-group name="float-up">
      <div
        v-for="fs in floatingScores"
        :key="fs.id"
        class="floating-item"
        :class="fs.type"
        :style="{ left: fs.x + 'px', top: fs.y + 'px' }"
      >
        <span class="float-label">{{ fs.label }}</span>
        <span class="float-value">{{ fs.value > 0 ? '+' : '' }}{{ fs.value }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface FloatingScore {
  id: number;
  value: number;
  label: string;
  type: 'collect' | 'damage' | 'levelUp' | 'bonus';
  x: number;
  y: number;
}

const floatingScores = ref<FloatingScore[]>([]);
let nextId = 1;

const addScore = (value: number, label: string, type: 'collect' | 'damage' | 'levelUp' | 'bonus', x: number, y: number) => {
  const id = nextId++;
  floatingScores.value.push({ id, value, label, type, x, y });
  setTimeout(() => {
    floatingScores.value = floatingScores.value.filter((f) => f.id !== id);
  }, 1500);
};

defineExpose({ addScore });
</script>

<style scoped>
.floating-scores {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.floating-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
  animation: float 1.5s ease-out forwards;
}

.float-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

.float-value {
  font-size: 20px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px currentColor, 0 2px 4px rgba(0, 0, 0, 0.5);
}

.floating-item.collect .float-value {
  color: #00ffcc;
}

.floating-item.damage .float-value {
  color: #ff4466;
}

.floating-item.levelUp .float-value {
  color: #ffcc00;
}

.floating-item.bonus .float-value {
  color: #00ffaa;
}

.float-up-enter-active {
  animation: float 1.5s ease-out;
}

.float-up-leave-active {
  animation: float 1.5s ease-out;
}

@keyframes float {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -70%) scale(1.1);
  }
  40% {
    transform: translate(-50%, -90%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -160%) scale(0.9);
  }
}
</style>
