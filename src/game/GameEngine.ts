import {
  GameMode,
  LevelData,
  Obstacle,
  PlayerCustomization,
  GameSettings,
  CheckpointData,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';

export const TILE_SIZE = 40;
export const CANVAS_HEIGHT = 560;
export const FLOOR_Y = 480; // Ground surface pixel Y
export const CEILING_Y = 80;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'square' | 'ring';
}

export interface TrailPoint {
  x: number;
  y: number;
  rotation: number;
  mode: GameMode;
  size: number;
  alpha: number;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  // Level & Game State
  public level: LevelData;
  public customization: PlayerCustomization;
  public settings: GameSettings;
  public isPracticeMode = false;

  public isAlive = true;
  public isCompleted = false;
  public isPaused = false;
  public attempts = 1;
  public coinsCollectedThisRun = [false, false, false];

  // Callbacks
  public onDeath?: (attempt: number, percentage: number) => void;
  public onVictory?: (stats: { timeSec: number; attempts: number; coins: boolean[] }) => void;
  public onProgressUpdate?: (percent: number) => void;

  // Player Physics
  public player = {
    x: 0,
    y: FLOOR_Y - 34,
    vx: 430, // px per second
    vy: 0,
    width: 34,
    height: 34,
    rotation: 0,
    isGrounded: true,
    canDoubleJump: true,
    mode: 'CUBE' as GameMode,
    gravity: 1, // 1 for down, -1 for up
    speedMultiplier: 1.0,
    sizeState: 'NORMAL' as 'NORMAL' | 'MINI',
  };

  // Camera & Visuals
  public cameraX = 0;
  public screenShake = 0;
  public bgBeatPulse = 0;
  private startTime = 0;
  private lastFrameTime = 0;
  private animationFrameId: number | null = null;

  // Visual effects
  public particles: Particle[] = [];
  public trail: TrailPoint[] = [];
  public checkpoints: CheckpointData[] = [];

  // Input states
  private isHoldingJump = false;
  private jumpPressedThisFrame = false;
  private touchActive = false;

  // FPS tracker
  public currentFps = 60;
  private frameCount = 0;
  private lastFpsTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelData,
    customization: PlayerCustomization,
    settings: GameSettings,
    isPractice = false
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.level = JSON.parse(JSON.stringify(level)); // Deep copy to track coin collections
    this.customization = customization;
    this.settings = settings;
    this.isPracticeMode = isPractice;

