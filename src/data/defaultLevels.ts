import { LevelData, Obstacle, SkinDefinition, TrailDefinition, DeathEffectDefinition } from '../types/game';

// Helper to create obstacles easily
const createObs = (type: Obstacle['type'], x: number, y: number, width = 1, height = 1): Obstacle => ({
  id: `${type}_${x}_${y}_${Math.random().toString(36).substr(2, 5)}`,
  type,
  x,
  y,
  width,
  height,
});

// ---------- LEVEL 1: CYBER GENESIS (EASY) ----------
const level1Obstacles: Obstacle[] = [
  // Intro jump timing
  createObs('SPIKE_UP', 18, 0),
  createObs('SPIKE_UP', 26, 0),
  createObs('BLOCK', 32, 0),
  createObs('BLOCK', 33, 0),
  createObs('SPIKE_UP', 34, 0),

  // Step up platforms
  createObs('BLOCK', 40, 0),
  createObs('BLOCK', 41, 0),
  createObs('BLOCK', 42, 1),
  createObs('BLOCK', 43, 1),
  createObs('SPIKE_UP', 44, 0),
  createObs('SPIKE_UP', 45, 0),
  createObs('BLOCK', 46, 0),

  // Secret Coin 1 (Above high platform reachable by yellow pad)
  createObs('PAD_JUMP_YELLOW', 52, 0),
  createObs('BLOCK', 56, 4),
  createObs('BLOCK', 57, 4),
  createObs('COIN', 57, 5),
  createObs('SPIKE_UP', 55, 0),
  createObs('SPIKE_UP', 56, 0),
  createObs('SPIKE_UP', 57, 0),

  // Ship Mode Portal Transition
  createObs('PORTAL_SHIP', 68, 2),

  // Ship flight section (Ceiling blocks at y=9, obstacles floating)
  createObs('BLOCK', 70, 8, 20, 1),
  createObs('SPIKE_DOWN', 75, 7),
  createObs('SPIKE_UP', 80, 0),
  createObs('SPIKE_UP', 81, 0),
  createObs('BLOCK', 85, 4, 2, 2),
  createObs('SPIKE_DOWN', 92, 7),
  createObs('SPIKE_UP', 96, 0),

  // Secret Coin 2 (Narrow bottom tunnel in ship mode)
  createObs('BLOCK', 102, 2, 8, 1),
  createObs('COIN', 105, 0.5),
  createObs('SPIKE_DOWN', 105, 7),

  createObs('BLOCK', 114, 3, 2, 4),
  createObs('SPIKE_UP', 120, 0),

  // Return to Cube Mode
  createObs('PORTAL_CUBE', 128, 2),

  // Jump Orbs and Double Jump Section
  createObs('SPIKE_UP', 136, 0),
  createObs('SPIKE_UP', 137, 0),
  createObs('RING_JUMP_YELLOW', 140, 2),
  createObs('SPIKE_UP', 142, 0),
  createObs('SPIKE_UP', 143, 0),
  createObs('BLOCK', 146, 1, 3, 1),
  createObs('SPIKE_UP', 151, 0),
  createObs('SPIKE_UP', 152, 0),

  // Secret Coin 3 (Double jump challenge over floating spike cluster)
  createObs('BLOCK', 158, 2, 2, 1),
  createObs('SPIKE_FLOAT', 163, 2),
  createObs('COIN', 163, 4),
  createObs('BLOCK', 167, 1, 2, 1),

  // Final stretch
  createObs('PAD_JUMP_PINK', 174, 0),
  createObs('BLOCK', 178, 3, 3, 1),
  createObs('SPIKE_UP', 183, 0),
  createObs('SPIKE_UP', 184, 0),
  createObs('SPIKE_UP', 185, 0),
  createObs('RING_JUMP_YELLOW', 188, 2),
  createObs('BLOCK', 192, 0, 4, 1),

  // Finish Line
  createObs('FINISH_LINE', 202, 0, 1, 8),
];

