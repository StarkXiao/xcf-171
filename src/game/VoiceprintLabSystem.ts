import * as PIXI from 'pixi.js';
import type {
  Position,
  VoiceprintTarget,
  VoiceprintSample,
  VoiceprintVerdict,
  VoiceprintLabState,
  VoiceprintLabEvent,
  VoiceprintEchoFeature,
  SonarWave,
  UnlockEvent,
  TargetType,
} from '../types/game';
import {
  VOICEPRINT_CONFIG,
  generateVoiceprintTarget,
  getRiskProfile,
  calculateVerdictPoints,
  getRank,
  generateEchoFeatures,
  RISK_LEVEL_INFO,
} from '../config/voiceprintLab';
import { CollectionSystem } from './CollectionSystem';
import type { ScoreEvent } from './ScoreSystem';

let waveIdCounter = 1;
let sampleIdCounter = 1;

export class VoiceprintLabSystem {
  private app?: PIXI.Application;
  private container?: PIXI.Container;
  private mapContainer?: PIXI.Container;
  private waveContainer?: PIXI.Container;
  private targetContainer?: PIXI.Container;
  private echoContainer?: PIXI.Container;
  private gridContainer?: PIXI.Container;
  private particleContainer?: PIXI.Container;

  private width: number;
  private height: number;
  private cameraY: number = 0;
  private viewportHeight: number;
  private particles: Array<{ sprite: PIXI.Graphics; vy: number; vx: number; life: number; maxLife: number }> = [];

  private state: VoiceprintLabState;
  private collection: CollectionSystem;
  private waves: SonarWave[] = [];
  private lastRechargeTime: number = 0;

  private onStateChange?: (state: VoiceprintLabState) => void;
  private onEvent?: (event: VoiceprintLabEvent) => void;
  private onGameOver?: (result: any) => void;
  private onScoreEvent?: (event: ScoreEvent) => void;
  private highScore: number = 0;

