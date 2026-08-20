export type GameMode = 'CUBE' | 'SHIP' | 'BALL' | 'WAVE';

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'CUSTOM';

export type LevelTheme = 'CYBER' | 'INFERNO' | 'QUANTUM' | 'NEON_CITY';

export type ObstacleType =
  | 'BLOCK'
  | 'HALF_BLOCK'
  | 'SPIKE_UP'
  | 'SPIKE_DOWN'
  | 'SPIKE_LEFT'
  | 'SPIKE_RIGHT'
  | 'SPIKE_FLOAT'
  | 'PAD_JUMP_YELLOW' // Big jump
  | 'PAD_JUMP_PINK'   // Small jump
  | 'PAD_GRAVITY'     // Invert gravity
  | 'RING_JUMP_YELLOW'// Jump orb (click inside)
  | 'RING_JUMP_PINK'  // Small jump orb
  | 'RING_GRAVITY'    // Gravity flip orb
  | 'RING_DASH'       // Forward boost dash orb
  | 'PORTAL_CUBE'
  | 'PORTAL_SHIP'
  | 'PORTAL_BALL'
  | 'PORTAL_WAVE'
  | 'PORTAL_GRAVITY_DOWN'
  | 'PORTAL_GRAVITY_UP'
  | 'PORTAL_SPEED_SLOW'   // 0.8x
  | 'PORTAL_SPEED_NORMAL' // 1.0x
  | 'PORTAL_SPEED_FAST'   // 1.5x
  | 'PORTAL_SPEED_HYPER'  // 2.0x
  | 'PORTAL_SIZE_NORMAL'
  | 'PORTAL_SIZE_MINI'
  | 'COIN'
  | 'CHECKPOINT'
  | 'FINISH_LINE';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number; // Grid column (1 unit = 32px or 40px)
  y: number; // Grid row (0 is bottom floor, goes up to 15)
  width?: number; // In grid units
  height?: number; // In grid units
  collected?: boolean; // For coins
}

export interface LevelData {
  id: string;
  name: string;
  difficulty: Difficulty;
  theme: LevelTheme;
  bpm: number;
  songTrackId: number; // 0, 1, 2, 3
  length: number; // In grid units (e.g. 300 = ~12,000px)
  obstacles: Obstacle[];
  secretCoins: number;
  author?: string;
  stars: number;
}

export interface PlayerCustomization {
  primaryColor: string;
  secondaryColor: string;
  skinId: string;
  trailId: string;
  deathEffectId: string;
}

export interface SkinDefinition {
  id: string;
  name: string;
  costCoins: number;
  unlockedByDefault: boolean;
  iconType: 'cube' | 'ship' | 'ball' | 'wave';
  previewColor: string;
  description: string;
}

export interface TrailDefinition {
  id: string;
  name: string;
  costCoins: number;
  unlockedByDefault: boolean;
  type: 'classic' | 'ghost' | 'sparkles' | 'fire' | 'rainbow' | 'laser';
  description: string;
}

export interface DeathEffectDefinition {
  id: string;
  name: string;
  costCoins: number;
  unlockedByDefault: boolean;
  type: 'burst' | 'shockwave' | 'pixel' | 'supernova';
  description: string;
}

export interface LevelStats {
  attempts: number;
  bestPercentage: number;
  completed: boolean;
  coinsCollected: boolean[]; // Array of boolean for the 3 secret coins
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  particlesQuality: 'low' | 'medium' | 'high';
  showFps: boolean;
  autoRetry: boolean;
}

export interface CheckpointData {
  x: number;
  y: number;
  vy: number;
  mode: GameMode;
  gravity: number;
  speedMultiplier: number;
  sizeState: 'NORMAL' | 'MINI';
  percentage: number;
  cameraX: number;
}