    this.initAudioBeat();
    this.resetPlayer(true);
  }

  private initAudioBeat() {
    soundEngine.onBeatCallbacks.push((_beatIndex, isDownbeat) => {
      this.bgBeatPulse = isDownbeat ? 1.0 : 0.6;
    });
  }

  public setCustomization(cust: PlayerCustomization) {
    this.customization = cust;
  }

  public setSettings(sett: GameSettings) {
    this.settings = sett;
  }

  public resetPlayer(fullReset = false) {
    if (fullReset || this.checkpoints.length === 0 || !this.isPracticeMode) {
      this.player.x = 80;
      this.player.y = FLOOR_Y - 34;
      this.player.vx = 430;
      this.player.vy = 0;
      this.player.rotation = 0;
      this.player.isGrounded = true;
      this.player.canDoubleJump = true;
      this.player.mode = 'CUBE';
      this.player.gravity = 1;
      this.player.speedMultiplier = 1.0;
      this.player.sizeState = 'NORMAL';
      this.player.width = 34;
      this.player.height = 34;
      this.cameraX = 0;
      this.coinsCollectedThisRun = [false, false, false];

      // Reset level coins
      this.level.obstacles.forEach(o => {
        if (o.type === 'COIN') o.collected = false;
      });
    } else {
      // Restore from latest checkpoint
      const cp = this.checkpoints[this.checkpoints.length - 1];
      this.player.x = cp.x;
      this.player.y = cp.y;
      this.player.vy = cp.vy;
      this.player.mode = cp.mode;
      this.player.gravity = cp.gravity;
      this.player.speedMultiplier = cp.speedMultiplier;
      this.player.sizeState = cp.sizeState;
      this.player.width = cp.sizeState === 'MINI' ? 22 : 34;
      this.player.height = cp.sizeState === 'MINI' ? 22 : 34;
      this.cameraX = cp.cameraX;
      this.player.rotation = 0;
      this.player.canDoubleJump = true;
      this.player.isGrounded = false;
    }

    this.isAlive = true;
    this.isCompleted = false;
    this.particles = [];
    this.trail = [];
    this.startTime = performance.now();
  }

  // ---------- PRACTICE MODE CHECKPOINTS ----------

  public placeCheckpoint() {
    if (!this.isPracticeMode || !this.isAlive || this.isCompleted) return;

    const cp: CheckpointData = {
      x: this.player.x,
      y: this.player.y,
      vy: this.player.vy,
      mode: this.player.mode,
      gravity: this.player.gravity,
      speedMultiplier: this.player.speedMultiplier,
      sizeState: this.player.sizeState,
      percentage: this.getPercentage(),
      cameraX: this.cameraX,
    };

    this.checkpoints.push(cp);
    soundEngine.playOrbJump();

    // Spawn checkpoint flag particles
    this.spawnCheckpointParticles(this.player.x, this.player.y);
  }

  public removeCheckpoint() {
    if (this.checkpoints.length > 0) {
      this.checkpoints.pop();
      soundEngine.playClick();
    }
  }

  // ---------- INPUT HANDLERS ----------

  public handleInputDown() {
    this.isHoldingJump = true;
    this.jumpPressedThisFrame = true;

    if (!this.isAlive) {
      this.attempts++;
      this.resetPlayer(false);
      soundEngine.startMusic(this.level.songTrackId, this.level.bpm);
      return;
    }
  }

  public handleInputUp() {
    this.isHoldingJump = false;
  }

  public start() {
    this.lastFrameTime = performance.now();
    this.lastFpsTime = performance.now();
    soundEngine.setVolumes(this.settings.musicVolume, this.settings.sfxVolume);
    soundEngine.startMusic(this.level.songTrackId, this.level.bpm);
    this.loop();
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundEngine.stopMusic();
  }

  public pause() {
    this.isPaused = true;
    soundEngine.stopMusic();
  }

  public resume() {
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    soundEngine.startMusic(this.level.songTrackId, this.level.bpm);
    this.loop();
  }

  // ---------- MAIN GAME LOOP ----------

  private loop = () => {
    if (this.isPaused) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.04); // Cap delta time at 25 FPS min
    this.lastFrameTime = now;

    // Track FPS
    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    this.update(dt);
    this.render();

    this.jumpPressedThisFrame = false;

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // ---------- PHYSICS & UPDATE ----------

  private update(dt: number) {
    if (!this.isAlive || this.isCompleted) {
      this.updateParticles(dt);
      return;
    }

    const p = this.player;
    const baseSpeed = 430 * p.speedMultiplier;
    p.x += baseSpeed * dt;

    // Camera lead follow
    const targetCamX = p.x - 220;
    this.cameraX += (targetCamX - this.cameraX) * 0.15;

    // Update screen shake & beat pulse
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }
    if (this.bgBeatPulse > 0) {
      this.bgBeatPulse = Math.max(0, this.bgBeatPulse - dt * 2.5);
    }

    // Process mode-specific physics
    switch (p.mode) {
      case 'CUBE':
        this.updateCubePhysics(dt);
        break;
      case 'SHIP':
        this.updateShipPhysics(dt);
        break;
      case 'BALL':
        this.updateBallPhysics(dt);
        break;
      case 'WAVE':
        this.updateWavePhysics(dt);
        break;
    }

    // Record trail point
    this.recordTrail();

    // Check obstacle collisions
    this.checkCollisions();

    // Update particles & trail
    this.updateParticles(dt);
    this.updateTrail(dt);

    // Notify percentage
    const pct = this.getPercentage();
    if (this.onProgressUpdate) {
      this.onProgressUpdate(pct);
    }
  }

  private updateCubePhysics(dt: number) {
    const p = this.player;
    const gravForce = 1350 * p.gravity;
    const jumpImpulse = -560 * p.gravity;

    // Jump / Double Jump
    if (this.jumpPressedThisFrame) {
      if (p.isGrounded) {
        p.vy = jumpImpulse;
        p.isGrounded = false;
        soundEngine.playJump();
        this.spawnDustParticles(p.x + p.width / 2, p.gravity > 0 ? p.y + p.height : p.y);
      } else if (p.canDoubleJump) {
        p.vy = jumpImpulse * 0.92;
        p.canDoubleJump = false;
        soundEngine.playDoubleJump();
        this.spawnDoubleJumpSparkles(p.x + p.width / 2, p.y + p.height / 2);
      }
    }

    // Apply gravity
    p.vy += gravForce * dt;
    p.y += p.vy * dt;

    // Floor / Ceiling bounds
    if (p.gravity > 0) {
      if (p.y >= FLOOR_Y - p.height) {
        p.y = FLOOR_Y - p.height;
        p.vy = 0;
        p.isGrounded = true;
        p.canDoubleJump = true;
        // Snap rotation to nearest 90 deg
        p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
      } else {
        p.isGrounded = false;
        p.rotation += 8.5 * dt;
      }
    } else {
      // Inverted gravity
      if (p.y <= CEILING_Y) {
        p.y = CEILING_Y;
        p.vy = 0;
        p.isGrounded = true;
        p.canDoubleJump = true;
        p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
      } else {
        p.isGrounded = false;
        p.rotation -= 8.5 * dt;
      }
    }
  }

  private updateShipPhysics(dt: number) {
    const p = this.player;
    const shipGravity = 650 * p.gravity;
    const shipThrust = -1200 * p.gravity;

    if (this.isHoldingJump) {
      p.vy += shipThrust * dt;
      this.spawnShipThruster();
    } else {
      p.vy += shipGravity * dt;
    }

    // Terminal velocity
    p.vy = Math.max(-500, Math.min(500, p.vy));
    p.y += p.vy * dt;

    // Dynamic ship angle
    const targetAngle = (p.vy / 500) * 0.65;
    p.rotation += (targetAngle - p.rotation) * 0.2;

    // Ceiling & Floor boundaries
    if (p.y <= CEILING_Y) {
      p.y = CEILING_Y;
      p.vy = 0;
    } else if (p.y >= FLOOR_Y - p.height) {
      p.y = FLOOR_Y - p.height;
      p.vy = 0;
    }
    p.isGrounded = false;
  }

  private updateBallPhysics(dt: number) {
    const p = this.player;
    const gravForce = 1500 * p.gravity;

    // Flip gravity when clicking while on ground/ceiling
    if (this.jumpPressedThisFrame && p.isGrounded) {
      p.gravity = -p.gravity;
      p.vy = -300 * p.gravity;
      p.isGrounded = false;
      soundEngine.playGravityFlip();
      this.spawnGravityFlipBurst(p.x + p.width / 2, p.y + p.height / 2);
    }

    p.vy += gravForce * dt;
    p.y += p.vy * dt;

    // Continuous rolling rotation
    p.rotation += (p.gravity > 0 ? 10 : -10) * dt;

    if (p.gravity > 0) {
      if (p.y >= FLOOR_Y - p.height) {
        p.y = FLOOR_Y - p.height;
        p.vy = 0;
        p.isGrounded = true;
      } else {
        p.isGrounded = false;
      }
    } else {
      if (p.y <= CEILING_Y) {
        p.y = CEILING_Y;
        p.vy = 0;
        p.isGrounded = true;
      } else {
        p.isGrounded = false;
      }
    }
  }

  private updateWavePhysics(dt: number) {
    const p = this.player;
    const waveSpeedY = 430 * p.speedMultiplier;

    if (this.isHoldingJump) {
      p.vy = -waveSpeedY * p.gravity;
    } else {
      p.vy = waveSpeedY * p.gravity;
    }

    p.y += p.vy * dt;
    p.rotation = p.vy < 0 ? -Math.PI / 4 : Math.PI / 4;

    // In Wave mode, touching ceiling or floor kills player unless clear
    if (p.y <= CEILING_Y || p.y >= FLOOR_Y - p.height) {
      this.killPlayer();
    }
  }

  // ---------- COLLISIONS ----------

  private checkCollisions() {
    const p = this.player;
    const px = p.x;
    const py = p.y;
    const pw = p.width;
    const ph = p.height;

    // Visible grid range for high efficiency
    const startGridX = Math.floor((this.cameraX - 100) / TILE_SIZE);
    const endGridX = Math.ceil((this.cameraX + this.canvas.width + 100) / TILE_SIZE);

    for (const obs of this.level.obstacles) {
      if (obs.x + (obs.width || 1) < startGridX || obs.x > endGridX) continue;

      const ox = obs.x * TILE_SIZE;
      const oy = FLOOR_Y - (obs.y + (obs.height || 1)) * TILE_SIZE;
      const ow = (obs.width || 1) * TILE_SIZE;
      const oh = (obs.height || 1) * TILE_SIZE;

      // 1. SOLID BLOCKS
      if (obs.type === 'BLOCK' || obs.type === 'HALF_BLOCK') {
        const blockH = obs.type === 'HALF_BLOCK' ? oh / 2 : oh;
        const blockY = obs.type === 'HALF_BLOCK' ? oy + oh / 2 : oy;

        // AABB check
        if (px + pw > ox && px < ox + ow && py + ph > blockY && py < blockY + blockH) {
          if (p.mode === 'WAVE') {
            this.killPlayer();
            return;
          }

          // Top collision (landing on block)
          if (p.gravity > 0 && p.vy >= 0 && py + ph - p.vy * 0.05 <= blockY + 12) {
            p.y = blockY - ph;
            p.vy = 0;
            p.isGrounded = true;
            p.canDoubleJump = true;
            if (p.mode === 'CUBE') {
              p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
            }
          } else if (p.gravity < 0 && p.vy <= 0 && py - p.vy * 0.05 >= blockY + blockH - 12) {
            // Inverted gravity ceiling landing
            p.y = blockY + blockH;
            p.vy = 0;
            p.isGrounded = true;
            p.canDoubleJump = true;
            if (p.mode === 'CUBE') {
              p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
            }
          } else {
            // Frontal crash into block wall!
            this.killPlayer();
            return;
          }
        }
      }

      // 2. SPIKES (Precise triangular hit detection)
      if (obs.type.startsWith('SPIKE_')) {
        if (this.checkSpikeCollision(px, py, pw, ph, ox, oy, ow, oh, obs.type)) {
          this.killPlayer();
          return;
        }
      }

      // 3. JUMP PADS (Yellow, Pink, Gravity)
      if (obs.type.startsWith('PAD_')) {
        if (px + pw > ox + 6 && px < ox + ow - 6 && py + ph >= oy + oh - 14 && py <= oy + oh + 6) {
          if (obs.type === 'PAD_JUMP_YELLOW') {
            p.vy = -750 * p.gravity;
            p.isGrounded = false;
            p.canDoubleJump = true;
            soundEngine.playPadBounce();
            this.spawnPadBurst(ox + ow / 2, oy + oh / 2, '#EAB308');
          } else if (obs.type === 'PAD_JUMP_PINK') {
            p.vy = -540 * p.gravity;
            p.isGrounded = false;
            p.canDoubleJump = true;
            soundEngine.playPadBounce();
            this.spawnPadBurst(ox + ow / 2, oy + oh / 2, '#EC4899');
          } else if (obs.type === 'PAD_GRAVITY') {
            p.gravity = -p.gravity;
            p.vy = -450 * p.gravity;
            p.isGrounded = false;
            soundEngine.playGravityFlip();
            this.spawnGravityFlipBurst(ox + ow / 2, oy + oh / 2);
          }
        }
      }

      // 4. JUMP RINGS / ORBS (Trigger when jump is pressed inside radius)
      if (obs.type.startsWith('RING_')) {
        const orbCenterX = ox + ow / 2;
        const orbCenterY = oy + oh / 2;
        const pCenterX = px + pw / 2;
        const pCenterY = py + ph / 2;
        const dist = Math.hypot(pCenterX - orbCenterX, pCenterY - orbCenterY);

        if (dist < 42 && this.jumpPressedThisFrame) {
          if (obs.type === 'RING_JUMP_YELLOW') {
            p.vy = -680 * p.gravity;
            p.isGrounded = false;
            p.canDoubleJump = true;
            soundEngine.playOrbJump();
            this.spawnOrbBurst(orbCenterX, orbCenterY, '#EAB308');
          } else if (obs.type === 'RING_JUMP_PINK') {
            p.vy = -500 * p.gravity;
            p.isGrounded = false;
            p.canDoubleJump = true;
            soundEngine.playOrbJump();
            this.spawnOrbBurst(orbCenterX, orbCenterY, '#EC4899');
          } else if (obs.type === 'RING_GRAVITY') {
            p.gravity = -p.gravity;
            p.vy = -420 * p.gravity;
            p.isGrounded = false;
            soundEngine.playGravityFlip();
            this.spawnOrbBurst(orbCenterX, orbCenterY, '#06B6D4');
          } else if (obs.type === 'RING_DASH') {
            p.x += 70;
            p.vy = -200 * p.gravity;
            soundEngine.playOrbJump();
            this.spawnOrbBurst(orbCenterX, orbCenterY, '#22C55E');
          }
        }
      }

      // 5. PORTALS
      if (obs.type.startsWith('PORTAL_')) {
        if (px + pw > ox + 8 && px < ox + ow - 8 && py + ph > oy && py < oy + oh) {
          this.handlePortalCollision(obs.type, ox + ow / 2, oy + oh / 2);
        }
      }

      // 6. SECRET COINS
      if (obs.type === 'COIN' && !obs.collected) {
        const coinCenterX = ox + ow / 2;
        const coinCenterY = oy + oh / 2;
        const dist = Math.hypot(px + pw / 2 - coinCenterX, py + ph / 2 - coinCenterY);

        if (dist < 32) {
          obs.collected = true;
          soundEngine.playCoin();
          this.spawnCoinSparkles(coinCenterX, coinCenterY);

          // Find coin index (0, 1, 2)
          const coinIndex = this.level.obstacles.filter(o => o.type === 'COIN').indexOf(obs);
          if (coinIndex >= 0 && coinIndex < 3) {
            this.coinsCollectedThisRun[coinIndex] = true;
          }
        }
      }

      // 7. FINISH LINE
      if (obs.type === 'FINISH_LINE') {
        if (px + pw >= ox) {
          this.completeLevel();
          return;
        }
      }
    }
  }

  private checkSpikeCollision(
    px: number,
    py: number,
    pw: number,
    ph: number,
    ox: number,
    oy: number,
    ow: number,
    oh: number,
    spikeType: string
  ): boolean {
    // Inset hit box slightly for fair, fun gameplay
    const inset = 6;
    const hitPx = px + inset;
    const hitPy = py + inset;
    const hitPw = pw - inset * 2;
    const hitPh = ph - inset * 2;

    // Spike base bounds
    if (
      hitPx + hitPw < ox + 4 ||
      hitPx > ox + ow - 4 ||
      hitPy + hitPh < oy ||
      hitPy > oy + oh
    ) {
      return false;
    }

    // Precise triangular tip check
    if (spikeType === 'SPIKE_UP') {
      const tipX = ox + ow / 2;
      const tipY = oy;
      const baseLeftX = ox + 4;
      const baseRightX = ox + ow - 4;
      const baseY = oy + oh;

      return (
        this.isPointInTriangle(hitPx + hitPw / 2, hitPy + hitPh, tipX, tipY, baseLeftX, baseY, baseRightX, baseY) ||
        this.isPointInTriangle(hitPx, hitPy + hitPh, tipX, tipY, baseLeftX, baseY, baseRightX, baseY) ||
        this.isPointInTriangle(hitPx + hitPw, hitPy + hitPh, tipX, tipY, baseLeftX, baseY, baseRightX, baseY)
      );
    } else if (spikeType === 'SPIKE_DOWN') {
      const tipX = ox + ow / 2;
      const tipY = oy + oh;
      const baseLeftX = ox + 4;
      const baseRightX = ox + ow - 4;
      const baseY = oy;

      return (
        this.isPointInTriangle(hitPx + hitPw / 2, hitPy, tipX, tipY, baseLeftX, baseY, baseRightX, baseY)
      );
    }

    // Generic spike bounding hit
    return true;
  }

  private isPointInTriangle(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ): boolean {
    const area = 0.5 * (-y2 * x3 + y1 * (-x2 + x3) + x1 * (y2 - y3) + x2 * y3);
    const s = 1 / (2 * area) * (y1 * x3 - x1 * y3 + (y3 - y1) * px + (x1 - x3) * py);
    const t = 1 / (2 * area) * (x1 * y2 - y1 * x2 + (y1 - y2) * px + (x2 - x1) * py);
    return s >= 0 && t >= 0 && 1 - s - t >= 0;
  }

  private handlePortalCollision(portalType: string, cx: number, cy: number) {
    const p = this.player;

    if (portalType === 'PORTAL_SHIP' && p.mode !== 'SHIP') {
      p.mode = 'SHIP';
      p.rotation = 0;
      soundEngine.playPortal();
      this.spawnPortalTransformParticles(cx, cy, '#EC4899');
    } else if (portalType === 'PORTAL_BALL' && p.mode !== 'BALL') {
      p.mode = 'BALL';
      p.rotation = 0;
      soundEngine.playPortal();
      this.spawnPortalTransformParticles(cx, cy, '#F97316');
    } else if (portalType === 'PORTAL_WAVE' && p.mode !== 'WAVE') {
      p.mode = 'WAVE';
      p.rotation = 0;
      soundEngine.playPortal();
      this.spawnPortalTransformParticles(cx, cy, '#06B6D4');
    } else if (portalType === 'PORTAL_CUBE' && p.mode !== 'CUBE') {
      p.mode = 'CUBE';
      p.rotation = 0;
      soundEngine.playPortal();
      this.spawnPortalTransformParticles(cx, cy, '#22C55E');
    } else if (portalType === 'PORTAL_GRAVITY_UP' && p.gravity !== -1) {
      p.gravity = -1;
      soundEngine.playGravityFlip();
      this.spawnGravityFlipBurst(cx, cy);
    } else if (portalType === 'PORTAL_GRAVITY_DOWN' && p.gravity !== 1) {
      p.gravity = 1;
      soundEngine.playGravityFlip();
      this.spawnGravityFlipBurst(cx, cy);
    } else if (portalType === 'PORTAL_SPEED_SLOW' && p.speedMultiplier !== 0.8) {
      p.speedMultiplier = 0.8;
      soundEngine.playPortal();
    } else if (portalType === 'PORTAL_SPEED_NORMAL' && p.speedMultiplier !== 1.0) {
      p.speedMultiplier = 1.0;
      soundEngine.playPortal();
    } else if (portalType === 'PORTAL_SPEED_FAST' && p.speedMultiplier !== 1.5) {
      p.speedMultiplier = 1.5;
      soundEngine.playPortal();
    } else if (portalType === 'PORTAL_SPEED_HYPER' && p.speedMultiplier !== 2.0) {
      p.speedMultiplier = 2.0;
      soundEngine.playPortal();
    } else if (portalType === 'PORTAL_SIZE_MINI' && p.sizeState !== 'MINI') {
      p.sizeState = 'MINI';
      p.width = 22;
      p.height = 22;
      soundEngine.playPortal();
    } else if (portalType === 'PORTAL_SIZE_NORMAL' && p.sizeState !== 'NORMAL') {
      p.sizeState = 'NORMAL';
      p.width = 34;
      p.height = 34;
      soundEngine.playPortal();
    }
  }

  // ---------- DEATH & VICTORY ----------

  public killPlayer() {
    if (!this.isAlive) return;

    this.isAlive = false;
    soundEngine.playDeath();
    soundEngine.stopMusic();

    if (this.settings.screenShake) {
      this.screenShake = 16;
    }

    const pct = this.getPercentage();
    this.spawnDeathExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);

    if (this.onDeath) {
      this.onDeath(this.attempts, pct);
    }

    // Auto retry if enabled
    if (this.settings.autoRetry) {
      setTimeout(() => {
        if (!this.isAlive) {
          this.attempts++;
          this.resetPlayer(false);
          soundEngine.startMusic(this.level.songTrackId, this.level.bpm);
        }
      }, 700);
    }
  }

  private completeLevel() {
    if (this.isCompleted) return;

    this.isCompleted = true;
    soundEngine.playVictory();
    soundEngine.stopMusic();

    const elapsed = (performance.now() - this.startTime) / 1000;
    this.spawnVictoryFireworks();

    if (this.onVictory) {
      this.onVictory({
        timeSec: elapsed,
        attempts: this.attempts,
        coins: [...this.coinsCollectedThisRun],
      });
    }
  }

  public getPercentage(): number {
    const finishObs = this.level.obstacles.find(o => o.type === 'FINISH_LINE');
    const totalDist = finishObs ? finishObs.x * TILE_SIZE : this.level.length * TILE_SIZE;
    const progress = Math.max(0, Math.min(100, Math.floor((this.player.x / totalDist) * 100)));
    return progress;
  }

  // ---------- PARTICLES & TRAILS ----------

  private recordTrail() {
    this.trail.unshift({
      x: this.player.x,
      y: this.player.y,
      rotation: this.player.rotation,
      mode: this.player.mode,
      size: this.player.width,
      alpha: 0.65,
    });

    if (this.trail.length > 20) {
      this.trail.pop();
    }
  }

  private updateTrail(dt: number) {
    for (const t of this.trail) {
      t.alpha -= dt * 2.8;
    }
    this.trail = this.trail.filter(t => t.alpha > 0);
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }
    this.particles = this.particles.filter(p => p.life < p.maxLife);
  }

  private spawnDustParticles(x: number, y: number) {
    if (this.settings.particlesQuality === 'low') return;
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 60,
        size: Math.random() * 4 + 2,
        color: this.customization.primaryColor,
        alpha: 0.8,
        life: 0,
        maxLife: 0.35,
        shape: 'square',
      });
    }
  }

  private spawnDoubleJumpSparkles(x: number, y: number) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 160 + 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 2,
        color: '#EC4899',
        alpha: 1.0,
        life: 0,
        maxLife: 0.45,
        shape: 'circle',
      });
    }
  }

  private spawnShipThruster() {
    if (this.settings.particlesQuality === 'low') return;
    const p = this.player;
    this.particles.push({
      x: p.x,
      y: p.y + p.height / 2 + (Math.random() - 0.5) * 6,
      vx: -Math.random() * 220 - 100,
      vy: (Math.random() - 0.5) * 60,
      size: Math.random() * 6 + 3,
      color: Math.random() > 0.5 ? '#F97316' : '#EC4899',
      alpha: 0.9,
      life: 0,
      maxLife: 0.25,
      shape: 'square',
    });
  }

  private spawnOrbBurst(x: number, y: number, color: string) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 220 + 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 0.4,
        shape: 'circle',
      });
    }
  }

  private spawnPadBurst(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 160,
        vy: -Math.random() * 280 - 100,
        size: Math.random() * 6 + 3,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 0.35,
        shape: 'square',
      });
    }
  }

  private spawnGravityFlipBurst(x: number, y: number) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 50;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 2,
        color: '#06B6D4',
        alpha: 1.0,
        life: 0,
        maxLife: 0.4,
        shape: 'circle',
      });
    }
  }

  private spawnPortalTransformParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 240 + 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 7 + 3,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 0.5,
        shape: 'square',
      });
    }
  }

  private spawnCoinSparkles(x: number, y: number) {
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        color: '#EAB308',
        alpha: 1.0,
        life: 0,
        maxLife: 0.55,
        shape: 'circle',
      });
    }
  }

  private spawnDeathExplosion(x: number, y: number) {
    const count = this.settings.particlesQuality === 'high' ? 55 : 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 420 + 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 9 + 4,
        color: Math.random() > 0.4 ? this.customization.primaryColor : this.customization.secondaryColor,
        alpha: 1.0,
        life: 0,
        maxLife: 0.8,
        shape: Math.random() > 0.5 ? 'square' : 'circle',
      });
    }
  }

  private spawnVictoryFireworks() {
    const px = this.player.x;
    const py = this.player.y;
    const colors = ['#06B6D4', '#EC4899', '#22C55E', '#EAB308', '#A855F7'];

    for (let f = 0; f < 5; f++) {
      setTimeout(() => {
        const cx = px + (Math.random() - 0.5) * 300;
        const cy = py - Math.random() * 200;
        const col = colors[f % colors.length];

        for (let i = 0; i < 35; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 320 + 100;
          this.particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 6 + 3,
            color: col,
            alpha: 1.0,
            life: 0,
            maxLife: 0.7,
            shape: 'circle',
          });
        }
      }, f * 120);
    }
  }

  private spawnCheckpointParticles(x: number, y: number) {
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 140,
        vy: -Math.random() * 200 - 50,
        size: Math.random() * 5 + 2,
        color: '#22C55E',
        alpha: 1.0,
        life: 0,
        maxLife: 0.5,
        shape: 'square',
      });
    }
  }

  // ---------- RENDERING ----------

  public render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.save();

    // Screen Shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw dynamic background
    this.renderBackground(width, height);

    // Camera transform
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 2. Draw Floor & Ceiling
    this.renderFloorAndCeiling();

    // 3. Draw Checkpoints in Practice Mode
    if (this.isPracticeMode) {
      this.renderCheckpoints();
    }

    // 4. Draw Obstacles
    this.renderObstacles();

    // 5. Draw Trails & Player
    if (this.isAlive) {
      this.renderTrail();
      this.renderPlayer();
    }

    // 6. Draw Particles
    this.renderParticles();

    ctx.restore(); // Restore camera

    ctx.restore(); // Restore screen shake
  }

  private renderBackground(width: number, height: number) {
    const ctx = this.ctx;

    // Background Gradient based on Theme
    let topColor = '#030712';
    let midColor = '#0f172a';
    let gridColor = 'rgba(6, 182, 212, 0.15)';
    let eqColor = 'rgba(6, 182, 212, 0.25)';

    if (this.level.theme === 'INFERNO') {
      topColor = '#1c0512';
      midColor = '#2b0c1e';
      gridColor = 'rgba(236, 72, 153, 0.15)';
      eqColor = 'rgba(249, 115, 22, 0.25)';
    } else if (this.level.theme === 'QUANTUM') {
      topColor = '#041d14';
      midColor = '#092e22';
      gridColor = 'rgba(34, 197, 94, 0.15)';
      eqColor = 'rgba(168, 85, 247, 0.25)';
    }

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, midColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Animated Background Grid with Parallax
    const parallaxX = this.cameraX * 0.3;
    const gridSize = 60;
    const offsetX = -(parallaxX % gridSize);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Beat-reactive Equalizer Pillars in Background
    const barWidth = 40;
    const barSpacing = 65;
    const numBars = Math.ceil(width / barSpacing);
    const startBarIdx = Math.floor(parallaxX / barSpacing);

    ctx.fillStyle = eqColor;
    for (let i = 0; i < numBars; i++) {
      const idx = startBarIdx + i;
      const barX = idx * barSpacing - parallaxX;
      // Procedural height based on sine + beat pulse
      const wave = Math.sin(idx * 0.45 + performance.now() * 0.002);
      const barHeight = 40 + (wave * 0.5 + 0.5) * 110 + this.bgBeatPulse * 45;

      ctx.fillRect(barX, FLOOR_Y - barHeight, barWidth, barHeight);
    }
  }

  private renderFloorAndCeiling() {
    const ctx = this.ctx;
    const viewLeft = this.cameraX - 100;
    const viewRight = this.cameraX + this.canvas.width + 100;

    // Floor Base
    ctx.fillStyle = '#020617';
    ctx.fillRect(viewLeft, FLOOR_Y, viewRight - viewLeft, CANVAS_HEIGHT - FLOOR_Y);

    // Glowing Floor Top Edge Line
    ctx.strokeStyle = this.customization.primaryColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = this.customization.primaryColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(viewLeft, FLOOR_Y);
    ctx.lineTo(viewRight, FLOOR_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Floor Grid Texture
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = Math.floor(viewLeft / 40) * 40; x < viewRight; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Glowing Ceiling
    ctx.fillStyle = '#020617';
    ctx.fillRect(viewLeft, 0, viewRight - viewLeft, CEILING_Y);

    ctx.strokeStyle = this.customization.secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(viewLeft, CEILING_Y);
    ctx.lineTo(viewRight, CEILING_Y);
    ctx.stroke();
  }

  private renderCheckpoints() {
    const ctx = this.ctx;
    for (const cp of this.checkpoints) {
      ctx.fillStyle = '#22C55E';
      ctx.shadowColor = '#22C55E';
      ctx.shadowBlur = 10;

      // Diamond marker
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y - 12);
      ctx.lineTo(cp.x + 10, cp.y);
      ctx.lineTo(cp.x, cp.y + 12);
      ctx.lineTo(cp.x - 10, cp.y);
      ctx.closePath();
      ctx.fill();

      // Pole
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y + 12);
      ctx.lineTo(cp.x, FLOOR_Y);
      ctx.stroke();

      ctx.shadowBlur = 0;
    }
  }

  private renderObstacles() {
    const ctx = this.ctx;
    const viewLeft = this.cameraX - 100;
    const viewRight = this.cameraX + this.canvas.width + 100;

    for (const obs of this.level.obstacles) {
      const ox = obs.x * TILE_SIZE;
      const oy = FLOOR_Y - (obs.y + (obs.height || 1)) * TILE_SIZE;
      const ow = (obs.width || 1) * TILE_SIZE;
      const oh = (obs.height || 1) * TILE_SIZE;

      if (ox + ow < viewLeft || ox > viewRight) continue;

      // 1. SOLID BLOCKS
      if (obs.type === 'BLOCK' || obs.type === 'HALF_BLOCK') {
        const blockH = obs.type === 'HALF_BLOCK' ? oh / 2 : oh;
        const blockY = obs.type === 'HALF_BLOCK' ? oy + oh / 2 : oy;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(ox, blockY, ow, blockH);

        // Neon outline
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#06B6D4';
        ctx.shadowBlur = 8;
        ctx.strokeRect(ox, blockY, ow, blockH);

        // Inner cyber cross details
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox + 4, blockY + 4);
        ctx.lineTo(ox + ow - 4, blockY + blockH - 4);
        ctx.moveTo(ox + ow - 4, blockY + 4);
        ctx.lineTo(ox + 4, blockY + blockH - 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 2. SPIKES
      else if (obs.type.startsWith('SPIKE_')) {
        this.renderSpike(ox, oy, ow, oh, obs.type);
      }

      // 3. JUMP PADS
      else if (obs.type.startsWith('PAD_')) {
        this.renderPad(ox, oy, ow, oh, obs.type);
      }

      // 4. JUMP RINGS / ORBS
      else if (obs.type.startsWith('RING_')) {
        this.renderRing(ox, oy, ow, oh, obs.type);
      }

      // 5. PORTALS
      else if (obs.type.startsWith('PORTAL_')) {
        this.renderPortal(ox, oy, ow, oh, obs.type);
      }

      // 6. COINS
      else if (obs.type === 'COIN') {
        this.renderCoin(ox, oy, ow, oh, obs.collected);
      }

      // 7. FINISH LINE
      else if (obs.type === 'FINISH_LINE') {
        this.renderFinishLine(ox, oy, ow, oh);
      }
    }
  }

  private renderSpike(ox: number, oy: number, ow: number, oh: number, type: string) {
    const ctx = this.ctx;
    ctx.save();

    let color = '#EF4444'; // Red neon danger
    if (this.level.theme === 'INFERNO') color = '#F43F5E';
    if (this.level.theme === 'QUANTUM') color = '#EC4899';

    ctx.fillStyle = '#1e1014';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    if (type === 'SPIKE_UP') {
      ctx.moveTo(ox, oy + oh);
      ctx.lineTo(ox + ow / 2, oy);
      ctx.lineTo(ox + ow, oy + oh);
    } else if (type === 'SPIKE_DOWN') {
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + ow / 2, oy + oh);
      ctx.lineTo(ox + ow, oy);
    } else if (type === 'SPIKE_FLOAT') {
      // Diamond spike
      ctx.moveTo(ox + ow / 2, oy);
      ctx.lineTo(ox + ow, oy + oh / 2);
      ctx.lineTo(ox + ow / 2, oy + oh);
      ctx.lineTo(ox, oy + oh / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner glowing core
    ctx.fillStyle = color;
    ctx.beginPath();
    if (type === 'SPIKE_UP') {
      ctx.arc(ox + ow / 2, oy + oh * 0.65, 3.5, 0, Math.PI * 2);
    } else if (type === 'SPIKE_DOWN') {
      ctx.arc(ox + ow / 2, oy + oh * 0.35, 3.5, 0, Math.PI * 2);
    } else {
      ctx.arc(ox + ow / 2, oy + oh / 2, 4, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.restore();
  }

  private renderPad(ox: number, oy: number, ow: number, oh: number, type: string) {
    const ctx = this.ctx;
    let color = '#EAB308';
    if (type === 'PAD_JUMP_PINK') color = '#EC4899';
    if (type === 'PAD_GRAVITY') color = '#06B6D4';

    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Curved neon bounce pad
    const padY = oy + oh - 8;
    ctx.beginPath();
    ctx.ellipse(ox + ow / 2, padY, ow / 2 - 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pulse wave above pad
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const pulseY = padY - (performance.now() * 0.03 % 10);
    ctx.beginPath();
    ctx.ellipse(ox + ow / 2, pulseY, ow / 3, 3, 0, Math.PI, 0);
    ctx.stroke();

    ctx.restore();
  }

  private renderRing(ox: number, oy: number, ow: number, oh: number, type: string) {
    const ctx = this.ctx;
    let color = '#EAB308';
    if (type === 'RING_JUMP_PINK') color = '#EC4899';
    if (type === 'RING_GRAVITY') color = '#06B6D4';
    if (type === 'RING_DASH') color = '#22C55E';

    const cx = ox + ow / 2;
    const cy = oy + oh / 2;
    const time = performance.now() * 0.004;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;

    // Outer spinning ring
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Inner pulsating core
    const coreR = 7 + Math.sin(time * 3) * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderPortal(ox: number, oy: number, ow: number, oh: number, type: string) {
    const ctx = this.ctx;
    const cx = ox + ow / 2;
    const cy = oy + oh / 2;

    let color = '#22C55E';
    let label = 'CUBE';
    if (type === 'PORTAL_SHIP') { color = '#EC4899'; label = 'SHIP'; }
    if (type === 'PORTAL_BALL') { color = '#F97316'; label = 'BALL'; }
    if (type === 'PORTAL_WAVE') { color = '#06B6D4'; label = 'WAVE'; }
    if (type === 'PORTAL_GRAVITY_UP') { color = '#EAB308'; label = '▲ GRAV'; }
    if (type === 'PORTAL_GRAVITY_DOWN') { color = '#3B82F6'; label = '▼ GRAV'; }
    if (type === 'PORTAL_SPEED_FAST') { color = '#F97316'; label = '>> 1.5x'; }
    if (type === 'PORTAL_SPEED_HYPER') { color = '#EF4444'; label = '>>> 2x'; }
    if (type === 'PORTAL_SIZE_MINI') { color = '#D946EF'; label = 'MINI'; }
    if (type === 'PORTAL_SIZE_NORMAL') { color = '#10B981'; label = 'NORM'; }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;

    // Portal Oval Arch
    ctx.beginPath();
    ctx.ellipse(cx, cy, 18, oh / 2 + 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Swirling portal center
    ctx.fillStyle = color + '33';
    ctx.fill();

    // Portal icon label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Rajdhani';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    ctx.fillText(label, cx, cy - oh / 2 - 6);

    ctx.restore();
  }

  private renderCoin(ox: number, oy: number, ow: number, oh: number, collected?: boolean) {
    if (collected) return;
    const ctx = this.ctx;
    const cx = ox + ow / 2;
    const cy = oy + oh / 2;
    const time = performance.now() * 0.003;
    const squash = Math.cos(time * 3);

    ctx.save();
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#CA8A04';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#FACC15';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(2, 14 * Math.abs(squash)), 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Star icon inside coin
    if (Math.abs(squash) > 0.4) {
      ctx.fillStyle = '#78350F';
      ctx.font = 'bold 11px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', cx, cy);
    }

    ctx.restore();
  }

  private renderFinishLine(ox: number, oy: number, _ow: number, oh: number) {
    const ctx = this.ctx;
    ctx.save();

    // Finish Gate Pillars
    ctx.fillStyle = '#22C55E';
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur = 20;

    // Chequered vertical finish banner
    const bannerH = oh + 40;
    const rows = 12;
    const cols = 2;
    const cellH = bannerH / rows;
    const cellW = 14;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isWhite = (r + c) % 2 === 0;
        ctx.fillStyle = isWhite ? '#FFFFFF' : '#000000';
        ctx.fillRect(ox + c * cellW, oy - 20 + r * cellH, cellW, cellH);
      }
    }

    // Glowing border frame
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 3;
    ctx.strokeRect(ox, oy - 20, cellW * cols, bannerH);

    // FINISH text label above
    ctx.fillStyle = '#22C55E';
    ctx.font = 'bold 14px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', ox + cellW, oy - 30);

    ctx.restore();
  }

  // ---------- PLAYER & TRAIL RENDERING ----------

  private renderTrail() {
    const ctx = this.ctx;
    const trailStyle = this.customization.trailId;

    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      ctx.save();
      ctx.globalAlpha = t.alpha * 0.5;

      if (trailStyle === 'trail_ghost') {
        ctx.translate(t.x + t.size / 2, t.y + t.size / 2);
        ctx.rotate(t.rotation);
        ctx.strokeStyle = this.customization.primaryColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-t.size / 2, -t.size / 2, t.size, t.size);
      } else if (trailStyle === 'trail_rainbow') {
        const hue = (i * 30 + performance.now() * 0.2) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.fillRect(t.x + t.size * 0.2, t.y + t.size * 0.2, t.size * 0.6, t.size * 0.6);
      } else {
        // Classic neon trail beam
        ctx.fillStyle = this.customization.primaryColor;
        const s = t.size * (1 - i / this.trail.length * 0.6);
        ctx.fillRect(t.x + (t.size - s) / 2, t.y + (t.size - s) / 2, s, s);
      }

      ctx.restore();
    }
  }

  private renderPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(p.rotation);

    const halfW = p.width / 2;
    const halfH = p.height / 2;

    // Mode-specific player rendering
    if (p.mode === 'CUBE') {
      this.drawCubeMesh(ctx, halfW, halfH);
    } else if (p.mode === 'SHIP') {
      this.drawShipMesh(ctx, halfW, halfH);
    } else if (p.mode === 'BALL') {
      this.drawBallMesh(ctx, halfW, halfH);
    } else if (p.mode === 'WAVE') {
      this.drawWaveMesh(ctx, halfW, halfH);
    }

    ctx.restore();
  }

  private drawCubeMesh(ctx: CanvasRenderingContext2D, halfW: number, halfH: number) {
    const prim = this.customization.primaryColor;
    const sec = this.customization.secondaryColor;

    // Base glowing cube body
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-halfW, -halfH, halfW * 2, halfH * 2);

    ctx.strokeStyle = prim;
    ctx.lineWidth = 3;
    ctx.shadowColor = prim;
    ctx.shadowBlur = 14;
    ctx.strokeRect(-halfW, -halfH, halfW * 2, halfH * 2);
    ctx.shadowBlur = 0;

    // Skin specific designs
    const skin = this.customization.skinId;

    if (skin === 'cyber_visor') {
      // Visor stripe
      ctx.fillStyle = sec;
      ctx.fillRect(-halfW + 4, -halfH + 8, halfW * 2 - 8, 8);
    } else if (skin === 'matrix_grid') {
      // Grid lines
      ctx.strokeStyle = sec;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-halfW + 6, -halfH + 6, halfW * 2 - 12, halfH * 2 - 12);
    } else if (skin === 'void_skull' || skin === 'apex_overlord') {
      // Angular eye slits
      ctx.fillStyle = sec;
      ctx.beginPath();
      ctx.moveTo(-halfW + 6, -halfH + 8);
      ctx.lineTo(-halfW + 12, -halfH + 14);
      ctx.lineTo(-halfW + 6, -halfH + 16);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(halfW - 6, -halfH + 8);
      ctx.lineTo(halfW - 12, -halfH + 14);
      ctx.lineTo(halfW - 6, -halfH + 16);
      ctx.fill();
    } else {
      // Classic Core Inner Square
      ctx.fillStyle = sec;
      ctx.fillRect(-halfW + 8, -halfH + 8, halfW * 2 - 16, halfH * 2 - 16);
    }
  }

  private drawShipMesh(ctx: CanvasRenderingContext2D, halfW: number, halfH: number) {
    const prim = this.customization.primaryColor;
    const sec = this.customization.secondaryColor;

    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = prim;
    ctx.lineWidth = 3;
    ctx.shadowColor = prim;
    ctx.shadowBlur = 14;

    // Rocket / Spaceship fuselage shape
    ctx.beginPath();
    ctx.moveTo(halfW + 4, 0); // Nose cone
    ctx.lineTo(-halfW, -halfH);
    ctx.lineTo(-halfW + 6, 0);
    ctx.lineTo(-halfW, halfH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit dome
    ctx.fillStyle = sec;
    ctx.beginPath();
    ctx.arc(0, 0, halfW * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  private drawBallMesh(ctx: CanvasRenderingContext2D, halfW: number, _halfH: number) {
    const prim = this.customization.primaryColor;
    const sec = this.customization.secondaryColor;
    const radius = halfW;

    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = prim;
    ctx.lineWidth = 3;
    ctx.shadowColor = prim;
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner rotating spikes/gears
    ctx.fillStyle = sec;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.fillRect(Math.cos(angle) * (radius * 0.5) - 3, Math.sin(angle) * (radius * 0.5) - 3, 6, 6);
    }

    ctx.shadowBlur = 0;
  }

  private drawWaveMesh(ctx: CanvasRenderingContext2D, halfW: number, halfH: number) {
    const prim = this.customization.primaryColor;
    const sec = this.customization.secondaryColor;

    ctx.fillStyle = sec;
    ctx.strokeStyle = prim;
    ctx.lineWidth = 3;
    ctx.shadowColor = prim;
    ctx.shadowBlur = 16;

    // Razor Sharp Dart
    ctx.beginPath();
    ctx.moveTo(halfW + 4, 0);
    ctx.lineTo(-halfW, -halfH + 2);
    ctx.lineTo(-halfW + 8, 0);
    ctx.lineTo(-halfW, halfH - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  private renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }
  }
}