  constructor(containerOrSystem: HTMLElement | CollectionSystem, collectionSystem?: CollectionSystem) {
    this.width = 400;
    this.height = 700;

    let htmlContainer: HTMLElement | null = null;

    if (containerOrSystem instanceof HTMLElement) {
      htmlContainer = containerOrSystem;
      this.collection = collectionSystem!;
      this.viewportHeight = htmlContainer.clientHeight;

      this.app = new PIXI.Application({
        width: htmlContainer.clientWidth,
        height: this.viewportHeight,
        backgroundColor: 0x000510,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      htmlContainer.appendChild(this.app.view as HTMLCanvasElement);

      this.container = new PIXI.Container();
      this.app.stage.addChild(this.container);

      this.mapContainer = new PIXI.Container();
      this.gridContainer = new PIXI.Container();
      this.targetContainer = new PIXI.Container();
      this.echoContainer = new PIXI.Container();
      this.waveContainer = new PIXI.Container();
      this.particleContainer = new PIXI.Container();

      this.container.addChild(this.mapContainer);
      this.mapContainer.addChild(this.gridContainer);
      this.mapContainer.addChild(this.targetContainer);
      this.mapContainer.addChild(this.echoContainer);
      this.mapContainer.addChild(this.waveContainer);
      this.mapContainer.addChild(this.particleContainer);

      this.drawBackground();
      this.drawGrid();
      this.createParticles();

      window.addEventListener('resize', this.handleResize.bind(this));
    } else {
      this.collection = containerOrSystem;
      this.viewportHeight = 700;
    }

    this.state = this.createInitialState();
  }

  private createInitialState(): VoiceprintLabState {
    return {
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      score: 0,
      lives: VOICEPRINT_CONFIG.GAME.INITIAL_LIVES,
      maxLives: VOICEPRINT_CONFIG.GAME.INITIAL_LIVES,
      sonarCharges: VOICEPRINT_CONFIG.GAME.INITIAL_SONAR_CHARGES,
      maxSonarCharges: VOICEPRINT_CONFIG.GAME.MAX_SONAR_CHARGES,
      level: 1,
      currentTargetId: null,
      targets: [],
      collectedSamples: [],
      verdictHistory: [],
      correctVerdicts: 0,
      wrongVerdicts: 0,
      consecutiveCorrect: 0,
      maxConsecutiveCorrect: 0,
      highRiskBonus: 0,
      totalSonarUsed: 0,
      targetsAnalyzed: 0,
      targetsRemaining: 0,
    };
  }

  setCallbacks(
    onStateChange: (state: VoiceprintLabState) => void,
    onEvent: (event: VoiceprintLabEvent) => void,
    onGameOver: (result: any) => void,
    onScoreEvent: (event: ScoreEvent) => void
  ) {
    this.onStateChange = onStateChange;
    this.onEvent = onEvent;
    this.onGameOver = onGameOver;
    this.onScoreEvent = onScoreEvent;
  }

  startGame() {
    this.state = this.createInitialState();
    this.state.isPlaying = true;
    this.generateLevelTargets();
    this.lastRechargeTime = Date.now();
    this.waves = [];
    this.notifyStateChange();

    if (this.app && !this.app.ticker.started) {
      this.startGameLoop();
    }
  }

  private generateLevelTargets() {
    const count = VOICEPRINT_CONFIG.GAME.TARGETS_PER_LEVEL + Math.floor(this.state.level / 2);
    for (let i = 0; i < count; i++) {
      const target = generateVoiceprintTarget(this.width, this.height, this.state.targets);
      this.state.targets.push(target);
    }
    this.state.targetsRemaining = this.state.targets.filter(t => !t.analyzed).length;
  }

  private startGameLoop() {
    if (!this.app) return;
    this.app.ticker.add((deltaTime) => {
      if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;

      const delta = (deltaTime as unknown as PIXI.Ticker).deltaTime
        ? (deltaTime as unknown as PIXI.Ticker).deltaTime / 60
        : (deltaTime as number) / 60;

      this.update(delta);
      this.render();
    });
  }

  private update(delta: number) {
    this.updateParticles(delta);
    this.updateWaves(delta);

    const now = Date.now();
    if (now - this.lastRechargeTime >= VOICEPRINT_CONFIG.GAME.SONAR_RECHARGE_TIME) {
      if (this.state.sonarCharges < this.state.maxSonarCharges) {
        this.state.sonarCharges++;
        this.notifyStateChange();
      }
      this.lastRechargeTime = now;
    }
  }

  private updateWaves(delta: number) {
    for (const wave of this.waves) {
      if (!wave.active) continue;

      const prevRadius = wave.radius;
      wave.radius += wave.speed * delta;
      wave.alpha = Math.max(0, 1 - wave.radius / wave.maxRadius);

      if (wave.radius >= wave.maxRadius) {
        wave.active = false;
        continue;
      }

      for (const target of this.state.targets) {
        if (target.analyzed) continue;

        const dx = target.position.x - wave.position.x;
        const dy = target.position.y - wave.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= prevRadius - target.radius && dist <= wave.radius + target.radius) {
          if (!target.revealed) {
            target.revealed = true;
            this.onEvent?.({ type: 'target_revealed', target });
            this.notifyStateChange();
          }
        }
      }
    }

    this.waves = this.waves.filter(w => w.active);
  }

  private render() {
    this.renderTargets();
    this.renderWaves();
    this.renderEchos();
  }

  private renderTargets() {
    if (!this.targetContainer) return;
    this.targetContainer.removeChildren();

    for (const target of this.state.targets) {
      if (!target.revealed) continue;

      const g = new PIXI.Graphics();
      const riskInfo = RISK_LEVEL_INFO[target.riskLevel];

      if (target.analyzed) {
        const color = target.verdictCorrect ? 0x00ff88 : 0xff4466;
        g.lineStyle(2, color, 0.8);
        g.beginFill(color, 0.1);
        g.drawCircle(target.position.x, target.position.y, target.radius);
        g.endFill();

        const iconText = new PIXI.Text(target.icon, {
          fontSize: 28,
          fill: target.verdictCorrect ? '#00ff88' : '#ff4466',
          align: 'center',
        });
        iconText.anchor.set(0.5);
        iconText.position.set(target.position.x, target.position.y);
        this.targetContainer.addChild(iconText);
      } else {
        g.lineStyle(2, riskInfo.color.replace('#', '0x'), 0.6);
        g.beginFill(riskInfo.color.replace('#', '0x'), 0.1);
        g.drawCircle(target.position.x, target.position.y, target.radius);
        g.endFill();

        g.lineStyle(1, riskInfo.color.replace('#', '0x'), 0.3);
        const pulsePhase = (Date.now() % 2000) / 2000;
        g.drawCircle(target.position.x, target.position.y, target.radius + 10 + pulsePhase * 15);

        const iconText = new PIXI.Text(target.icon, {
          fontSize: 28,
          fill: '#ffffff',
          align: 'center',
        });
        iconText.anchor.set(0.5);
        iconText.position.set(target.position.x, target.position.y);
        this.targetContainer.addChild(iconText);

        const samplesForTarget = this.state.collectedSamples.filter(s => s.targetId === target.id).length;
        if (samplesForTarget > 0) {
          const sampleText = new PIXI.Text(`${samplesForTarget}/${VOICEPRINT_CONFIG.GAME.SAMPLES_PER_TARGET}`, {
            fontSize: 11,
            fill: '#00ffcc',
            fontFamily: 'Courier New',
            align: 'center',
          });
          sampleText.anchor.set(0.5);
          sampleText.position.set(target.position.x, target.position.y + target.radius + 15);
          this.targetContainer.addChild(sampleText);
        }
      }

      this.targetContainer.addChild(g);
    }
  }

  private renderWaves() {
    if (!this.waveContainer) return;
    this.waveContainer.removeChildren();

    for (const wave of this.waves) {
      const g = new PIXI.Graphics();
      g.lineStyle(2, 0x00ffcc, wave.alpha * 0.8);
      g.drawCircle(wave.position.x, wave.position.y, wave.radius);

      g.lineStyle(1, 0x00ffaa, wave.alpha * 0.4);
      g.drawCircle(wave.position.x, wave.position.y, wave.radius * 0.7);

      this.waveContainer.addChild(g);
    }
  }

  private renderEchos() {
    if (!this.echoContainer) return;
    this.echoContainer.removeChildren();

    const currentTarget = this.state.targets.find(t => t.id === this.state.currentTargetId);
    if (!currentTarget) return;

    const samples = this.state.collectedSamples.filter(s => s.targetId === currentTarget.id);
    const centerX = this.width / 2;
    const centerY = this.height + 100;

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      for (let j = 0; j < sample.features.length; j++) {
        const feature = sample.features[j];
        const angle = (i / samples.length) * Math.PI * 2 + (j / sample.features.length) * 0.3;
        const dist = 80 + feature.frequency * 0.3;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;

        const g = new PIXI.Graphics();
        const color = feature.isGenuine ? 0x00ff88 : 0xff6688;
        g.beginFill(color, 0.6 + feature.amplitude * 0.4);
        g.drawCircle(x, y, 3 + feature.amplitude * 4);
        g.endFill();

        this.echoContainer.addChild(g);
      }
    }
  }

