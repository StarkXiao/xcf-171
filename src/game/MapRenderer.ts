import * as PIXI from 'pixi.js';
import type { Target, SonarWave, EchoPoint, Position, DangerZone } from '../types/game';
import { GAME_CONFIG } from '../config/gameConfig';

export class MapRenderer {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private mapContainer: PIXI.Container;
  private waveContainer: PIXI.Container;
  private echoContainer: PIXI.Container;
  private targetContainer: PIXI.Container;
  private fogContainer: PIXI.Container;
  private gridContainer: PIXI.Container;
  private particleContainer: PIXI.Container;
  private dangerZoneContainer: PIXI.Container;

  private width: number;
  private height: number;
  private cameraY: number = 0;
  private viewportHeight: number;
  private discoveredMask: PIXI.Graphics;
  private discoveredAreas: Array<{ x: number; y: number; radius: number }> = [];
  private particles: Array<{ sprite: PIXI.Graphics; vy: number; vx: number }> = [];

  constructor(htmlContainer: HTMLElement, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.viewportHeight = htmlContainer.clientHeight;

    this.app = new PIXI.Application({
      width: htmlContainer.clientWidth,
      height: this.viewportHeight,
      backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    htmlContainer.appendChild(this.app.view as HTMLCanvasElement);

    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    this.mapContainer = new PIXI.Container();
    this.gridContainer = new PIXI.Container();
    this.fogContainer = new PIXI.Container();
    this.targetContainer = new PIXI.Container();
    this.echoContainer = new PIXI.Container();
    this.waveContainer = new PIXI.Container();
    this.particleContainer = new PIXI.Container();
    this.dangerZoneContainer = new PIXI.Container();

    this.container.addChild(this.mapContainer);
    this.mapContainer.addChild(this.gridContainer);
    this.mapContainer.addChild(this.fogContainer);
    this.mapContainer.addChild(this.dangerZoneContainer);
    this.mapContainer.addChild(this.targetContainer);
    this.mapContainer.addChild(this.echoContainer);
    this.mapContainer.addChild(this.waveContainer);
    this.mapContainer.addChild(this.particleContainer);

    this.discoveredMask = new PIXI.Graphics();
    this.fogContainer.mask = this.discoveredMask;

    this.drawBackground();
    this.drawGrid();
    this.createFog();
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
    gradient.addColorStop(0, '#001a2e');
    gradient.addColorStop(0.5, '#001020');
    gradient.addColorStop(1, '#000510');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    return PIXI.Texture.from(canvas);
  }

  private drawGrid() {
    this.gridContainer.removeChildren();
    const gridSize = 50;
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, GAME_CONFIG.COLORS.GRID, 0.15);

    for (let x = 0; x <= this.width; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.height);
    }
    for (let y = 0; y <= this.height; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(this.width, y);
    }

    const border = new PIXI.Graphics();
    border.lineStyle(3, GAME_CONFIG.COLORS.SONAR, 0.5);
    border.drawRect(0, 0, this.width, this.height);
    this.gridContainer.addChild(grid, border);
  }

  private createFog() {
    this.fogContainer.removeChildren();
    const fog = new PIXI.Graphics();
    fog.beginFill(0x000008, 0.92);
    fog.drawRect(0, 0, this.width, this.height);
    fog.endFill();
    this.fogContainer.addChild(fog);
  }

