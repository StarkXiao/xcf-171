import * as PIXI from 'pixi.js';
import type { Position, RescueCapsule, InterferenceZone, RescuePath } from '../types/game';
import { RESCUE_CONFIG } from '../config/gameConfig';

interface SonarWaveLite {
  id: number;
  position: Position;
  radius: number;
  alpha: number;
}

interface EchoPointLite {
  id: number;
  position: Position;
  alpha: number;
  size: number;
  signalStrength: number;
  isReal: boolean;
}

export class RescueRenderer {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private mapContainer: PIXI.Container;
  private gridContainer: PIXI.Container;
  private interferenceContainer: PIXI.Container;
  private pathContainer: PIXI.Container;
  private capsuleContainer: PIXI.Container;
  private echoContainer: PIXI.Container;
  private waveContainer: PIXI.Container;
  private particleContainer: PIXI.Container;

  private width: number;
  private height: number;
  private cameraY: number = 0;
  private viewportHeight: number;
  private particles: Array<{ sprite: PIXI.Graphics; vy: number; vx: number }> = [];

  constructor(htmlContainer: HTMLElement, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.viewportHeight = htmlContainer.clientHeight;

    this.app = new PIXI.Application({
      width: htmlContainer.clientWidth,
      height: this.viewportHeight,
      backgroundColor: RESCUE_CONFIG.COLORS.BACKGROUND,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    htmlContainer.appendChild(this.app.view as HTMLCanvasElement);

    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    this.mapContainer = new PIXI.Container();
    this.gridContainer = new PIXI.Container();
    this.interferenceContainer = new PIXI.Container();
    this.pathContainer = new PIXI.Container();
    this.capsuleContainer = new PIXI.Container();
    this.echoContainer = new PIXI.Container();
    this.waveContainer = new PIXI.Container();
    this.particleContainer = new PIXI.Container();

    this.container.addChild(this.mapContainer);
    this.mapContainer.addChild(this.gridContainer);
    this.mapContainer.addChild(this.interferenceContainer);
    this.mapContainer.addChild(this.pathContainer);
    this.mapContainer.addChild(this.capsuleContainer);
    this.mapContainer.addChild(this.echoContainer);
    this.mapContainer.addChild(this.waveContainer);
    this.mapContainer.addChild(this.particleContainer);

    this.drawBackground();
    this.drawGrid();
    this.createParticles();

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize() {
    const parent = (this.app.view as HTMLCanvasElement).parentElement;
    if (!parent) return;
    this.viewportHeight = parent.clientHeight;
    this.app.renderer.resize(parent.clientWidth, this.viewportHeight);
    this.drawBackground();
    this.drawGrid();
  }

  private drawBackground() {
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
    gradient.addColorStop(0, '#0a0020');
    gradient.addColorStop(0.3, '#050020');
    gradient.addColorStop(0.6, '#000818');
    gradient.addColorStop(1, '#000010');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    return PIXI.Texture.from(canvas);
  }

  private drawGrid() {
    this.gridContainer.removeChildren();
    const gridSize = 60;
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, RESCUE_CONFIG.COLORS.GRID, 0.12);

    for (let x = 0; x <= this.width; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.height);
    }
    for (let y = 0; y <= this.height; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(this.width, y);
    }

    const border = new PIXI.Graphics();
    border.lineStyle(3, RESCUE_CONFIG.COLORS.SONAR, 0.4);
    border.drawRect(0, 0, this.width, this.height);

    const depthMarks = new PIXI.Graphics();
    depthMarks.lineStyle(1, RESCUE_CONFIG.COLORS.SONAR, 0.2);
    for (let y = 200; y < this.height; y += 200) {
      depthMarks.moveTo(0, y);
      depthMarks.lineTo(8, y);
      depthMarks.moveTo(this.width - 8, y);
      depthMarks.lineTo(this.width, y);
    }

    this.gridContainer.addChild(grid, border, depthMarks);
  }

  private createParticles() {
    for (let i = 0; i < 70; i++) {
      const p = new PIXI.Graphics();
      p.beginFill(0x88aaff, 0.3 + Math.random() * 0.5);
      p.drawCircle(0, 0, 0.8 + Math.random() * 1.8);
      p.endFill();
      p.x = Math.random() * this.width;
      p.y = Math.random() * this.height;
      this.particleContainer.addChild(p);
      this.particles.push({
        sprite: p,
        vy: 8 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 6,
      });
    }
  }

  public updateParticles(delta: number) {
    for (const p of this.particles) {
      p.sprite.y += p.vy * delta;
      p.sprite.x += p.vx * delta;
      if (p.sprite.y > this.height + 10) {
        p.sprite.y = -10;
        p.sprite.x = Math.random() * this.width;
      }
      if (p.sprite.x < -10) p.sprite.x = this.width + 10;
      if (p.sprite.x > this.width + 10) p.sprite.x = -10;
    }
  }

  public updateCamera(playerY: number) {
    const target = playerY - this.viewportHeight * 0.4;
    this.cameraY += (target - this.cameraY) * 0.08;
    this.cameraY = Math.max(0, Math.min(this.height - this.viewportHeight, this.cameraY));
    this.mapContainer.y = -this.cameraY;

    const offsetX = (this.app.screen.width - this.width) / 2;
    this.mapContainer.x = Math.max(0, offsetX);
  }

  public renderInterferenceZones(zones: InterferenceZone[]) {
    this.interferenceContainer.removeChildren();
    const time = Date.now() / 1000;

    for (const zone of zones) {
      let color = RESCUE_CONFIG.COLORS.INTERFERENCE_NOISE;
      if (zone.type === 'decoy') color = RESCUE_CONFIG.COLORS.INTERFERENCE_DECOY;
      else if (zone.type === 'blocker') color = RESCUE_CONFIG.COLORS.INTERFERENCE_BLOCKER;

      const pulse = 0.85 + Math.sin(time * 1.5 + zone.id) * 0.15;
      const r = zone.radius * pulse;

      const outerGlow = new PIXI.Graphics();
      outerGlow.beginFill(color, 0.06 * zone.intensity);
      outerGlow.drawCircle(zone.position.x, zone.position.y, r * 1.3);
      outerGlow.endFill();

      const haze = new PIXI.Graphics();
      const gradientCanvas = document.createElement('canvas');
      gradientCanvas.width = gradientCanvas.height = Math.ceil(r * 2);
      const gctx = gradientCanvas.getContext('2d')!;
      const grd = gctx.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0, this.hexToRgba(color, 0.3 * zone.intensity));
      grd.addColorStop(0.5, this.hexToRgba(color, 0.15 * zone.intensity));
      grd.addColorStop(1, this.hexToRgba(color, 0));
      gctx.fillStyle = grd;
      gctx.fillRect(0, 0, r * 2, r * 2);
      const hazeTexture = PIXI.Texture.from(gradientCanvas);
      haze.beginTextureFill({ texture: hazeTexture });
      haze.drawRect(zone.position.x - r, zone.position.y - r, r * 2, r * 2);
      haze.endFill();

      const ring = new PIXI.Graphics();
      ring.lineStyle(2, color, 0.25 * zone.intensity);
      const segments = 48;
      for (let i = 0; i < segments; i++) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 0.6) / segments) * Math.PI * 2;
        if (i % 2 === 0) {
          ring.moveTo(
            zone.position.x + Math.cos(a1) * r * 0.85,
            zone.position.y + Math.sin(a1) * r * 0.85
          );
          ring.lineTo(
            zone.position.x + Math.cos(a2) * r * 0.85,
            zone.position.y + Math.sin(a2) * r * 0.85
          );
        }
      }

      const innerRing = new PIXI.Graphics();
      innerRing.lineStyle(1, color, 0.35 * zone.intensity);
      innerRing.drawCircle(zone.position.x, zone.position.y, r * 0.55);

      const iconG = new PIXI.Graphics();
      iconG.lineStyle(1.5, color, 0.5 * zone.intensity);
      if (zone.type === 'noise') {
        for (let i = 0; i < 5; i++) {
          const waveY = zone.position.y - 8 + i * 4;
          const amp = 3 - Math.abs(2 - i);
          iconG.moveTo(zone.position.x - 10, waveY);
          for (let x = -10; x <= 10; x += 2) {
            iconG.lineTo(zone.position.x + x, waveY + Math.sin(x * 0.5 + time * 3) * amp);
          }
        }
      } else if (zone.type === 'decoy') {
        iconG.drawCircle(zone.position.x, zone.position.y, 5);
        iconG.moveTo(zone.position.x, zone.position.y - 8);
        iconG.lineTo(zone.position.x, zone.position.y - 14);
        iconG.moveTo(zone.position.x + 8, zone.position.y);
        iconG.lineTo(zone.position.x + 14, zone.position.y);
        iconG.moveTo(zone.position.x - 8, zone.position.y);
        iconG.lineTo(zone.position.x - 14, zone.position.y);
      } else {
        const bx = zone.position.x;
        const by = zone.position.y;
        iconG.moveTo(bx - 10, by + 6);
        iconG.lineTo(bx - 6, by - 4);
        iconG.lineTo(bx - 2, by + 2);
        iconG.lineTo(bx + 2, by - 6);
        iconG.lineTo(bx + 6, by - 2);
        iconG.lineTo(bx + 10, by + 6);
      }

      this.interferenceContainer.addChild(outerGlow, haze, ring, innerRing, iconG);
    }
  }

  private hexToRgba(hex: number, alpha: number): string {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  public renderPaths(paths: RescuePath[]) {
    this.pathContainer.removeChildren();
    const time = Date.now() / 1000;

    for (const path of paths) {
      if (path.points.length < 2) continue;

      const color = path.isSafe ? 0x00ffaa : 0xff6644;
      const alpha = path.isSafe ? 0.35 : 0.5;

      const g = new PIXI.Graphics();
      g.lineStyle(2, color, alpha);
      for (let i = 0; i < path.points.length - 1; i++) {
        const p1 = path.points[i];
        const p2 = path.points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        const dashLen = 8;
        const gapLen = 6;
        const totalLen = dashLen + gapLen;
        const steps = Math.floor(len / totalLen);
        const ux = dx / len;
        const uy = dy / len;
        for (let s = 0; s <= steps; s++) {
          const startDist = s * totalLen;
          const endDist = Math.min(startDist + dashLen, len);
          if (startDist < len) {
            g.moveTo(p1.x + ux * startDist, p1.y + uy * startDist);
            g.lineTo(p1.x + ux * endDist, p1.y + uy * endDist);
          }
        }
      }

      const animatedDash = new PIXI.Graphics();
      animatedDash.lineStyle(3, color, alpha * 0.8);
      const dashOffset = (time * 30) % 20;
      for (let i = 0; i < path.points.length - 1; i++) {
        const p1 = path.points[i];
        const p2 = path.points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        const dashLen = 6;
        const gapLen = 14;
        const totalLen = dashLen + gapLen;
        const ux = dx / len;
        const uy = dy / len;
        let startD = -dashOffset;
        while (startD < len) {
          const endD = Math.min(startD + dashLen, len);
          const actualStart = Math.max(0, startD);
          if (actualStart < endD) {
            animatedDash.moveTo(p1.x + ux * actualStart, p1.y + uy * actualStart);
            animatedDash.lineTo(p1.x + ux * endD, p1.y + uy * endD);
          }
          startD += totalLen;
        }
      }

      for (let i = 0; i < path.points.length; i++) {
        const pt = path.points[i];
        const node = new PIXI.Graphics();
        if (i === 0) {
          node.beginFill(0x44ffaa, 0.8);
          node.drawCircle(pt.x, pt.y, 6);
          node.endFill();
        } else {
          node.lineStyle(2, color, 0.7);
          node.beginFill(color, 0.3);
          node.drawCircle(pt.x, pt.y, 5);
          node.endFill();
        }
        this.pathContainer.addChild(node);
      }

      if (!path.isSafe) {
        const dLevel = Math.ceil(path.dangerLevel);
        for (let i = 0; i < dLevel; i++) {
          const mid = path.points[Math.min(path.points.length - 1, i + 1)];
          if (mid) {
            const warn = new PIXI.Graphics();
            warn.lineStyle(1.5, 0xff4466, 0.7 + Math.sin(time * 4 + i) * 0.3);
            warn.moveTo(mid.x, mid.y - 10);
            warn.lineTo(mid.x, mid.y - 2);
            warn.drawCircle(mid.x, mid.y + 3, 2);
            this.pathContainer.addChild(warn);
          }
        }
      }

      this.pathContainer.addChild(g, animatedDash);
    }
  }

  public renderCapsules(capsules: RescueCapsule[]) {
    this.capsuleContainer.removeChildren();
    const time = Date.now() / 1000;

    for (const cap of capsules) {
      if (cap.status === 'unknown') continue;

      let color: number;
      if (cap.status === 'rescued') color = RESCUE_CONFIG.COLORS.RESCUED_CAPSULE;
      else if (cap.status === 'confirmed') color = RESCUE_CONFIG.COLORS.CONFIRMED_CAPSULE;
      else if (cap.isReal) color = RESCUE_CONFIG.COLORS.REAL_CAPSULE;
      else color = RESCUE_CONFIG.COLORS.DECOY_CAPSULE;

      const g = new PIXI.Graphics();
      g.x = cap.position.x;
      g.y = cap.position.y;

      const glowPulse = 0.7 + Math.sin(time * 2 + cap.id) * 0.3;
      const glow = new PIXI.Graphics();
      glow.beginFill(color, 0.1 * glowPulse);
      glow.drawCircle(0, 0, cap.radius * 2.5);
      glow.endFill();
      g.addChild(glow);

      const outerRing = new PIXI.Graphics();
      outerRing.lineStyle(2, color, 0.5);
      outerRing.drawCircle(0, 0, cap.radius * 1.4 * (1 + Math.sin(time * 1.5 + cap.id) * 0.08));
      g.addChild(outerRing);

      const body = new PIXI.Graphics();
      body.lineStyle(2.5, color, 0.95);
      body.beginFill(color, 0.3);
      const r = cap.radius;
      body.drawRoundedRect(-r, -r * 0.6, r * 2, r * 1.2, r * 0.25);
      body.endFill();

      const window = new PIXI.Graphics();
      window.lineStyle(1.5, color, 0.8);
      window.beginFill(color, 0.5);
      window.drawCircle(0, 0, r * 0.35);
      window.endFill();

      const light = new PIXI.Graphics();
      light.beginFill(0xffffff, 0.7 + Math.sin(time * 3 + cap.id * 2) * 0.3);
      light.drawCircle(0, 0, r * 0.15);
      light.endFill();

      body.addChild(window, light);

      if (cap.status === 'rescued') {
        const checkMark = new PIXI.Graphics();
        checkMark.lineStyle(3, 0x00ffff, 1);
        checkMark.moveTo(-r * 0.4, r * 0.1);
        checkMark.lineTo(-r * 0.1, r * 0.4);
        checkMark.lineTo(r * 0.45, -r * 0.3);
        g.addChild(checkMark);
      } else if (cap.status === 'confirmed') {
        const ringPulse = new PIXI.Graphics();
        ringPulse.lineStyle(2, 0x00ffcc, 0.5 + Math.sin(time * 4) * 0.3);
        ringPulse.drawCircle(0, 0, cap.radius * 1.8 + Math.sin(time * 4) * 5);
        g.addChild(ringPulse);
      } else if (cap.status === 'suspected') {
        const qMark = new PIXI.Text('?', {
          fontSize: Math.round(r * 0.9),
          fontWeight: 'bold',
          fill: color,
          align: 'center',
        });
        qMark.anchor.set(0.5);
        qMark.x = r * 0.8;
        qMark.y = -r * 0.8;
        qMark.alpha = 0.7 + Math.sin(time * 5) * 0.3;
        g.addChild(qMark);
      }

      const antenna = new PIXI.Graphics();
      antenna.lineStyle(2, color, 0.7);
      antenna.moveTo(0, -r * 0.6);
      antenna.lineTo(0, -r * 1.1);
      const antDot = new PIXI.Graphics();
      antDot.beginFill(color, 0.6 + Math.sin(time * 6 + cap.id) * 0.4);
      antDot.drawCircle(0, -r * 1.15, 3);
      antDot.endFill();
      body.addChild(antenna, antDot);

      g.addChild(body);
      this.capsuleContainer.addChild(g);
    }
  }

  public renderSonarWaves(waves: SonarWaveLite[]) {
    this.waveContainer.removeChildren();
    for (const wave of waves) {
      const g = new PIXI.Graphics();
      g.lineStyle(3, RESCUE_CONFIG.COLORS.SONAR, wave.alpha * 0.85);
      g.drawCircle(wave.position.x, wave.position.y, wave.radius);

      const g2 = new PIXI.Graphics();
      g2.lineStyle(1, RESCUE_CONFIG.COLORS.SONAR, wave.alpha * 0.35);
      g2.drawCircle(wave.position.x, wave.position.y, wave.radius * 0.88);

      const glow = new PIXI.Graphics();
      glow.lineStyle(10, RESCUE_CONFIG.COLORS.SONAR, wave.alpha * 0.12);
      glow.drawCircle(wave.position.x, wave.position.y, wave.radius);

      this.waveContainer.addChild(glow, g2, g);
    }
  }

  public renderEchoPoints(echos: EchoPointLite[]) {
    this.echoContainer.removeChildren();
    const time = Date.now() / 1000;

    for (const echo of echos) {
      const color = echo.isReal ? RESCUE_CONFIG.COLORS.REAL_CAPSULE : RESCUE_CONFIG.COLORS.DECOY_CAPSULE;
      const pulse = 1 + Math.sin(time * 6 + echo.id) * 0.2;
      const size = echo.size * pulse;

      const glow = new PIXI.Graphics();
      glow.beginFill(color, echo.alpha * 0.12);
      glow.drawCircle(echo.position.x, echo.position.y, size * 3);
      glow.endFill();

      const outer = new PIXI.Graphics();
      outer.lineStyle(2, color, echo.alpha * 0.55);
      outer.drawCircle(echo.position.x, echo.position.y, size * 1.6);

      const ring = new PIXI.Graphics();
      ring.lineStyle(1.5, color, echo.alpha * 0.8);
      ring.drawCircle(echo.position.x, echo.position.y, size * 1.1);

      const core = new PIXI.Graphics();
      core.beginFill(color, echo.alpha);
      core.drawCircle(echo.position.x, echo.position.y, size * 0.5);
      core.endFill();

      const innerDot = new PIXI.Graphics();
      innerDot.beginFill(0xffffff, echo.alpha * 0.9);
      innerDot.drawCircle(echo.position.x, echo.position.y, size * 0.2);
      innerDot.endFill();

      const signalRings = echo.signalStrength;
      for (let i = 0; i < 3; i++) {
        if (i < Math.round(signalRings * 3)) {
          const sg = new PIXI.Graphics();
          sg.lineStyle(1, color, echo.alpha * 0.5 * (1 - i * 0.25));
          const arcR = size * (1.2 + i * 0.35);
          const start = -Math.PI / 2 - 0.4 - i * 0.1;
          const end = -Math.PI / 2 + 0.4 + i * 0.1;
          sg.arc(echo.position.x, echo.position.y, arcR, start, end);
          this.echoContainer.addChild(sg);
        }
      }

      this.echoContainer.addChild(glow, outer, ring, core, innerDot);
    }
  }

  public drawPlayer(position: Position) {
    let player = this.mapContainer.getChildByName('rescue-player') as PIXI.Container;
    if (!player) {
      player = new PIXI.Container();
      player.name = 'rescue-player';
      this.mapContainer.addChild(player);
    }
    player.removeChildren();
    player.x = position.x;
    player.y = position.y;

    const time = Date.now() / 1000;

    const baseGlow = new PIXI.Graphics();
    baseGlow.beginFill(RESCUE_CONFIG.COLORS.PLAYER, 0.12);
    baseGlow.drawCircle(0, 0, 50);
    baseGlow.endFill();
    player.addChild(baseGlow);

    for (let i = 0; i < 3; i++) {
      const r = 20 + i * 12 + Math.sin(time * 2 - i * 0.5) * 3;
      const ring = new PIXI.Graphics();
      ring.lineStyle(1.5 - i * 0.3, RESCUE_CONFIG.COLORS.PLAYER, 0.5 - i * 0.12);
      ring.drawCircle(0, 0, r);
      player.addChild(ring);
    }

    const hull = new PIXI.Graphics();
    hull.lineStyle(2, RESCUE_CONFIG.COLORS.PLAYER, 1);
    hull.beginFill(RESCUE_CONFIG.COLORS.PLAYER, 0.4);
    hull.moveTo(-16, 10);
    hull.lineTo(-12, -8);
    hull.quadraticCurveTo(0, -18, 12, -8);
    hull.lineTo(16, 10);
    hull.quadraticCurveTo(0, 16, -16, 10);
    hull.endFill();

    const cockpit = new PIXI.Graphics();
    cockpit.lineStyle(1.5, 0x00ffff, 0.9);
    cockpit.beginFill(0x00ffff, 0.55);
    cockpit.drawCircle(0, -3, 6);
    cockpit.endFill();

    const prop = new PIXI.Graphics();
    const propSpin = time * 8;
    prop.lineStyle(1.5, RESCUE_CONFIG.COLORS.PLAYER, 0.8);
    prop.moveTo(Math.cos(propSpin) * 8, 12);
    prop.lineTo(-Math.cos(propSpin) * 8, 12);
    prop.moveTo(0, 12 + Math.sin(propSpin) * 8);
    prop.lineTo(0, 12 - Math.sin(propSpin) * 8);

    hull.addChild(cockpit, prop);
    player.addChild(hull);

    const beam = new PIXI.Graphics();
    const beamGrd = document.createElement('canvas');
    beamGrd.width = 2;
    beamGrd.height = 120;
    const bctx = beamGrd.getContext('2d')!;
    const bg = bctx.createLinearGradient(0, 0, 0, 120);
    bg.addColorStop(0, 'rgba(78, 255, 170, 0.15)');
    bg.addColorStop(1, 'rgba(78, 255, 170, 0)');
    bctx.fillStyle = bg;
    bctx.fillRect(0, 0, 2, 120);
    const beamTex = PIXI.Texture.from(beamGrd);
    beam.beginTextureFill({ texture: beamTex });
    beam.moveTo(-14, 16);
    beam.lineTo(14, 16);
    beam.lineTo(6, 136);
    beam.lineTo(-6, 136);
    beam.closePath();
    beam.endFill();
    player.addChild(beam);
  }

  public getTicker(): PIXI.Ticker {
    return this.app.ticker;
  }

  public screenToWorld(screenX: number, screenY: number): Position {
    const offsetX = (this.app.screen.width - this.width) / 2;
    return {
      x: Math.max(0, Math.min(this.width, screenX - Math.max(0, offsetX))),
      y: Math.max(0, Math.min(this.height, screenY + this.cameraY)),
    };
  }

  public destroy() {
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }

  public getMapSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  public clear() {
    this.interferenceContainer.removeChildren();
    this.pathContainer.removeChildren();
    this.capsuleContainer.removeChildren();
    this.echoContainer.removeChildren();
    this.waveContainer.removeChildren();
    const player = this.mapContainer.getChildByName('rescue-player');
    if (player) this.mapContainer.removeChild(player);
  }
}