  fireSonar(position: Position): boolean {
    if (this.state.sonarCharges < VOICEPRINT_CONFIG.SONAR.SAMPLE_COST) return false;

    this.state.sonarCharges -= VOICEPRINT_CONFIG.SONAR.SAMPLE_COST;
    this.state.totalSonarUsed++;

    const wave: SonarWave = {
      id: waveIdCounter++,
      position: { ...position },
      radius: 0,
      maxRadius: 200,
      speed: 250,
      active: true,
      alpha: 1,
    };
    this.waves.push(wave);

    this.onEvent?.({
      type: 'sonar_fired',
      position: { ...position },
      cost: VOICEPRINT_CONFIG.SONAR.SAMPLE_COST,
    });

    this.notifyStateChange();
    return true;
  }

  collectSample(targetOrId: VoiceprintTarget | number): VoiceprintSample | null {
    const target = typeof targetOrId === 'number'
      ? this.state.targets.find(t => t.id === targetOrId)
      : targetOrId;
    if (!target) return null;

    if (this.state.sonarCharges < VOICEPRINT_CONFIG.SONAR.PRECISE_SAMPLE_COST) return null;

    const existingSamples = this.state.collectedSamples.filter(s => s.targetId === target.id);
    if (existingSamples.length >= VOICEPRINT_CONFIG.GAME.SAMPLES_PER_TARGET) return null;

    this.state.sonarCharges -= VOICEPRINT_CONFIG.SONAR.PRECISE_SAMPLE_COST;
    this.state.totalSonarUsed++;

    const featureCount = 2 + Math.floor(Math.random() * 3);
    const genuineChance = existingSamples.length < 2 ? 0.4 : 0.6;
    const features = [];

    for (let i = 0; i < featureCount; i++) {
      const isGenuine = Math.random() < genuineChance;
      const sourcePool = isGenuine ? target.genuineFeatures : target.decoyFeatures;
      const template = sourcePool[Math.floor(Math.random() * sourcePool.length)];
      
      features.push({
        ...template,
        id: Date.now() + i + Math.random() * 10000,
        frequency: template.frequency + (Math.random() - 0.5) * 20,
        amplitude: Math.max(0.1, Math.min(1, template.amplitude + (Math.random() - 0.5) * 0.2)),
      });
    }

    const sample: VoiceprintSample = {
      id: sampleIdCounter++,
      targetId: target.id,
      targetName: target.name,
      features,
      collectedAt: Date.now(),
      sonarCost: VOICEPRINT_CONFIG.SONAR.PRECISE_SAMPLE_COST,
    };

    this.state.collectedSamples.push(sample);
    this.state.currentTargetId = target.id;

    this.onEvent?.({ type: 'sample_collected', sample });
    this.notifyStateChange();

    return sample;
  }