// ---------- LEVEL 2: NEON INFERNO (NORMAL) ----------
const level2Obstacles: Obstacle[] = [
  // Speed boost
  createObs('PORTAL_SPEED_FAST', 8, 2), // 1.5x speed
  createObs('SPIKE_UP', 16, 0),
  createObs('SPIKE_UP', 17, 0),
  createObs('BLOCK', 22, 1, 2, 1),
  createObs('SPIKE_UP', 26, 0),
  createObs('SPIKE_UP', 27, 0),
  createObs('RING_JUMP_YELLOW', 31, 2),
  createObs('SPIKE_UP', 33, 0),
  createObs('SPIKE_UP', 34, 0),

  // Ball Mode Portal (Gravity switch on click)
  createObs('PORTAL_BALL', 44, 2),

  // Ceiling and Floor for Ball mode
  createObs('BLOCK', 46, 7, 40, 1),
  createObs('SPIKE_UP', 52, 0),
  createObs('SPIKE_DOWN', 58, 6),
  createObs('SPIKE_UP', 64, 0),
  createObs('SPIKE_UP', 65, 0),

  // Secret Coin 1 (High ceiling niche in Ball mode)
  createObs('BLOCK', 70, 5, 3, 1),
  createObs('COIN', 71, 6),
  createObs('SPIKE_UP', 71, 0),
  createObs('SPIKE_DOWN', 76, 6),
  createObs('SPIKE_UP', 80, 0),

  // Gravity Invert Section (Cube with reversed gravity)
  createObs('PORTAL_CUBE', 88, 2),
  createObs('PORTAL_GRAVITY_UP', 92, 2),
  createObs('BLOCK', 93, 8, 30, 1), // Ceiling to run on
  createObs('SPIKE_DOWN', 100, 7),
  createObs('SPIKE_DOWN', 101, 7),
  createObs('RING_GRAVITY', 106, 5), // Flips gravity mid-flight
  createObs('SPIKE_UP', 110, 0),
  createObs('SPIKE_UP', 111, 0),

  // Secret Coin 2 (Requires precise gravity flip timing)
  createObs('COIN', 115, 4),
  createObs('PORTAL_GRAVITY_DOWN', 122, 2),

  // Wave Mode Section
  createObs('PORTAL_WAVE', 132, 2),
  createObs('BLOCK', 134, 7, 50, 1), // Ceiling
  createObs('BLOCK', 142, 0, 4, 3),  // Slanted obstacles
  createObs('BLOCK', 150, 4, 4, 3),
  createObs('BLOCK', 158, 0, 4, 3),

  // Secret Coin 3 (Wave precision inside zigzag tunnel)
  createObs('COIN', 166, 3.5),
  createObs('BLOCK', 168, 5, 3, 2),
  createObs('BLOCK', 174, 0, 3, 2),

  // Return to Cube mode for intense finale
  createObs('PORTAL_CUBE', 186, 2),
  createObs('PORTAL_SPEED_NORMAL', 188, 2),
  createObs('SPIKE_UP', 196, 0),
  createObs('SPIKE_UP', 197, 0),
  createObs('PAD_JUMP_YELLOW', 202, 0),
  createObs('RING_JUMP_PINK', 208, 4),
  createObs('BLOCK', 214, 2, 3, 1),
  createObs('SPIKE_UP', 220, 0),
  createObs('SPIKE_UP', 221, 0),
  createObs('SPIKE_UP', 222, 0),
  createObs('RING_DASH', 226, 2), // Boost dash

  // Finish Line
  createObs('FINISH_LINE', 238, 0, 1, 8),
];