  private createParticles() {
    for (let i = 0; i < 60; i++) {
      const p = new PIXI.Graphics();
      p.beginFill(0x66ffff, 0.4 + Math.random() * 0.4);
      p.drawCircle(0, 0, 1 + Math.random() * 2);
      p.endFill();
      p.x = Math.random() * this.width;
      p.y = Math.random() * this.height;
      this.particleContainer.addChild(p);
      this.particles.push({
        sprite: p,
        vy: 10 + Math.random() * 25,
        vx: (Math.random() - 0.5) * 8,
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

  public addDiscoveredArea(pos: Position, radius: number) {
    this.discoveredAreas.push({ x: pos.x, y: pos.y, radius });
    this.updateDiscoveredMask();
  }

  private updateDiscoveredMask() {
    this.discoveredMask.clear();
    this.discoveredMask.beginFill(0xffffff);
    for (const area of this.discoveredAreas) {
      this.discoveredMask.drawCircle(area.x, area.y, area.radius);
    }
    this.discoveredMask.endFill();
  }

  public renderWaves(waves: SonarWave[]) {
    this.waveContainer.removeChildren();
    for (const wave of waves) {
      const g = new PIXI.Graphics();
      g.lineStyle(3, GAME_CONFIG.COLORS.SONAR, wave.alpha * 0.9);
      g.drawCircle(wave.position.x, wave.position.y, wave.radius);

      const g2 = new PIXI.Graphics();
      g2.lineStyle(1, GAME_CONFIG.COLORS.SONAR, wave.alpha * 0.4);
      g2.drawCircle(wave.position.x, wave.position.y, wave.radius * 0.85);

      const glow = new PIXI.Graphics();
      glow.lineStyle(8, GAME_CONFIG.COLORS.SONAR, wave.alpha * 0.15);
      glow.drawCircle(wave.position.x, wave.position.y, wave.radius);

      this.waveContainer.addChild(glow, g2, g);
    }
  }

  public renderEchos(echos: EchoPoint[]) {
    this.echoContainer.removeChildren();
    for (const echo of echos) {
      let color = GAME_CONFIG.COLORS.CREATURE;
      if (echo.type === 'wreck') color = GAME_CONFIG.COLORS.WRECK;
      else if (echo.type === 'danger') color = GAME_CONFIG.COLORS.DANGER;

      const pulseSize = echo.size * (1 + (1 - echo.alpha) * 0.5);

      const glow = new PIXI.Graphics();
      glow.beginFill(color, echo.alpha * 0.15);
      glow.drawCircle(echo.position.x, echo.position.y, pulseSize * 2.5);
      glow.endFill();

      const outer = new PIXI.Graphics();
      outer.lineStyle(2, color, echo.alpha * 0.6);
      outer.drawCircle(echo.position.x, echo.position.y, pulseSize * 1.5);

      const core = new PIXI.Graphics();
      core.beginFill(color, echo.alpha);
      core.drawCircle(echo.position.x, echo.position.y, pulseSize * 0.6);
      core.endFill();

      this.echoContainer.addChild(glow, outer, core);
    }
  }

  public renderTargets(targets: Target[]) {
    this.targetContainer.removeChildren();
    for (const target of targets) {
      if (!target.discovered || target.collected) continue;
      this.drawTarget(target);
    }
  }

  private drawTarget(target: Target) {
    let color = GAME_CONFIG.COLORS.CREATURE;
    if (target.type === 'wreck') color = GAME_CONFIG.COLORS.WRECK;
    else if (target.type === 'danger') color = GAME_CONFIG.COLORS.DANGER;

    const g = new PIXI.Graphics();
    g.x = target.position.x;
    g.y = target.position.y;
    g.rotation = target.rotation;

    const glow = new PIXI.Graphics();
    glow.beginFill(color, 0.12);
    glow.drawCircle(0, 0, target.radius * 2);
    glow.endFill();
    g.addChild(glow);

    g.lineStyle(2, color, 0.9);
    g.beginFill(color, 0.35);

    if (target.shape === 'circle') {
      g.drawCircle(0, 0, target.radius);
      if (target.type === 'creature') {
        g.moveTo(target.radius * 0.5, 0);
        g.lineTo(target.radius * 1.3, -target.radius * 0.4);
        g.lineTo(target.radius * 1.3, target.radius * 0.4);
        g.closePath();
      }
    } else if (target.shape === 'triangle') {
      const r = target.radius;
      g.moveTo(0, -r);
      g.lineTo(r * 0.9, r * 0.7);
      g.lineTo(-r * 0.9, r * 0.7);
      g.closePath();
      g.lineStyle(1, color, 0.7);
      g.moveTo(0, -r * 0.5);
      g.lineTo(0, r * 0.4);
    } else if (target.shape === 'square') {
      const r = target.radius;
      g.drawRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
      g.moveTo(-r * 0.8, -r * 0.8);
      g.lineTo(r * 0.8, r * 0.8);
      g.moveTo(r * 0.8, -r * 0.8);
      g.lineTo(-r * 0.8, r * 0.8);
    } else {
      const r = target.radius;
      const points = 7;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const rr = r * (0.7 + Math.sin(i * 2.3) * 0.3);
        const px = Math.cos(angle) * rr;
        const py = Math.sin(angle) * rr;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
    }
    g.endFill();

    if (target.type === 'danger') {
      const warn = new PIXI.Graphics();
      warn.lineStyle(2, 0xffffff, 0.8 + Math.sin(Date.now() / 200) * 0.2);
      warn.moveTo(0, -target.radius * 0.6);
      warn.lineTo(0, target.radius * 0.1);
      warn.drawCircle(0, target.radius * 0.35, 3);
      g.addChild(warn);
    }

    this.targetContainer.addChild(g);
  }

  public drawPlayer(position: Position) {
    let player = this.mapContainer.getChildByName('player') as PIXI.Container;
    if (!player) {
      player = new PIXI.Container();
      player.name = 'player';
      this.mapContainer.addChild(player);
    }
    player.removeChildren();
    player.x = position.x;
    player.y = position.y;

    const glow = new PIXI.Graphics();
    glow.beginFill(GAME_CONFIG.COLORS.PLAYER, 0.15);
    glow.drawCircle(0, 0, 40);
    glow.endFill();
    player.addChild(glow);

    const body = new PIXI.Graphics();
    body.lineStyle(2, GAME_CONFIG.COLORS.PLAYER, 1);
    body.beginFill(GAME_CONFIG.COLORS.PLAYER, 0.5);
    body.drawCircle(0, 0, 14);
    body.endFill();
    player.addChild(body);

    const inner = new PIXI.Graphics();
    inner.beginFill(0xffffff, 0.9);
    inner.drawCircle(0, 0, 5);
    inner.endFill();
    player.addChild(inner);

    const pulse = 1 + Math.sin(Date.now() / 300) * 0.1;
    const ring = new PIXI.Graphics();
    ring.lineStyle(1, GAME_CONFIG.COLORS.PLAYER, 0.5);
    ring.drawCircle(0, 0, 25 * pulse);
    player.addChild(ring);
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

  public clearDiscovered() {
    this.discoveredAreas = [];
    this.updateDiscoveredMask();
  }

  public setMapSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.drawBackground();
    this.drawGrid();
    this.createFog();
    this.clearDiscovered();
  }

  public getMapSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  private drawDashedCircle(
    g: PIXI.Graphics,
    cx: number,
    cy: number,
    radius: number,
    color: number,
    alpha: number,
    dashLength: number,
    gapLength: number
  ) {
    const circumference = 2 * Math.PI * radius;
    const step = dashLength + gapLength;
    const totalSteps = Math.floor(circumference / step);
    const actualStep = circumference / totalSteps;
    const dashAngle = (dashLength / circumference) * 2 * Math.PI;

    g.lineStyle(2, color, alpha);

    for (let i = 0; i < totalSteps; i++) {
      const startAngle = (i * actualStep / radius);
      const endAngle = startAngle + dashAngle;

      g.moveTo(
        cx + Math.cos(startAngle) * radius,
        cy + Math.sin(startAngle) * radius
      );
      g.arc(cx, cy, radius, startAngle, endAngle);
    }
  }

  public renderDangerZones(zones: DangerZone[]) {
    this.dangerZoneContainer.removeChildren();
    if (!zones || zones.length === 0) return;

    const now = Date.now() / 1000;

    for (const zone of zones) {
      const baseColor = this.getDangerZoneColor(zone.type);
      const pulse = 0.5 + Math.sin(now * 2 + zone.id) * 0.3;

      const outerGlow = new PIXI.Graphics();
      outerGlow.beginFill(baseColor, 0.05 + pulse * 0.03);
      outerGlow.drawCircle(zone.position.x, zone.position.y, zone.radius * 1.5);
      outerGlow.endFill();

      const halo = new PIXI.Graphics();
      halo.lineStyle(2, baseColor, 0.25 + pulse * 0.15);
      halo.drawCircle(zone.position.x, zone.position.y, zone.radius * 1.25);

      const mainFill = new PIXI.Graphics();
      mainFill.beginFill(baseColor, 0.12 + zone.intensity * 0.08);
      mainFill.drawCircle(zone.position.x, zone.position.y, zone.radius);
      mainFill.endFill();

      const border = new PIXI.Graphics();
      this.drawDashedCircle(border, zone.position.x, zone.position.y, zone.radius, baseColor, 0.6 + pulse * 0.2, 8, 6);

      const innerRing = new PIXI.Graphics();
      innerRing.lineStyle(1, baseColor, 0.3);
      innerRing.drawCircle(zone.position.x, zone.position.y, zone.radius * 0.6);

      const typeIcon = this.createDangerZoneIcon(zone.type, baseColor);
      typeIcon.x = zone.position.x;
      typeIcon.y = zone.position.y;

      const nameLabel = new PIXI.Text(zone.name, {
        fontSize: 11,
        fontFamily: 'monospace',
        fill: baseColor,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: zone.radius * 1.6,
      });
      nameLabel.anchor.set(0.5, 0.5);
      nameLabel.x = zone.position.x;
      nameLabel.y = zone.position.y + zone.radius * 0.75;
      nameLabel.alpha = 0.85;

      const intensityLabel = new PIXI.Text(`强度 ${Math.round(zone.intensity * 100)}%`, {
        fontSize: 9,
        fontFamily: 'monospace',
        fill: 0xffffff,
      });
      intensityLabel.anchor.set(0.5, 0.5);
      intensityLabel.x = zone.position.x;
      intensityLabel.y = zone.position.y - zone.radius * 0.55;
      intensityLabel.alpha = 0.6;

      this.dangerZoneContainer.addChild(
        outerGlow, halo, mainFill, innerRing, border, typeIcon, intensityLabel, nameLabel
      );
    }
  }

  private createDangerZoneIcon(type: DangerZone['type'], color: number): PIXI.Container {
    const c = new PIXI.Container();
    const size = 16;
    const g = new PIXI.Graphics();
    g.lineStyle(2, color, 1);

    if (type === 'minefield') {
      g.beginFill(color, 0.6);
      g.drawCircle(0, 0, size * 0.5);
      g.endFill();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.moveTo(Math.cos(a) * size * 0.5, Math.sin(a) * size * 0.5);
        g.lineTo(Math.cos(a) * size * 0.85, Math.sin(a) * size * 0.85);
      }
      g.beginFill(0x000000, 1);
      g.drawCircle(0, 0, size * 0.15);
      g.endFill();
    } else if (type === 'volcano') {
      g.moveTo(0, -size * 0.7);
      g.lineTo(size * 0.55, size * 0.5);
      g.lineTo(-size * 0.55, size * 0.5);
      g.closePath();
      g.endFill();
      g.beginFill(0xff6633, 0.9);
      g.moveTo(0, -size * 0.4);
      g.lineTo(size * 0.2, size * 0.1);
      g.lineTo(-size * 0.2, size * 0.1);
      g.closePath();
      g.endFill();
    } else if (type === 'vortex') {
      for (let r = size * 0.2; r <= size * 0.7; r += size * 0.15) {
        g.arc(0, 0, r, 0, Math.PI * 1.6);
      }
      g.beginFill(color, 0.5);
      g.drawCircle(0, 0, size * 0.15);
      g.endFill();
    } else if (type === 'toxic') {
      g.beginFill(color, 0.5);
      g.drawCircle(0, -size * 0.2, size * 0.25);
      g.drawCircle(size * 0.25, size * 0.1, size * 0.2);
      g.drawCircle(-size * 0.2, size * 0.15, size * 0.22);
      g.endFill();
      g.lineStyle(2, 0xffffff, 0.9);
      g.moveTo(-size * 0.3, size * 0.45);
      g.lineTo(size * 0.3, size * 0.45);
    }

    c.addChild(g);
    return c;
  }

  private getDangerZoneColor(type: DangerZone['type']): number {
    switch (type) {
      case 'minefield': return 0xff5533;
      case 'volcano': return 0xff6600;
      case 'vortex': return 0x9966ff;
      case 'toxic': return 0x66dd33;
      default: return 0xff3355;
    }
  }
}