  makeVerdict(targetId: number, verdict: 'genuine' | 'fake'): VoiceprintVerdict | null {
    const target = this.state.targets.find(t => t.id === targetId);
    if (!target || target.analyzed) return null;

    const samples = this.state.collectedSamples.filter(s => s.targetId === targetId);
    if (samples.length === 0) return null;

    const isCorrect = (verdict === 'genuine') === target.isGenuine;
    const { pointsGained, pointsLost } = calculateVerdictPoints(
      target.basePoints,
      samples.length,
      isCorrect,
      this.state.consecutiveCorrect
    );

    const projectedScore = isCorrect 
      ? this.state.score + pointsGained + (samples.length <= VOICEPRINT_CONFIG.RISK.HIGH_RISK_THRESHOLD ? Math.round(pointsGained * 0.5) : 0)
      : Math.max(0, this.state.score - pointsLost);
    const isNewHighScore = projectedScore > this.highScore;

    const verdictObj: VoiceprintVerdict = {
      targetId,
      targetName: target.name,
      samplesUsed: samples.length,
      userVerdict: verdict,
      actualIsGenuine: target.isGenuine,
      isCorrect,
      pointsGained,
      pointsLost,
      timestamp: Date.now(),
      totalScore: projectedScore,
      isNewHighScore,
    };

    target.analyzed = true;
    target.verdictCorrect = isCorrect;
    this.state.verdictHistory.push(verdictObj);
    this.state.targetsAnalyzed++;

    if (isCorrect) {
      this.state.score += pointsGained;
      this.state.correctVerdicts++;
      this.state.consecutiveCorrect++;
      if (this.state.consecutiveCorrect > this.state.maxConsecutiveCorrect) {
        this.state.maxConsecutiveCorrect = this.state.consecutiveCorrect;
      }

      if (samples.length <= VOICEPRINT_CONFIG.RISK.HIGH_RISK_THRESHOLD) {
        const highRiskBonus = Math.round(pointsGained * 0.5);
        this.state.highRiskBonus += highRiskBonus;
        this.state.score += highRiskBonus;
        this.onEvent?.({
          type: 'bonus_gained',
          points: highRiskBonus,
          reason: '高风险奖励',
        });
      }

      if (this.state.consecutiveCorrect > 1) {
        this.onEvent?.({
          type: 'combo_increase',
          combo: this.state.consecutiveCorrect,
        });
      }

      const targetType = target.category === 'anomaly' ? 'danger' : target.category;
      const pseudoTarget = {
        id: target.id,
        type: targetType as TargetType,
        position: target.position,
        radius: target.radius,
        name: target.name,
        points: pointsGained,
        discovered: true,
        collected: true,
        shape: 'circle' as const,
        rotation: 0,
      };
      this.collection.recordTarget(pseudoTarget, this.state.level, pointsGained);

      this.onScoreEvent?.({
        points: pointsGained,
        targetName: target.name,
        type: 'collect',
        position: target.position,
      });

      if (samples.length <= VOICEPRINT_CONFIG.RISK.EXTREME_RISK_THRESHOLD) {
        this.onEvent?.({
          type: 'bonus_gained',
          points: pointsGained,
          reason: `${getRiskProfile(samples.length).label}!`,
        });
      }
    } else {
      this.state.score = Math.max(0, this.state.score - pointsLost);
      this.state.wrongVerdicts++;
      this.state.consecutiveCorrect = 0;
      this.state.lives--;

      this.onEvent?.({ type: 'combo_break' });
      this.onEvent?.({
        type: 'life_lost',
        reason: '判定错误',
      });

      this.onScoreEvent?.({
        points: -pointsLost,
        targetName: target.name,
        type: 'damage',
        position: target.position,
      });
    }

    this.onEvent?.({ type: 'verdict_made', verdict: verdictObj });

    const unanalyzedTargets = this.state.targets.filter(t => !t.analyzed);
    this.state.targetsRemaining = unanalyzedTargets.length;

    if (unanalyzedTargets.length === 0) {
      this.state.level++;
      const levelBonus = VOICEPRINT_CONFIG.GAME.LEVEL_UP_BONUS * this.state.level;
      this.state.score += levelBonus;
      this.onEvent?.({
        type: 'level_up',
        newLevel: this.state.level,
        bonus: levelBonus,
      });
      this.onScoreEvent?.({
        points: levelBonus,
        targetName: `等级 ${this.state.level}`,
        type: 'levelUp',
        position: { x: 0, y: 0 },
      });
      this.generateLevelTargets();
    }

    if (this.state.lives <= 0) {
      this.endGame();
    }

    this.notifyStateChange();
    return verdictObj;
  }