// ---------- LEVEL 3: QUANTUM OVERDRIVE (HARD) ----------
const level3Obstacles: Obstacle[] = [
  // Fast 155 BPM + Hyper Speed 2.0x
  createObs('PORTAL_SPEED_HYPER', 6, 2),
  createObs('SPIKE_UP', 14, 0),
  createObs('SPIKE_UP', 15, 0),
  createObs('SPIKE_UP', 16, 0),
  createObs('RING_JUMP_YELLOW', 20, 2.5),
  createObs('SPIKE_UP', 23, 0),
  createObs('SPIKE_UP', 24, 0),
  createObs('BLOCK', 27, 2, 2, 1),
  createObs('SPIKE_UP', 32, 0),
  createObs('SPIKE_UP', 33, 0),
  createObs('SPIKE_UP', 34, 0),

  // Mini Portal Section
  createObs('PORTAL_SIZE_MINI', 38, 2),
  createObs('SPIKE_UP', 44, 0),
  createObs('SPIKE_UP', 45, 0),
  createObs('PAD_JUMP_PINK', 48, 0),
  createObs('BLOCK', 52, 3, 2, 1),
  createObs('SPIKE_UP', 56, 0),
  createObs('SPIKE_UP', 57, 0),

  // Secret Coin 1 (Mini cube high gap)
  createObs('COIN', 58, 5),
  createObs('PORTAL_SIZE_NORMAL', 64, 2),

  // Wave Mode High Speed Challenge
  createObs('PORTAL_WAVE', 72, 2),
  createObs('BLOCK', 74, 8, 60, 1), // Ceiling
  createObs('BLOCK', 80, 0, 3, 4),
  createObs('BLOCK', 88, 4, 3, 4),
  createObs('BLOCK', 96, 0, 3, 5),
  createObs('BLOCK', 104, 5, 3, 3),

  // Secret Coin 2 (Risky wave dive)
  createObs('COIN', 112, 1.5),
  createObs('BLOCK', 116, 0, 3, 3),
  createObs('BLOCK', 122, 4, 3, 4),

  // Ball Mode + Gravity shifts
  createObs('PORTAL_BALL', 134, 2),
  createObs('SPIKE_UP', 140, 0),
  createObs('SPIKE_DOWN', 146, 7),
  createObs('SPIKE_UP', 152, 0),
  createObs('SPIKE_UP', 153, 0),
  createObs('SPIKE_DOWN', 158, 7),
  createObs('SPIKE_DOWN', 159, 7),

  // Ship Mode tight laser run
  createObs('PORTAL_SHIP', 168, 2),
  createObs('BLOCK', 170, 8, 50, 1),
  createObs('SPIKE_DOWN', 176, 7),
  createObs('SPIKE_UP', 182, 0),
  createObs('SPIKE_UP', 183, 0),
  createObs('BLOCK', 188, 3, 2, 2),

  // Secret Coin 3 (Ship precision inside narrow spikes)
  createObs('COIN', 194, 7),
  createObs('SPIKE_DOWN', 194, 6),
  createObs('SPIKE_UP', 200, 0),
  createObs('SPIKE_DOWN', 206, 7),

  // Final Cube Climax
  createObs('PORTAL_CUBE', 214, 2),
  createObs('PORTAL_SPEED_FAST', 216, 2),
  createObs('SPIKE_UP', 224, 0),
  createObs('SPIKE_UP', 225, 0),
  createObs('RING_JUMP_YELLOW', 229, 2),
  createObs('RING_JUMP_PINK', 234, 4),
  createObs('BLOCK', 240, 3, 2, 1),
  createObs('SPIKE_UP', 244, 0),
  createObs('SPIKE_UP', 245, 0),
  createObs('SPIKE_UP', 246, 0),
  createObs('PAD_JUMP_YELLOW', 252, 0),
  createObs('BLOCK', 258, 4, 3, 1),
  createObs('SPIKE_UP', 264, 0),
  createObs('SPIKE_UP', 265, 0),

  // Finish Line
  createObs('FINISH_LINE', 276, 0, 1, 8),
];

export const DEFAULT_LEVELS: LevelData[] = [
  {
    id: 'level_1',
    name: 'Cyber Genesis',
    difficulty: 'EASY',
    theme: 'CYBER',
    bpm: 128,
    songTrackId: 0,
    length: 215,
    obstacles: level1Obstacles,
    secretCoins: 3,
    stars: 1,
  },
  {
    id: 'level_2',
    name: 'Neon Inferno',
    difficulty: 'NORMAL',
    theme: 'INFERNO',
    bpm: 140,
    songTrackId: 1,
    length: 250,
    obstacles: level2Obstacles,
    secretCoins: 3,
    stars: 3,
  },
  {
    id: 'level_3',
    name: 'Quantum Overdrive',
    difficulty: 'HARD',
    theme: 'QUANTUM',
    bpm: 155,
    songTrackId: 2,
    length: 290,
    obstacles: level3Obstacles,
    secretCoins: 3,
    stars: 5,
  },
];

// ---------- GARAGE / CUSTOMIZATION DEFINITIONS ----------