  setHighScore(score: number): void {
    this.highScore = score;
  }

  getState(): VoiceprintLabState {
    return { ...this.state };
  }

  getSessionUnlocks(): UnlockEvent[] {
    return this.collection.getSessionUnlocks();
  }

  getResult() {
    const totalVerdicts = this.state.correctVerdicts + this.state.wrongVerdicts;
    const accuracy = totalVerdicts > 0 ? this.state.correctVerdicts / totalVerdicts : 0;
    const rank = getRank(accuracy, this.state.score, this.state.level);

    const highScore = this.getHighScore();
    const isNewRecord = this.state.score > highScore;

    if (isNewRecord) {
      try {
        localStorage.setItem('deepSeaSonar_voiceprintHighScore', String(this.state.score));
      } catch (_e) {}
    }

    return {
      finalScore: this.state.score,
      level: this.state.level,
      correctVerdicts: this.state.correctVerdicts,
      wrongVerdicts: this.state.wrongVerdicts,
      accuracy,
      totalSonarUsed: this.state.totalSonarUsed,
      highRiskBonus: this.state.highRiskBonus,
      maxConsecutiveCorrect: this.state.maxConsecutiveCorrect,
      isNewRecord,
      rank,
      sessionUnlocks: this.getSessionUnlocks(),
      verdictHistory: [...this.state.verdictHistory],
    };
  }

  getHighScore(): number {
    try {
      const saved = localStorage.getItem('deepSeaSonar_voiceprintHighScore');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (_e) {
      return 0;
    }
  }

  private endGame() {
    this.state.isPlaying = false;
    this.state.isGameOver = true;
    const result = this.getResult();
    this.onGameOver?.(result);
    this.notifyStateChange();
  }

  selectTarget(targetId: number | null) {
    this.state.currentTargetId = targetId;
    this.notifyStateChange();
  }

  getSamplesForTarget(targetId: number): VoiceprintSample[] {
    return this.state.collectedSamples.filter(s => s.targetId === targetId);
  }

  getTargetById(targetId: number): VoiceprintTarget | undefined {
    return this.state.targets.find(t => t.id === targetId);
  }

  screenToWorld(screenX: number, screenY: number): Position {
    if (!this.app) {
      return { x: screenX, y: screenY + this.cameraY };
    }
    const rect = (this.app.view as HTMLCanvasElement).getBoundingClientRect();
    const scaleX = this.width / rect.width;
    return {
      x: screenX * scaleX,
      y: screenY + this.cameraY,
    };
  }

  handleTap(worldPos: Position): { hit: boolean; target?: VoiceprintTarget } {
    for (const target of this.state.targets) {
      if (target.analyzed) continue;

      const dx = worldPos.x - target.position.x;
      const dy = worldPos.y - target.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= target.radius + 20 && target.revealed) {
        return { hit: true, target };
      }
    }
    return { hit: false };
  }

  private notifyStateChange() {
    this.onStateChange?.({ ...this.state });
  }

  private drawBackground() {
    if (!this.mapContainer) return;
    const bg = new PIXI.Graphics();
    const gradient = this.createGradient();
    bg.beginTextureFill({ texture: gradient });
    bg.drawRect(0, 0, this.width, this.height);
    bg.endFill();
    if (this.mapContainer.children[0]) {
      this.mapContainer.removeChildAt(0);
    }
    this.mapContainer.addChildAt(bg, 0);
  }

  private createGradient(): PIXI.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#001a2e');
    gradient.addColorStop(0.5, '#000a1a');
    gradient.addColorStop(1, '#000510');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    return PIXI.Texture.from(canvas);
  }

  private drawGrid() {
    if (!this.gridContainer) return;
    this.gridContainer.removeChildren();
    const g = new PIXI.Graphics();
    g.lineStyle(1, 0x00ffaa, 0.05);

    for (let x = 0; x <= this.width; x += 40) {
      g.moveTo(x, 0);
      g.lineTo(x, this.height);
    }
    for (let y = 0; y <= this.height; y += 40) {
      g.moveTo(0, y);
      g.lineTo(this.width, y);
    }

    this.gridContainer.addChild(g);
  }

  private createParticles() {
    if (!this.particleContainer) return;
    for (let i = 0; i < 30; i++) {
      const g = new PIXI.Graphics();
      g.beginFill(0x00ffcc, 0.3 + Math.random() * 0.3);
      g.drawCircle(0, 0, 1 + Math.random() * 2);
      g.endFill();

      g.position.set(
        Math.random() * this.width,
        Math.random() * this.height
      );

      this.particleContainer.addChild(g);
      this.particles.push({
        sprite: g,
        vy: 5 + Math.random() * 15,
        vx: (Math.random() - 0.5) * 5,
        life: Math.random() * 10,
        maxLife: 10 + Math.random() * 10,
      });
    }
  }

  private updateParticles(delta: number) {
    for (const p of this.particles) {
      p.sprite.y += p.vy * delta;
      p.sprite.x += p.vx * delta;
      p.life -= delta;

      if (p.sprite.y > this.height + 10 || p.life <= 0) {
        p.sprite.y = -10;
        p.sprite.x = Math.random() * this.width;
        p.life = p.maxLife;
      }

      p.sprite.alpha = Math.min(1, p.life / p.maxLife) * (0.3 + Math.random() * 0.3);
    }
  }

  private handleResize() {
    if (!this.app) return;
    const parent = (this.app.view as HTMLCanvasElement).parentElement;
    if (!parent) return;
    this.viewportHeight = parent.clientHeight;
    this.app.renderer.resize(parent.clientWidth, this.viewportHeight);
    this.drawBackground();
    this.drawGrid();
  }

  getTicker() {
    return this.app?.ticker || null;
  }

  destroy() {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    }
  }
}