export const SKINS_DATA: SkinDefinition[] = [
  {
    id: 'classic_cube',
    name: 'Neon Core',
    costCoins: 0,
    unlockedByDefault: true,
    iconType: 'cube',
    previewColor: '#06B6D4',
    description: 'Klassik yorqin neon kub',
  },
  {
    id: 'cyber_visor',
    name: 'Cyber Visor',
    costCoins: 2,
    unlockedByDefault: false,
    iconType: 'cube',
    previewColor: '#EC4899',
    description: 'Futuristik robot ko‘zoynakli kub',
  },
  {
    id: 'matrix_grid',
    name: 'Matrix Glyph',
    costCoins: 4,
    unlockedByDefault: false,
    iconType: 'cube',
    previewColor: '#22C55E',
    description: 'Kiber raqamli matritsa dizayni',
  },
  {
    id: 'plasma_sun',
    name: 'Solar Flare',
    costCoins: 6,
    unlockedByDefault: false,
    iconType: 'cube',
    previewColor: '#F59E0B',
    description: 'Quyosh plazmasi alangasi',
  },
  {
    id: 'void_skull',
    name: 'Neon Phantom',
    costCoins: 8,
    unlockedByDefault: false,
    iconType: 'cube',
    previewColor: '#A855F7',
    description: 'Yashirin sharpasimon kiber kub',
  },
  {
    id: 'apex_overlord',
    name: 'Apex Overdrive',
    costCoins: 12,
    unlockedByDefault: false,
    iconType: 'cube',
    previewColor: '#EF4444',
    description: 'Master o‘yinchilar uchun eksklyuziv',
  },
];

export const TRAILS_DATA: TrailDefinition[] = [
  {
    id: 'trail_classic',
    name: 'Neon Beam',
    costCoins: 0,
    unlockedByDefault: true,
    type: 'classic',
    description: 'Toza neon chiziqli trail',
  },
  {
    id: 'trail_ghost',
    name: 'Ghost Echoes',
    costCoins: 3,
    unlockedByDefault: false,
    type: 'ghost',
    description: 'Orqada qoladigan shaffof siluetlar',
  },
  {
    id: 'trail_sparkles',
    name: 'Cyber Sparkles',
    costCoins: 5,
    unlockedByDefault: false,
    type: 'sparkles',
    description: 'Uchib turuvchi neon zarrachalar',
  },
  {
    id: 'trail_fire',
    name: 'Plasma Flame',
    costCoins: 7,
    unlockedByDefault: false,
    type: 'fire',
    description: 'Yonib turgan plazma olovi',
  },
  {
    id: 'trail_rainbow',
    name: 'Prism Rainbow',
    costCoins: 10,
    unlockedByDefault: false,
    type: 'rainbow',
    description: 'Kamalak rangidagi yorqin puls',
  },
];

export const DEATH_EFFECTS_DATA: DeathEffectDefinition[] = [
  {
    id: 'death_burst',
    name: 'Neon Burst',
    costCoins: 0,
    unlockedByDefault: true,
    type: 'burst',
    description: 'Klassik neon zarrachalar portlashi',
  },
  {
    id: 'death_shockwave',
    name: 'Quantum Shockwave',
    costCoins: 3,
    unlockedByDefault: false,
    type: 'shockwave',
    description: 'Kengayuvchi kuchli neon to‘lqini',
  },
  {
    id: 'death_pixel',
    name: 'Pixel Scatter',
    costCoins: 6,
    unlockedByDefault: false,
    type: 'pixel',
    description: 'Pikselli kiber parchalanib ketish',
  },
  {
    id: 'death_supernova',
    name: 'Supernova Explosion',
    costCoins: 9,
    unlockedByDefault: false,
    type: 'supernova',
    description: 'Ulkan yulduz portlashi effekti',
  },
];

export const COLOR_PALETTES = [
  { id: 'cyan', name: 'Cyan Neon', hex: '#06B6D4' },
  { id: 'magenta', name: 'Hot Pink', hex: '#EC4899' },
  { id: 'green', name: 'Toxic Green', hex: '#22C55E' },
  { id: 'yellow', name: 'Volt Yellow', hex: '#EAB308' },
  { id: 'purple', name: 'Ultra Violet', hex: '#A855F7' },
  { id: 'orange', name: 'Blaze Orange', hex: '#F97316' },
  { id: 'white', name: 'Pure White', hex: '#F8FAFC' },
  { id: 'red', name: 'Crimson Red', hex: '#EF4444' },
];
